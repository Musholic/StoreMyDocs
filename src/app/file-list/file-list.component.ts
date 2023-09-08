import {Component, OnInit} from '@angular/core';
import {MatTableDataSource} from "@angular/material/table";
import {FileListService} from "./file-list.service";

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

  constructor(private fileListService: FileListService) {
  }

  ngOnInit(): void {
    this.refresh();
  }

  trashFile(element: FileElement) {
    this.fileListService.trash(element.id)
      .subscribe(() => this.refresh());
  }

  refresh() {
    this.fileListService.list().subscribe(files => {
      this.dataSource.data = files;
    })
  }
}
