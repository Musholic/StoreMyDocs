import {fakeAsync} from '@angular/core/testing';

import {FileListComponent} from './file-list.component';
import {MockBuilder, MockInstance, MockRender, ngMocks} from "ng-mocks";
import {AppModule} from "../app.module";
import {MatTableModule} from "@angular/material/table";
import {mock, when} from "strong-mock";
import {FileListService} from "./file-list.service";
import {of} from "rxjs";
import {NgxFilesizeModule} from "ngx-filesize";

describe('FileListComponent', () => {

  beforeEach(() => MockBuilder(FileListComponent, AppModule)
    .keep(MatTableModule)
    .keep(NgxFilesizeModule)
  );

  it('should create (no element)', fakeAsync(() => {
    // Arrange
    let listMock = MockInstance(FileListService, 'list', mock<FileListService['list']>());
    when(() => listMock()).thenReturn(of([]));

    // Act
    const component = MockRender(FileListComponent).point.componentInstance;

    // Assert
    expect(component).toBeTruthy();
    let result: string[][] = [];
    expect(result).toEqual(Page.getTableRows());
  }));

  it('should list two items', () => {
    // Arrange
    let listMock = MockInstance(FileListService, 'list', mock<FileListService['list']>());
    let el1 = {size: 1421315, date: '2023-08-14T14:48:44.928Z', name: 'name1'};
    let el2 = {size: 1745, date: '2023-08-03T14:54:55.556Z', name: 'name2'};
    when(() => listMock()).thenReturn(of([el1, el2]));

    // Act
    const component = MockRender(FileListComponent).point.componentInstance;

    // Assert
    expect(component).toBeTruthy();
    expect([['name1', 'Aug 14, 2023, 4:48:44 PM', '1.42 MB'], ['name2', 'Aug 3, 2023, 4:54:55 PM', '1.75 kB']]).toEqual(Page.getTableRows());
  })
});

class Page {
  static getTableRows(): string[][] {
    return ngMocks.findAll("tr[mat-row]")
      .map(row => row.children
        .map(child => child.nativeNode.textContent.trim()));
  }
}
