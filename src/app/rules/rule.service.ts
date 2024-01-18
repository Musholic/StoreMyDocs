import {Injectable} from '@angular/core';
import {FileService} from "../file-list/file.service";
import {BehaviorSubject, filter, from, last, map, mergeMap, Observable, of, zip} from "rxjs";
import {FileElement, isFileElement} from "../file-list/file-list.component";
import {Rule, RuleRepository} from "./rule.repository";
import {FilesCacheService} from "../files-cache/files-cache.service";
import {BackgroundTaskService, Progress} from "../background-task/background-task.service";
import {fromPromise} from "rxjs/internal/observable/innerFrom";

@Injectable()
export class RuleService {
  constructor(private fileService: FileService, private ruleRepository: RuleRepository,
              private filesCacheService: FilesCacheService, private backgroundTaskService: BackgroundTaskService) {
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
        }),
        mergeMap(fileToCategoryMap => {
          // Set the computed category for each files
          return this.setAllFileCategory(fileToCategoryMap);
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

    return from(files)
      .pipe(mergeMap(file => {
          progress.next({index: 1, value: 0, description: "Downloading file content of '" + file.name + "'"});
          return this.fileService.downloadFile(file, progress)
            .pipe(mergeMap(blobContent => fromPromise(blobContent.text())),
              map(fileContent => {
                // Find the first rule which matches
                let rule = rules.find(rule => {
                  progress.next({
                    index: 2,
                    value: 0,
                    description: "Running rule '" + rule.name + "' for '" + file.name + "'"
                  });
                  return this.run(rule, file, fileContent);
                })
                if (rule) {
                  fileToCategoryMap.set(file, rule.category);
                }
              }))
        }),
        last(),
        map(() => fileToCategoryMap))

  }

  private run(rule: Rule, file: FileElement, fileContent: string) {
    return Function("const fileName = arguments[0]; const fileContent = arguments[1]; " + rule.script)(file.name, fileContent);
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
