import {Component, OnInit} from '@angular/core';
import {MatTableDataSource} from "@angular/material/table";
import {FileService} from "./file.service";
import {BaseFolderService} from "../file-upload/base-folder.service";

export interface FileElement {
  id: string;
  name: string;
  date: string;
  size: number;
  iconLink: string;
  dlLink: string;
}


@Component({
  selector: 'app-file-list',
  templateUrl: './file-list.component.html',
  styleUrls: ['./file-list.component.scss']
})
export class FileListComponent implements OnInit {
  displayedColumns: string[] = ['name', 'date', 'size', 'actions'];
  dataSource = new MatTableDataSource();
  categories: string[] = ['Cat1', 'Cat2'];

  constructor(private fileService: FileService, private baseFolderService: BaseFolderService) {
  }

  ngOnInit(): void {
    this.refresh();
  }

  trashFile(element: FileElement) {
    this.fileService.trash(element.id)
      .subscribe(() => this.refresh());
  }

  refresh() {
    this.baseFolderService.listAllFiles().subscribe(files => {
      this.dataSource.data = files;
    })
  }

  setCategory(element: FileElement) {
    this.fileService.setCategory(element.id, "SMD_CatTest")
      .subscribe(_ => this.refresh());

  }
}
