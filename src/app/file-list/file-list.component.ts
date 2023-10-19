import {Component, Inject, OnInit} from '@angular/core';
import {MatTableDataSource} from "@angular/material/table";
import {FileService} from "./file.service";
import {BaseFolderService} from "../file-upload/base-folder.service";
import {MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef} from "@angular/material/dialog";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInputModule} from "@angular/material/input";
import {FormsModule} from "@angular/forms";
import {MatButtonModule} from "@angular/material/button";
import {MatChipInputEvent, MatChipsModule} from "@angular/material/chips";
import {MatIconModule} from "@angular/material/icon";
import {ENTER} from "@angular/cdk/keycodes";
import {NgForOf} from "@angular/common";
import {mergeMap, Observable, of} from "rxjs";
import {NestedTreeControl} from "@angular/cdk/tree";
import {MatTreeNestedDataSource} from "@angular/material/tree";

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

function isFileElement(object: FileOrFolderElement): object is FileElement {
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
  private categoryFilters = new Set<string>();

  constructor(private fileService: FileService, private baseFolderService: BaseFolderService, public dialog: MatDialog) {
    this.fileDataSource.filterPredicate = data => {
      return this.filterPredicate(data);
    }
  }

  ngOnInit(): void {
    this.baseFolderService.findOrCreateBaseFolder().subscribe(baseFolderId => {
      this.baseFolderId = baseFolderId;
      this.refresh();
    });
  }

  trashFile(element: FileElement) {
    this.fileService.trash(element.id)
      .subscribe(() => this.refresh());
  }

  refresh() {
    this.fileService.findAll().subscribe(filesOrFolders => {
      this.fileDataSource.data = filesOrFolders.filter(value => isFileElement(value))
        .map(value => value as FileElement);
      this.categories.clear();
      filesOrFolders.filter(value => !isFileElement(value))
        .forEach(category => this.categories.set(category.id, category));

      this.constructCategoryTree();
    })
  }

  setCategory(element: FileElement) {
    let dialogRef = this.dialog.open(SelectFileCategoryDialog, {
      data: element.name,
      // False otherwise tests are failing abnormally...
      closeOnNavigation: false
    });

    dialogRef.afterClosed().subscribe((categories: string[]) => {
      if (categories) {
        this.findOrCreateCategories(categories, this.baseFolderId)
          .pipe(mergeMap(categoryId => {
            return this.fileService.setCategory(element.id, categoryId)
          }))
          .subscribe(_ => this.refresh());
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
      this.categoryFilters.add(category.name);
    } else {
      this.categoryFilters.delete(category.name);
    }
    this.refreshFilter();
  }

  refreshFilter() {
    this.fileDataSource.filter = "true"
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

  private getAncestorCategories(catId: string): string[] {
    let category = this.categories.get(catId);
    if (category) {
      let categories = this.getAncestorCategories(category.parentId);
      categories.push(category.name);
      return categories;
    } else {
      return [];
    }
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

    // Add the root categories
    this.categoryDataSource.data = this.getChildren(this.baseFolderId);
  }

  /**
   * Return the last category id of the list
   */
  private findOrCreateCategories(categories: string[], categoryId: string): Observable<string> {
    let categoryName = categories.shift();
    if (categoryName) {
      return this.fileService.findOrCreateFolder(categoryName, categoryId)
        .pipe(mergeMap(newCategoryId => {
          return this.findOrCreateCategories(categories, newCategoryId);
        }));
    }
    return of(categoryId);
  }
}

@Component({
  selector: 'select-file-category-dialog',
  templateUrl: './select-file-category.dialog.html',
  styleUrls: ['./select-file-category.dialog.scss'],
  standalone: true,
  imports: [MatDialogModule, MatFormFieldModule, MatInputModule, FormsModule, MatButtonModule, MatChipsModule, MatIconModule, NgForOf],
})
export class SelectFileCategoryDialog {
  readonly separatorKeysCodes = [ENTER] as const;
  categories: string[] = [];

  constructor(
    public dialogRef: MatDialogRef<SelectFileCategoryDialog>,
    @Inject(MAT_DIALOG_DATA) public fileName: string,
  ) {
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  add(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value) {
      this.categories.push(value);
    }

    // Clear the input value
    event.chipInput.clear();
  }

  remove(category: string) {
    const index = this.categories.indexOf(category);

    if (index >= 0) {
      this.categories.splice(index, 1);
    }
  }
}
