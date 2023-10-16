import {Component, Inject, OnInit} from '@angular/core';
import {MatTableDataSource} from "@angular/material/table";
import {FileService} from "./file.service";
import {BaseFolderService} from "../file-upload/base-folder.service";
import {MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef} from "@angular/material/dialog";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInputModule} from "@angular/material/input";
import {FormsModule} from "@angular/forms";
import {MatButtonModule} from "@angular/material/button";

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

    dialogRef.afterClosed().subscribe(category => {
      if (category) {
        this.baseFolderService.findOrCreateBaseFolder().subscribe(baseFolderId => {
          this.fileService.setCategory(element.id, category, baseFolderId)
            .subscribe(_ => this.refresh());
        });
      }
    })
  }
}

@Component({
  selector: 'select-file-category-dialog',
  templateUrl: 'select-file-category.dialog.html',
  standalone: true,
  imports: [MatDialogModule, MatFormFieldModule, MatInputModule, FormsModule, MatButtonModule],
})
export class SelectFileCategoryDialog {
  category = '';

  constructor(
    public dialogRef: MatDialogRef<SelectFileCategoryDialog>,
    @Inject(MAT_DIALOG_DATA) public fileName: string,
  ) {
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
