import {Injectable} from '@angular/core';
import {Rule, SAMPLE_RULES} from "./rules.component";
import {FileService} from "../file-list/file.service";
import {filter, map, mergeMap, Observable, of, zip} from "rxjs";
import {FileElement, isFileElement} from "../file-list/file-list.component";
import {BaseFolderService} from "../file-upload/base-folder.service";

@Injectable({
  providedIn: 'root'
})
export class RuleService {
  constructor(private fileService: FileService, private baseFolderService: BaseFolderService) {
  }

  runAll(): Observable<void> {
    let rules = SAMPLE_RULES
      .map(rule => {
        let copy = {...rule};
        copy.category = Object.assign([], rule.category);
        return copy;
      });

    return this.fileService.findAll()
      .pipe(mergeMap(fileOrFolders => {
        // Get all files
        let files = fileOrFolders.filter(file => isFileElement(file))
          .map(value => value as FileElement);

        // Run the script for each file to get the associated category
        let fileToCategoryMap = this.computeFileToCategoryMap(files, rules);

        // Set the computed category for each files
        return this.setAllFileCategory(fileToCategoryMap);
      }));
  }

  /**
   * Run the given rules on the given files and return the associated category for each file that got a matching rule
   */
  private computeFileToCategoryMap(files: FileElement[], rules: Rule[]) {
    let fileToCategoryMap = new Map<FileElement, string[]>();

    files.forEach(file => {
      // Find the first rule which matches
      let rule = rules.find(rule => {
        return this.run(rule, file);
      })
      if (rule) {
        fileToCategoryMap.set(file, rule.category);
      }
    });

    return fileToCategoryMap;
  }

  private run(rule: Rule, file: FileElement) {
    return Function("const fileName = arguments[0];" + rule.script)(file.name);
  }

  /**
   * Find or create the categories for each file and associate them
   */
  private setAllFileCategory(fileToCategoryMap: Map<FileElement, string[]>) {
    return this.baseFolderService.findOrCreateBaseFolder()
      .pipe(mergeMap(baseFolderId => {
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
        let observable = zip(categoryRequests);
        return observable
          .pipe(map(() => {
          }));
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

  create(rule: Rule) {
    return undefined;
  }
}
