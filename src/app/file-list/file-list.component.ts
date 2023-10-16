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
import {COMMA, ENTER} from "@angular/cdk/keycodes";
import {NgForOf} from "@angular/common";
import {mergeMap, Observable, of} from "rxjs";

export interface FileOrFolderElement {
  id: string;
  name: string;
  date: string;
  iconLink: string;
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
  displayedColumns: string[] = ['name', 'date', 'size', 'actions'];
  dataSource = new MatTableDataSource();
  categories: FolderElement[] = [];
  nameFilter = '';

  constructor(private fileService: FileService, private baseFolderService: BaseFolderService, public dialog: MatDialog) {
  }

  ngOnInit(): void {
    this.refresh();
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  trashFile(element: FileElement) {
    this.fileService.trash(element.id)
      .subscribe(() => this.refresh());
  }

  refresh() {
    this.fileService.findAll().subscribe(filesOrFolders => {
      this.dataSource.data = filesOrFolders.filter(value => isFileElement(value));
      this.categories = filesOrFolders.filter(value => !isFileElement(value));
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
        this.baseFolderService.findOrCreateBaseFolder()
          .pipe(mergeMap(baseFolderId => {
            return this.findOrCreateCategories(categories, baseFolderId)
          }), mergeMap(categoryId => {
            return this.fileService.setCategory(element.id, categoryId)
          }))
          .subscribe(_ => this.refresh());
      }
    })
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
