import {fakeAsync} from '@angular/core/testing';

import {FileListComponent} from './file-list.component';
import {MockBuilder, MockInstance, MockRender, ngMocks} from "ng-mocks";
import {AppModule} from "../app.module";
import {MatTableModule} from "@angular/material/table";
import {mock, when} from "strong-mock";
import {FileListService} from "./file-list.service";
import {of} from "rxjs";

describe('FileListComponent', () => {

  beforeEach(() => MockBuilder(FileListComponent, AppModule)
    .keep(MatTableModule)
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
    let el1 = {size: 14, date: 'date1', name: 'name1'};
    let el2 = {size: 17, date: 'date2', name: 'name2'};
    when(() => listMock()).thenReturn(of([el1, el2]));

    // Act
    const component = MockRender(FileListComponent).point.componentInstance;

    // Assert
    expect(component).toBeTruthy();
    expect([['name1', 'date1', '14'], ['name2', 'date2', '17']]).toEqual(Page.getTableRows());
  })
});

class Page {
  static getTableRows(): string[][] {
    return ngMocks.findAll("tr[mat-row]")
      .map(row => row.children
        .map(child => child.nativeNode.textContent.trim()));
  }
}
