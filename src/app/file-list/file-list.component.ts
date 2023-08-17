import {Component, OnInit} from '@angular/core';
import {MatTableDataSource} from "@angular/material/table";
import {FileListService} from "./file-list.service";

export interface FileElement {
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
  displayedColumns: string[] = ['icon', 'name', 'date', 'size'];
  dataSource = new MatTableDataSource();

  constructor(private fileListService: FileListService) {
  }

  ngOnInit(): void {
    this.fileListService.list().subscribe(files => {
      this.dataSource.data = files;
    })
  }

}
