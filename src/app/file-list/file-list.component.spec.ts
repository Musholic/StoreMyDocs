import {fakeAsync, tick} from '@angular/core/testing';

import {FileElement, FileListComponent, FolderElement} from './file-list.component';
import {MockBuilder, MockedComponentFixture, MockInstance, MockRender, ngMocks} from "ng-mocks";
import {AppModule} from "../app.module";
import {MatTableModule} from "@angular/material/table";
import {mock, when} from "strong-mock";
import {FileService} from "./file.service";
import {of} from "rxjs";
import {NgxFilesizeModule} from "ngx-filesize";
import {TestbedHarnessEnvironment} from "@angular/cdk/testing/testbed";
import {HarnessLoader} from "@angular/cdk/testing";
import {MatMenuHarness} from "@angular/material/menu/testing";
import {MatMenuModule} from "@angular/material/menu";
import {BrowserAnimationsModule, NoopAnimationsModule} from "@angular/platform-browser/animations";
import {findAsyncSequential, mustBeConsumedObservable} from "../../testing/common-testing-function.spec";
import {BaseFolderService} from "../file-upload/base-folder.service";
import {MatInputHarness} from "@angular/material/input/testing";
import {MatButtonHarness} from "@angular/material/button/testing";
import {MatDialogModule} from "@angular/material/dialog";
import {MatDialogHarness} from "@angular/material/dialog/testing";

describe('FileListComponent', () => {
  beforeEach(() => MockBuilder(FileListComponent, AppModule)
    .keep(MatTableModule)
    .keep(NgxFilesizeModule)
    .keep(MatMenuModule)
    .keep(MatDialogModule)
    .replace(BrowserAnimationsModule, NoopAnimationsModule)
  );

  it('should create (no element)', fakeAsync(() => {
    // Arrange
    let listMock = MockInstance(BaseFolderService, 'listAllFiles', mock<BaseFolderService['listAllFiles']>());
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
    mockListTwoItemsAndTwoCategories();

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
    let listMock = mockListTwoItemsAndTwoCategories();
    let trashMock = MockInstance(FileService, 'trash', mock<FileService['trash']>());
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
    mockListTwoItemsAndTwoCategories();

    // Act
    MockRender(FileListComponent)

    // Assert
    expect(Page.getCategories()).toEqual(['Cat1', 'Cat2'])
  })

  describe('Category assignment', () => {
    it('should refresh after assigning a category to a file', fakeAsync(async () => {
      // Arrange
      let listMock = mockListTwoItemsAndTwoCategories();
      let el1: FileElement = {
        id: 'id1',
        size: 1421315,
        date: '2023-08-14T14:48:44.928Z',
        name: 'name1',
        iconLink: "link",
        dlLink: "dlLink"
      };
      when(() => listMock()).thenReturn(of([el1]))
      let setCategoryMock = MockInstance(FileService, 'setCategory', mock<FileService['setCategory']>());
      when(() => setCategoryMock('id2', 'Cat848', 'baseFolderId78')).thenReturn(of(undefined));

      let findOrCreateBaseFolderMock = MockInstance(BaseFolderService, 'findOrCreateBaseFolder',
        mock<BaseFolderService['findOrCreateBaseFolder']>());
      when(() => findOrCreateBaseFolderMock()).thenReturn(of('baseFolderId78'))

      let fixture = MockRender(FileListComponent);
      let page = new Page(fixture);

      // Act
      Page.openItemMenu('name2');
      await page.clickMenuAssignCategory();
      await page.setCategoryInDialog('Cat848');
      await page.clickOkInDialog();

      // Assert
      tick();
      let actionsRow = 'more_vert';
      let expected = [['name1', 'Aug 14, 2023, 2:48:44 PM', '1.42 MB', actionsRow]];
      expect(expected).toEqual(Page.getTableRows());
    }))

    it('should show name of the file being assigned to a category in dialog', fakeAsync(async () => {
      // Arrange
      mockListTwoItemsAndTwoCategories();

      let fixture = MockRender(FileListComponent);
      let page = new Page(fixture);

      // Act
      Page.openItemMenu('name2');
      await page.clickMenuAssignCategory();

      // Assert
      tick();
      expect(await page.getDialogTitle()).toEqual('Select a category for name2');

      // Cleanup
      await page.clickCancelInDialog();
    }))
  })


});

function mockListTwoItemsAndTwoCategories() {
  let listMock = MockInstance(BaseFolderService, 'listAllFiles', mock<BaseFolderService['listAllFiles']>());
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
  let el3: FolderElement = {
    id: 'id3',
    date: '2023-08-02T14:54:55.556Z',
    name: 'Cat1',
    iconLink: "link"
  };
  let el4: FolderElement = {
    id: 'id4',
    date: '2023-08-01T14:54:55.556Z',
    name: 'Cat2',
    iconLink: "link"
  };
  when(() => listMock()).thenReturn(of([el1, el2, el3, el4]));
  return listMock;
}

class Page {
  private loader: HarnessLoader;

  constructor(fixture: MockedComponentFixture<FileListComponent, FileListComponent>) {
    this.loader = TestbedHarnessEnvironment.documentRootLoader(fixture);
  }

  static getTableRows(): string[][] {
    return ngMocks.findAll("mat-row")
      .map(row => row.children
        .map(child => child.nativeNode.textContent.trim()));
  }

  async clickMenuTrash() {
    await this.clickMenu('.trash-file');
  }

  private async clickMenu(selector: string) {
    let matMenuHarnesses = await this.loader.getAllHarnesses(MatMenuHarness);
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

  async setCategoryInDialog(category: string) {
    let inputHarness = await this.loader.getHarness(MatInputHarness.with({placeholder: 'Category'}));
    await inputHarness.setValue(category);
  }

  async clickOkInDialog() {
    let button = await this.loader.getHarness(MatButtonHarness.with({text: 'Ok'}));
    await button.click();
  }

  async clickCancelInDialog() {
    let button = await this.loader.getHarness(MatButtonHarness.with({text: 'Cancel'}));
    await button.click();
  }

  async getDialogTitle() {
    let dialogHarness = await this.loader.getHarness(MatDialogHarness);
    return dialogHarness.getTitleText();
  }
}
