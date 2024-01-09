import {Component, ElementRef, Inject, OnInit, ViewChild} from '@angular/core';
import {MatTableDataSource} from "@angular/material/table";
import {FileService} from "./file.service";
import {MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef} from "@angular/material/dialog";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInputModule} from "@angular/material/input";
import {FormControl, FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MatButtonModule} from "@angular/material/button";
import {MatChipInputEvent, MatChipsModule} from "@angular/material/chips";
import {MatIconModule} from "@angular/material/icon";
import {ENTER} from "@angular/cdk/keycodes";
import {AsyncPipe, NgForOf} from "@angular/common";
import {map, mergeMap, Observable, of, startWith, zip} from "rxjs";
import {NestedTreeControl} from "@angular/cdk/tree";
import {MatTreeNestedDataSource} from "@angular/material/tree";
import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
  MatAutocompleteTrigger
} from "@angular/material/autocomplete";
import {MatSort, MatSortable} from "@angular/material/sort";
import {UserRootComponent} from "../user-root/user-root.component";

export interface FileOrFolderElement {
  id: string;
  name: string;
  date: string;
  iconLink: string;
  parentId: string;
}

export interface FileElement extends FileOrFolderElement {
  size: number;
  dlLink: string;
}

export function isFileElement(object: FileOrFolderElement): object is FileElement {
  return 'size' in object;
}

export interface FolderElement extends FileOrFolderElement {
}


@Component({
  selector: 'app-file-list',
  templateUrl: './file-list.component.html',
  styleUrls: ['./file-list.component.scss']
})
export class FileListComponent implements OnInit {
  displayedColumns: string[] = ['name', 'category', 'date', 'size', 'actions'];
  fileDataSource = new MatTableDataSource<FileElement>();
  nameFilter = '';
  baseFolderId = '';

  categories = new Map<string, FolderElement>();
  parentToCategoryMap = new Map<string, FolderElement[]>();

  categoryDataSource = new MatTreeNestedDataSource<FolderElement>();
  categoryTreeControl = new NestedTreeControl<FolderElement>(node => this.getChildren(node.id));
  // Static is simpler here to avoid change detection stability issues
  @ViewChild(MatSort, {static: true}) fileSort?: MatSort;
  isCategoryPanelExpanded = true;
  private categoryFilters = new Set<FolderElement>();
  private allFiles: FileOrFolderElement[] = [];

  constructor(private fileService: FileService, public dialog: MatDialog, private userRootComponent: UserRootComponent) {
    this.fileDataSource.filterPredicate = data => {
      return this.filterPredicate(data);
    }
  }

  ngOnInit(): void {
    let filesCache = this.userRootComponent.getFilesCache();
    this.baseFolderId = filesCache.baseFolder;
    this.allFiles = filesCache.all;
    this.populateFilesAndCategories();

    if (this.fileSort) {
      this.fileSort.sort(({id: 'name', start: 'asc'}) as MatSortable);
      this.fileDataSource.sort = this.fileSort;
    }

    this.checkForEmptyCategoriesToRemove();
  }

  trashFile(element: FileElement) {
    this.fileService.trash(element.id)
      .subscribe(() => {
        this.refresh();
      })
  }

  setCategory(element: FileElement) {
    let data: SelectFileCategoryDialogData = {
      file: element,
      componentRef: this
    };
    let dialogRef = this.dialog.open(SelectFileCategoryDialog, {
      data: data,
      // False otherwise tests are failing abnormally...
      closeOnNavigation: false
    });

    dialogRef.afterClosed().subscribe((categories: string[]) => {
      if (categories) {
        this.findOrCreateCategories(categories, this.baseFolderId)
          .pipe(mergeMap(categoryId => {
            return this.fileService.setCategory(element.id, categoryId)
          }))
          .subscribe(_ => {
            this.refresh()
          });
      }
    })
  }

  categoryHasChild = (_: number, node: FolderElement) => {
    return this.getChildren(node.id).length > 0;
  };

  getCategories(element: FileElement) {
    return this.getAncestorCategories(element.parentId);
  }

  filterByCategory(category: FolderElement, selected: boolean) {
    if (selected) {
      this.categoryFilters.add(category);
    } else {
      this.categoryFilters.delete(category);
    }
    this.refreshFilter();
  }

  refreshFilter() {
    this.fileDataSource.filter = "true"
  }

  isCategorySelected(category: FolderElement) {
    return this.categoryFilters.has(category);
  }

  getAncestorCategories(catId: string): FolderElement[] {
    let category = this.categories.get(catId);
    if (category) {
      let categories = this.getAncestorCategories(category.parentId);
      categories.push(category);
      return categories;
    } else {
      return [];
    }
  }

  private refresh() {
    this.userRootComponent.refreshCacheAndReload();
  }

  private populateFilesAndCategories() {
    this.fileDataSource.data = this.allFiles.filter(value => isFileElement(value))
      .map(value => value as FileElement);
    this.categories.clear();
    this.allFiles.filter(value => !isFileElement(value))
      // Filter out base folder which is not a category
      .filter(value => value.id !== this.baseFolderId)
      .forEach(category => this.categories.set(category.id, category));

    this.constructCategoryTree();
  }

  private checkForEmptyCategoriesToRemove() {
    // Also remove empty categories which can happen when removing a category from a file
    let removeCategoryRequests = this.removeEmptyCategories();
    if (removeCategoryRequests) {
      zip(removeCategoryRequests)
        .subscribe(() => {
          // Do a refresh when all categories were removed
          this.refresh()
        })
    }
  }

  /**
   * Filter by name (ignoring case) then filter by category
   */
  private filterPredicate<T>(data: FileElement) {
    if (!data.name.toLowerCase().includes(this.nameFilter.trim().toLowerCase())) {
      return false
    }
    if (this.categoryFilters.size > 0) {
      // We want at least one category to match
      for (const category of this.categoryFilters) {
        if (this.getCategories(data).includes(category)) {
          return true;
        }
      }
      // No matching category
      return false;
    }
    return true;
  }

  private getChildren(catId: string) {
    return this.parentToCategoryMap.get(catId) ?? []
  }

  private constructCategoryTree() {
    // Populate parentToCategoryMap
    this.parentToCategoryMap.clear();
    for (let category of this.categories.values()) {
      if (!this.parentToCategoryMap.has(category.parentId)) {
        this.parentToCategoryMap.set(category.parentId, []);
      }
      this.parentToCategoryMap.get(category.parentId)?.push(category);
    }

    // Sort each children categories by name
    for (const categories of this.parentToCategoryMap.values()) {
      categories.sort((a, b) => a.name.localeCompare(b.name));
    }
    // Add the root categories
    this.categoryDataSource.data = this.getChildren(this.baseFolderId);
  }

  /**
   * Return the last category id of the list
   */
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

  private removeEmptyCategories() {
    return Array.from(this.categories.values())
      .filter(category => this.isCategoryEmpty(category))
      .map(category => {
        return this.fileService.trash(category.id)
      })
  }

  private isCategoryEmpty(category: FolderElement) {
    return !this.fileDataSource.data.some(fileEl => {
      return this.getCategories(fileEl).includes(category);
    })
  }
}

@Component({
  selector: 'select-file-category-dialog',
  templateUrl: './select-file-category.dialog.html',
  styleUrls: ['./select-file-category.dialog.scss'],
  standalone: true,
  imports: [MatDialogModule, MatFormFieldModule, MatInputModule, FormsModule, MatButtonModule, MatChipsModule,
    MatIconModule, NgForOf, MatAutocompleteModule, ReactiveFormsModule, AsyncPipe],
})
export class SelectFileCategoryDialog {
  readonly separatorKeysCodes = [ENTER] as const;
  categories: string[] = [];
  suggestedCategories: Observable<string[]>;
  public fileName: string;
  categoryFormControl = new FormControl('');

  @ViewChild('categoryInput') categoryInput?: ElementRef<HTMLInputElement>;
  @ViewChild(MatAutocompleteTrigger, {read: MatAutocompleteTrigger}) categoryAutoComplete?: MatAutocompleteTrigger;

  private existingCategories: Map<string, FolderElement>;
  private baseFolderId: string;

  constructor(
    public dialogRef: MatDialogRef<SelectFileCategoryDialog>,
    @Inject(MAT_DIALOG_DATA) public data: SelectFileCategoryDialogData,
  ) {
    this.fileName = data.file.name;

    this.existingCategories = data.componentRef.categories;
    this.baseFolderId = data.componentRef.baseFolderId;
    // Initialize categories with the current one of the file
    this.categories = data.componentRef.getAncestorCategories(data.file.parentId).map(value => value.name);

    this.suggestedCategories = this.categoryFormControl.valueChanges.pipe(
      startWith(''),
      map(value => {
        return this.filterSuggestedOptions(value ?? '');
      }));
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  addFromInput(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    this.add(value);

  }

  remove(category: string) {
    const index = this.categories.indexOf(category);
    // The category always has an index in this context so no checking necessary
    this.categories.splice(index, 1);
    this.categoryFormControl.setValue(this.categoryFormControl.value);
  }

  addFromAutoComplete(event: MatAutocompleteSelectedEvent) {
    this.add(event.option.viewValue);
    // After adding from autocomplete, the panel is automatically closed, but we want to keep it open for
    // faster and easier selection
    setTimeout(() => this.categoryAutoComplete?.openPanel());
  }

  private add(value: string) {
    if (value) {
      this.categories.push(value);
      // Clear the input value
      this.categoryFormControl.patchValue(null);
      if (this.categoryInput) {
        this.categoryInput.nativeElement.value = '';
      }
    }
  }

  private filterSuggestedOptions(currentInput: string) {
    // Filter on the last selected category as we want to suggest the children only
    let parentIdFilter = this.getIdOfLastSelectedCategory();
    return Array.from(this.existingCategories.values())
      // We need the root categories only
      .filter(value => value.parentId === parentIdFilter)
      .map(value => value.name)
      .filter(value => value.toLowerCase().includes(currentInput.toLowerCase()))
  }

  /**
   * If there is no selected category, it returns the base folder id.
   * Returns undefined if the last selected category does not have an id
   */
  private getIdOfLastSelectedCategory() {
    let parentIdFilter = this.baseFolderId;
    for (const category of this.categories) {
      let match = Array.from(this.existingCategories.values())
        .filter(value => value.parentId === parentIdFilter)
        .find(value => value.name === category);
      if (!match) {
        return undefined;
      }
      parentIdFilter = match.id;
    }
    return parentIdFilter;
  }
}

export interface SelectFileCategoryDialogData {
  file: FileElement;
  componentRef: FileListComponent
}
