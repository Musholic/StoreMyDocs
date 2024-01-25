import {Injectable} from '@angular/core';
import {FileService} from "../file-list/file.service";
import {BehaviorSubject, concatMap, filter, find, from, last, map, mergeMap, Observable, of, tap, zip} from "rxjs";
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

  runAll(): Observable<void> {
    return from(this.ruleRepository.findAll())
      .pipe(mergeMap(rules => {
        let fileOrFolders = this.filesCacheService.getAll()
        // Get all files
        let files = fileOrFolders.filter(file => isFileElement(file))
          .map(value => value as FileElement);

        // Run the script for each file to get the associated category
        // The amount of step is one download per file and one per rule running for each file
        let stepAmount = files.length * (1 + rules.length);
        let progress = this.backgroundTaskService.showProgress('Running all rules', '', stepAmount);
        return this.computeFileToCategoryMap(files, rules, progress)
          .pipe(mergeMap(fileToCategoryMap => {
            // Set the computed category for each files
            return this.setAllFileCategory(fileToCategoryMap);
          }), tap({complete: () => progress.next({value: 100, index: stepAmount})}))
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

  /**
   * Run the given rules on the given files and return the associated category for each file that got a matching rule
   */
  private computeFileToCategoryMap(files: FileElement[], rules: Rule[], progress: BehaviorSubject<Progress>) {
    let fileToCategoryMap = new Map<FileElement, string[]>();
    return zip(from(files)
      .pipe(concatMap((file, fileIndex) => {
        let progressIndex = 1 + fileIndex * (rules.length + 1);

        let fileContentObservable: Observable<string>;
        if (this.isFileContentReadable(file)) {
          progress.next({
            index: progressIndex,
            value: 0,
            description: "Downloading file content of '" + file.name + "'"
          });
          fileContentObservable = this.fileService.downloadFile(file, progress)
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
          fileContentObservable = of("");
        }
        return fileContentObservable.pipe(
          mergeMap(fileContent => {
            // Find the first rule which matches
            return from(rules).pipe(concatMap((rule, ruleIndex) => {
                progress.next({
                  index: progressIndex + 1 + ruleIndex,
                  value: 0,
                  description: "Running rule '" + rule.name + "' for '" + file.name + "'"
                });
                return this.run(rule, file, fileContent, progress, progressIndex + 1 + ruleIndex);
              }),
              // Find will stop running further scripts once we got a match
              find(result => {
                return result.value;
              }),
              map(result => {
                if (result) {
                  fileToCategoryMap.set(file, result.rule.category);
                }
              }));
          }));
      })))
      .pipe(last(),
        map(() => fileToCategoryMap));

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
      let params: RuleWorkerParams = {
        script: rule.script,
        fileName: file.name,
        fileContent: fileContent
      };
      this.worker.postMessage(params);
    });
  }

  /**
   * Find or create the categories for each file and associate them
   */
  private setAllFileCategory(fileToCategoryMap: Map<FileElement, string[]>): Observable<void> {
    let baseFolderId = this.filesCacheService.getBaseFolder();
    let categoryRequests: Observable<void>[] = [];
    fileToCategoryMap
      .forEach((category, file) => {
        categoryRequests.push(this.findOrCreateCategories(category, baseFolderId)
          // There is no need to set the category if the current category is correct
          .pipe(filter(categoryId => file.parentId !== categoryId),
            mergeMap(categoryId => {
              return this.fileService.setCategory(file.id, categoryId);
            })));
      });
    return zip(categoryRequests).pipe(map(() => {
    }));
  }

  // TODO: move and refactor duplicate to FileService
  private findOrCreateCategories(categories: string[], categoryId: string): Observable<string> {
    let categoryName = categories.shift();
    if (categoryName !== undefined) {
      return this.fileService.findOrCreateFolder(categoryName, categoryId)
        .pipe(mergeMap(newCategoryId => {
          return this.findOrCreateCategories(categories, newCategoryId);
        }));
    }
    return of(categoryId);
  }
}
