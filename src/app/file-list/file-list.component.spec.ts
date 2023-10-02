import {ComponentFixture, fakeAsync, tick} from '@angular/core/testing';

import {FileElement, FileListComponent} from './file-list.component';
import {MockBuilder, MockedComponentFixture, MockInstance, MockRender, ngMocks} from "ng-mocks";
import {AppModule} from "../app.module";
import {MatTableModule} from "@angular/material/table";
import {mock, when} from "strong-mock";
import {FileListService} from "./file-list.service";
import {of} from "rxjs";
import {NgxFilesizeModule} from "ngx-filesize";
import {TestbedHarnessEnvironment} from "@angular/cdk/testing/testbed";
import {HarnessLoader} from "@angular/cdk/testing";
import {MatMenuHarness} from "@angular/material/menu/testing";
import {MatMenuModule} from "@angular/material/menu";
import {BrowserAnimationsModule, NoopAnimationsModule} from "@angular/platform-browser/animations";
import {findAsyncSequential, mustBeConsumedObservable} from "../../testing/common-testing-function.spec";

describe('FileListComponent', () => {
  MockInstance.scope();

  beforeEach(() => MockBuilder(FileListComponent, AppModule)
      .keep(MatTableModule)
      .keep(NgxFilesizeModule)
      .keep(MatMenuModule)
      .replace(BrowserAnimationsModule, NoopAnimationsModule)
  );

  it('should create (no element)', fakeAsync(() => {
    // Arrange
    let listMock = MockInstance(FileListService, 'list', mock<FileListService['list']>());
    when(() => listMock()).thenReturn(mustBeConsumedObservable(of([])));

    // Act
    const component = MockRender(FileListComponent).point.componentInstance;

    // Assert
    expect(component).toBeTruthy();
    let result: string[][] = [];
    expect(result).toEqual(Page.getTableRows());
  }));

  it('should list two items', () => {
    // Arrange
    mockListTwoItems();

    // Act
    MockRender(FileListComponent)

    // Assert
    let actionsRow = 'more_vert';
    let expected = [['name1', 'Aug 14, 2023, 2:48:44 PM', '1.42 MB', actionsRow],
      ['name2', 'Aug 3, 2023, 2:54:55 PM', '1.75 kB', actionsRow]];
    expect(expected).toEqual(Page.getTableRows());
  })

  it('should trash an item then refresh', fakeAsync(async () => {
    // Arrange
    let listMock = mockListTwoItems();
    let trashMock = MockInstance(FileListService, 'trash', mock<FileListService['trash']>());
    when(() => trashMock('id2'))
        .thenReturn(mustBeConsumedObservable(of(undefined)));
    let fixture = MockRender(FileListComponent);
    let page = new Page(fixture);
    tick();
    let el1: FileElement = {
      id: 'id1',
      size: 1421315,
      date: '2023-08-14T14:48:44.928Z',
      name: 'name1',
      iconLink: "link",
      dlLink: "dlLink"
    };
    when(() => listMock()).thenReturn(of([el1]))

    // Act
    Page.openItemMenu('name2');
    await page.clickMenuTrash()

    // Assert
    tick();
    let actionsRow = 'more_vert';
    let expected = [['name1', 'Aug 14, 2023, 2:48:44 PM', '1.42 MB', actionsRow]];
    expect(expected).toEqual(Page.getTableRows());
  }))

  it('should list two categories', () => {
    // Arrange
    mockListTwoItems();

    // Act
    MockRender(FileListComponent)

    // Assert
    expect(Page.getCategories()).toEqual(['Cat1', 'Cat2'])
  })

  it('should refresh after assigning a category to a file', fakeAsync(async () => {
    // Arrange
    let listMock = mockListTwoItems();
    let el1: FileElement = {
      id: 'id1',
      size: 1421315,
      date: '2023-08-14T14:48:44.928Z',
      name: 'name1',
      iconLink: "link",
      dlLink: "dlLink"
    };
    when(() => listMock()).thenReturn(of([el1]))
    let setCategoryMock = MockInstance(FileListService, 'setCategory', mock<FileListService['setCategory']>());
    when(() => setCategoryMock()).thenReturn(of(undefined));

    let fixture = MockRender(FileListComponent);
    let page = new Page(fixture);

    // Act
    Page.openItemMenu('name2');
    await page.clickMenuAssignCategory()

    // Assert
    //TODO: verify service setCategory + verify refresh
    tick();
    let actionsRow = 'more_vert';
    let expected = [['name1', 'Aug 14, 2023, 2:48:44 PM', '1.42 MB', actionsRow]];
    expect(expected).toEqual(Page.getTableRows());
  }))

});

function mockListTwoItems() {
  let listMock = MockInstance(FileListService, 'list', mock<FileListService['list']>());
  let el1: FileElement = {
    id: 'id1',
    size: 1421315,
    date: '2023-08-14T14:48:44.928Z',
    name: 'name1',
    iconLink: "link",
    dlLink: "dlLink"
  };
  let el2: FileElement = {
    id: 'id2',
    size: 1745,
    date: '2023-08-03T14:54:55.556Z',
    name: 'name2',
    iconLink: "link",
    dlLink: "dlLink"
  };
  when(() => listMock()).thenReturn(of([el1, el2]));
  return listMock;
}

class Page {
  private harnessLoader: HarnessLoader;

  constructor(fixture: MockedComponentFixture<FileListComponent, FileListComponent>) {
    this.harnessLoader = TestbedHarnessEnvironment.loader(fixture);
  }

  private static fixture: ComponentFixture<unknown>;

  static getTableRows(): string[][] {
    return ngMocks.findAll("mat-row")
        .map(row => row.children
            .map(child => child.nativeNode.textContent.trim()));
  }

  async clickMenuTrash() {
    await this.clickMenu('.trash-file');
  }

  private async clickMenu(selector: string) {
    let matMenuHarnesses = await this.harnessLoader.getAllHarnesses(MatMenuHarness);
    // The menu should be the one opened
    let matMenuHarness = await findAsyncSequential(matMenuHarnesses, value => value.isOpen());
    await matMenuHarness?.clickItem({selector: selector});
  }

  static openItemMenu(name: string) {
    let row = ngMocks.findAll("mat-row")
        .filter(value => {
          let nameColumn = ngMocks.find(value, ".mat-column-name");
          return nameColumn.nativeNode.textContent.trim() === name;
        })[0];
    ngMocks.find(row, ".mat-column-actions").nativeNode.click();
  }

  static getCategories() {
    return ngMocks.findAll("mat-list-item div")
      .map(value => value.nativeNode.textContent.trim());
  }

  async clickMenuAssignCategory() {
    await this.clickMenu('.set-category-file');
  }
}
