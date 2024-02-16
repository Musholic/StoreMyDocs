import {Injectable} from '@angular/core';
import {FileService} from "../file-list/file.service";
import {BehaviorSubject, concatMap, filter, find, from, map, mergeMap, Observable, of, tap, zip} from "rxjs";
import {FileElement, isFileElement} from "../file-list/file-list.component";
import {Rule, RuleRepository} from "./rule.repository";
import {FilesCacheService} from "../files-cache/files-cache.service";
import {BackgroundTaskService, Progress} from "../background-task/background-task.service";
import {fromPromise} from "rxjs/internal/observable/innerFrom";
import * as pdfjs from "pdfjs-dist";
import {TextItem} from "pdfjs-dist/types/src/display/api";

export interface RuleResult {
  rule: Rule,
  value: boolean
}

export interface RuleWorkerParams {
  script: string,
  fileName: string,
  fileContent: string,
}

interface WorkerResponse {
  data: boolean;
}

@Injectable()
export class RuleService {
  private worker: Worker;

  constructor(private fileService: FileService, private ruleRepository: RuleRepository,
              private filesCacheService: FilesCacheService, private backgroundTaskService: BackgroundTaskService) {
    // Create a new
    this.worker = new Worker(new URL('./rule.worker', import.meta.url));
    const pdfWorkerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
    pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;
  }

  private static isRuleRunNeeded(rules: Rule[], file: FileElement) {
    for (const rule of rules) {
      const previousFileRun = rule.fileRuns?.find(fileRun => fileRun.id === file.id);
      if (previousFileRun && previousFileRun.value) {
        // We already know the matching rule
        return false;
      }
      if (!previousFileRun) {
        // There is a rule we need to run which has not been run before
        return true;
      }
    }
    // All rules have already been run
    return false;
  }

  runAll(): Observable<void> {
    return from(this.ruleRepository.findAll())
      .pipe(mergeMap(rules => {
        const fileOrFolders = this.filesCacheService.getAll()
        // Get all files
        const files = fileOrFolders
          .filter((file): file is FileElement => isFileElement(file));

        // Run the script for each file to get the associated category
        // The amount of step is one download per file and one per rule running for each file
        const stepAmount = files.length * (1 + rules.length);
        const progress = this.backgroundTaskService.showProgress('Running all rules', stepAmount);
        return this.runAllAndSetCategories(files, rules, progress)
          .pipe(tap({complete: () => progress.next({value: 100, index: stepAmount})}));
      }));
  }

  create(rule: Rule) {
    return this.ruleRepository.create(rule);
  }

  findAll(): Promise<Rule[]> {
    return this.ruleRepository.findAll();
  }

  delete(rule: Rule) {
    return this.ruleRepository.delete(rule);
  }

  update(rule: Rule): Promise<void> {
    return this.ruleRepository.update(rule);
  }

  async getFileToMatchingRuleMap(): Promise<Map<string, string>> {
    const result = new Map<string, string>();
    const rules = await this.ruleRepository.findAll();
    // Search for rules which have fileRuns evaluated to true
    for (const rule of rules) {
      if (rule.fileRuns) {
        for (const fileRun of rule.fileRuns) {
          if (fileRun.value) {
            result.set(fileRun.id, rule.name);
          }
        }
      }
    }
    return result;
  }

  scheduleRunAll() {
    return this.backgroundTaskService.schedule('runAllRules', () => this.runAll());
  }

  /**
   * Run the given rules on the given files and set the associated category for each file that got a matching rule
   */
  private runAllAndSetCategories(files: FileElement[], rules: Rule[], progress: BehaviorSubject<Progress>) {
    return zip(from(files)
      .pipe(concatMap((file, fileIndex) => {
        const progressIndex = 1 + fileIndex * (rules.length + 1);
        if (!RuleService.isRuleRunNeeded(rules, file)) {
          return of(undefined);
        }
        return this.getFileContent(file, progress, progressIndex).pipe(
          mergeMap(fileContent => {
            // Find the first rule which matches
            return this.runAllRules(rules, progress, progressIndex, file, fileContent)
              .pipe(mergeMap(result => {
                if (result) {
                  return this.findOrCreateCategories(Object.assign([], result.rule.category), this.filesCacheService.getBaseFolder())
                    // There is no need to set the category if the current category is correct
                    .pipe(filter(categoryId => file.parentId !== categoryId),
                      mergeMap(categoryId => {
                        return this.fileService.setCategory(file.id, categoryId);
                      }));
                } else {
                  return of();
                }
              }));
          }));
      })))
      .pipe(map(() => {
      }));

  }

  private runAllRules(rulesToRun: Rule[], progress: BehaviorSubject<Progress>, progressIndex: number, file: FileElement, fileContent: string) {
    return from(rulesToRun).pipe(concatMap((rule, ruleIndex) => {
        const previousFileRun = rule.fileRuns?.find(fileRun => fileRun.id === file.id);
        if (previousFileRun) {
          // The rule was run previously, so we already know the result
          const result: RuleResult = {
            rule: rule,
            value: previousFileRun.value
          };
          return of(result);
        }
        progress.next({
          index: progressIndex + 1 + ruleIndex,
          value: 0,
          description: "Running rule '" + rule.name + "' for '" + file.name + "'"
        });
        return this.run(rule, file, fileContent, progress, progressIndex + 1 + ruleIndex)
          .pipe(tap((result) => {
            // Add this file run to the rule fileRuns to avoid doing the same run again
            const rule = result.rule;
            if (!rule.fileRuns) {
              rule.fileRuns = [];
            }
            rule.fileRuns.push({id: file.id, value: result.value});
            this.ruleRepository.update(rule);
          }));
      }),
      // Find will stop running further scripts once we got a match
      find(result => {
        return result.value;
      }));
  }

  private getFileContent(file: FileElement, progress: BehaviorSubject<Progress>, progressIndex: number) {
    if (this.isFileContentReadable(file)) {
      progress.next({
        index: progressIndex,
        value: 0,
        description: "Downloading file content of '" + file.name + "'"
      });
      return this.fileService.downloadFile(file, progress)
        .pipe(mergeMap(blobContent => {
          if (file.mimeType === 'application/pdf') {
            return fromPromise(blobContent.arrayBuffer()
              .then(arrayBuffer => pdfjs.getDocument(arrayBuffer).promise)
              .then(pdfDocument => pdfDocument.getPage(1))
              .then(firstPage => firstPage.getTextContent())
              .then(textContent => textContent.items
                .filter((item): item is TextItem => item !== undefined)
                .map(item => "" + item.str).join()));
          } else {
            return fromPromise(blobContent.text());
          }
        }));
    } else {
      return of("");
    }
  }

  private isFileContentReadable(file: FileElement) {
    return file.mimeType.startsWith('text/') || file.mimeType === 'application/pdf';
  }

  private run(rule: Rule, file: FileElement, fileContent: string, progress: BehaviorSubject<Progress>, progressIndex: number): Observable<RuleResult> {
    return new Observable(subscriber => {
      this.worker.onmessage = ({data}: WorkerResponse) => {
        subscriber.next({rule: rule, value: data});
        subscriber.complete();
      };
      const params: RuleWorkerParams = {
        script: rule.script,
        fileName: file.name,
        fileContent: fileContent
      };
      this.worker.postMessage(params);
    });
  }

  // TODO: move and refactor duplicate to FileService
  private findOrCreateCategories(categories: string[], categoryId: string): Observable<string> {
    const categoryName = categories.shift();
    if (categoryName !== undefined) {
      return this.fileService.findOrCreateFolder(categoryName, categoryId)
        .pipe(mergeMap(newCategoryId => {
          return this.findOrCreateCategories(categories, newCategoryId);
        }));
    }
    return of(categoryId);
  }
}
