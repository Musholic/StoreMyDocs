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
import {HarnessLoader, TestKey} from "@angular/cdk/testing";
import {MatMenuHarness} from "@angular/material/menu/testing";
import {MatMenuModule} from "@angular/material/menu";
import {BrowserAnimationsModule, NoopAnimationsModule} from "@angular/platform-browser/animations";
import {findAsyncSequential, mustBeConsumedObservable} from "../../testing/common-testing-function.spec";
import {BaseFolderService} from "../file-upload/base-folder.service";
import {MatInputHarness} from "@angular/material/input/testing";
import {MatButtonHarness} from "@angular/material/button/testing";
import {MatDialogModule} from "@angular/material/dialog";
import {MatDialogHarness} from "@angular/material/dialog/testing";
import {MatInputModule} from "@angular/material/input";
import {FormsModule} from "@angular/forms";
import {MatTreeModule} from "@angular/material/tree";
import {MatChipsModule} from "@angular/material/chips";
import { v4 as uuid } from 'uuid';

describe('FileListComponent', () => {
  beforeEach(() => MockBuilder(FileListComponent, AppModule)
    .keep(MatTableModule)
    .keep(NgxFilesizeModule)
    .keep(MatMenuModule)
    .keep(MatDialogModule)
    .keep(MatInputModule)
    .keep(FormsModule)
    .keep(MatTreeModule)
    .keep(MatChipsModule)
    .replace(BrowserAnimationsModule, NoopAnimationsModule)
  );

  it('should create (no element)', fakeAsync(() => {
    // Arrange
    let findOrCreateBaseFolderMock = MockInstance(BaseFolderService, 'findOrCreateBaseFolder',
      mock<BaseFolderService['findOrCreateBaseFolder']>());
    when(() => findOrCreateBaseFolderMock()).thenReturn(of('baseFolderId'));

    let listMock = MockInstance(FileService, 'findAll', mock<FileService['findAll']>());
    when(() => listMock()).thenReturn(mustBeConsumedObservable(of([])));

    // Act
    const component = MockRender(FileListComponent).point.componentInstance;

    // Assert
    expect(component).toBeTruthy();
    expect(Page.getTableRows()).toEqual([]);
  }));

  it('should list two items', () => {
    // Arrange
    mockListItemsAndCategoriesWithTwoItemsAndThreeCategories();

    // Act
    MockRender(FileListComponent)

    // Assert
    let actionsRow = 'more_vert';
    let expected = [['name1', 'Cat1', 'Aug 14, 2023, 2:48:44 PM', '1.42 MB', actionsRow],
      ['name2', 'Cat1Cat1Child', 'Aug 3, 2023, 2:54:55 PM', '1.75 kB', actionsRow]];
    expect(Page.getTableRows()).toEqual(expected);
  })

  it('should trash an item then refresh', fakeAsync(async () => {
    // Arrange
    let listMock = mockListItemsAndCategoriesWithTwoItemsAndThreeCategories();
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
      dlLink: "dlLink",
      parentId: "rootId"
    };
    when(() => listMock()).thenReturn(of([el1]))

    // Act
    Page.openItemMenu('name2');
    await page.clickMenuTrash()

    // Assert
    tick();
    let actionsRow = 'more_vert';
    let expected = [['name1', '', 'Aug 14, 2023, 2:48:44 PM', '1.42 MB', actionsRow]];
    expect(Page.getTableRows()).toEqual(expected);
  }))

  it('should list two categories and one sub-category', fakeAsync(() => {
    // Arrange
    mockListItemsAndCategoriesWithTwoItemsAndThreeCategories();

    // Act
    MockRender(FileListComponent)

    // Assert
    tick();
    expect(Page.getCategories()).toEqual(['Cat1', 'Cat1Child', 'Cat2'])
  }))

  describe('Category assignment', () => {
    it('should refresh after assigning a category to a file', fakeAsync(async () => {
      // Arrange
      let listMock = mockListItemsAndCategoriesWithTwoItemsAndThreeCategories();
      let el1: FileElement = {
        id: 'id1',
        size: 1421315,
        date: '2023-08-14T14:48:44.928Z',
        name: 'name1',
        iconLink: "link",
        dlLink: "dlLink",
        parentId: "rootId"
      };
      when(() => listMock()).thenReturn(of([el1]))
      let findOrCreateFolderMock = MockInstance(FileService, 'findOrCreateFolder', mock<FileService['findOrCreateFolder']>());
      when(() => findOrCreateFolderMock('Cat848', 'baseFolderId')).thenReturn(of('cat848Id'));
      let setCategoryMock = MockInstance(FileService, 'setCategory', mock<FileService['setCategory']>());
      when(() => setCategoryMock('id2', 'cat848Id')).thenReturn(of(undefined));

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
      let expected = [['name1', '', 'Aug 14, 2023, 2:48:44 PM', '1.42 MB', actionsRow]];
      expect(Page.getTableRows()).toEqual(expected);
    }))

    it('should show name of the file being assigned to a category in dialog', fakeAsync(async () => {
      // Arrange
      mockListItemsAndCategoriesWithTwoItemsAndThreeCategories();

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

    it('should create and assign a sub-category', fakeAsync(async () => {
      // Arrange
      let findAllMock = mockListItemsAndCategoriesWithTwoItemsAndThreeCategories();
      // We expect a refresh
      when(() => findAllMock()).thenReturn(of());

      let setCategoryMock = MockInstance(FileService, 'setCategory', mock<FileService['setCategory']>());
      when(() => setCategoryMock('id2', 'cat7Id')).thenReturn(of(undefined));

      let findOrCreateFolderMock = MockInstance(FileService, 'findOrCreateFolder', mock<FileService['findOrCreateFolder']>());
      when(() => findOrCreateFolderMock('ParentCat8', 'baseFolderId')).thenReturn(of('parentCat8Id'));
      when(() => findOrCreateFolderMock('Cat7', 'parentCat8Id')).thenReturn(of('cat7Id'));

      let fixture = MockRender(FileListComponent);
      let page = new Page(fixture);

      // Act
      Page.openItemMenu('name2');
      await page.clickMenuAssignCategory();
      await page.setCategoryInDialog('ParentCat8');
      await page.setCategoryInDialog('Cat7');
      await page.clickOkInDialog();

      // Assert
      // No failure from mock setup
    }))
  })

  describe('Filter by file name', () => {
    it('should filter out one item out of two items', async () => {
      // Arrange
      mockListItemsAndCategoriesWithTwoItemsAndThreeCategories();
      let fixture = MockRender(FileListComponent);
      let page = new Page(fixture);

      // Act
      //TODO: test filters ignore case
      await page.setFilter('name1');

      // Assert
      let actionsRow = 'more_vert';
      let expected = [['name1', 'Cat1', 'Aug 14, 2023, 2:48:44 PM', '1.42 MB', actionsRow]];
      expect(Page.getTableRows()).toEqual(expected);
    })
  })

  describe('Filter by file category', () => {
    it('should filter out one item out of two items', async () => {
      // Arrange
      mockListItemsAndCategoriesWithTwoItemsAndThreeCategories();
      let fixture = MockRender(FileListComponent);
      let page = new Page(fixture);

      // Act
      await page.selectCategoryFilter('Cat1Child');

      // Assert
      let actionsRow = 'more_vert';
      let expected = [['name2', 'Cat1Cat1Child', 'Aug 3, 2023, 2:54:55 PM', '1.75 kB', actionsRow]];
      expect(Page.getTableRows()).toEqual(expected);
    })

    it('should filter based on root category', async () => {
      // Arrange
      let txtFolder = mockFolderElement('TXT');
      let imageFolder = mockFolderElement('Image');
      let imageFunnyFolder = mockFolderElement('Funny', imageFolder.id);
      let imageAvatarFolder = mockFolderElement('Avatar', imageFolder.id);
      let itemsAndCategories = [txtFolder, imageFolder, imageFunnyFolder, imageAvatarFolder];
      itemsAndCategories.push(mockFileElement('text.txt', txtFolder.id))
      itemsAndCategories.push(mockFileElement('funny.png', imageFunnyFolder.id))
      itemsAndCategories.push(mockFileElement('default.png', imageFolder.id))
      itemsAndCategories.push(mockFileElement('avatar.png', imageAvatarFolder.id))
      mockListItemsAndCategories(itemsAndCategories)

      let fixture = MockRender(FileListComponent);
      let page = new Page(fixture);

      // Act
      await page.selectCategoryFilter('Image');

      // Assert
      expect(Page.getDisplayedFileNames()).toEqual(['funny.png', 'default.png', 'avatar.png'])
    })
  })
  // TODO: test when there is nothing to show with a given filter + test when filtering by selecting category (on file list + on category list + with multiple category + check category selection somewhere impact other places)
});

function mockFileElement(name: string, parentId: string, id: string | undefined = undefined, size: number = 0, date: string = ''): FileElement {
  if(!id) {
    id = uuid();
  }
  return {
    id: id,
    size: size,
    date: date,
    name: name,
    iconLink: "link",
    dlLink: "dlLink",
    parentId: parentId
  };
}
function mockFolderElement(name: string, parentId: string = 'baseFolderId', id: string | undefined = undefined): FolderElement {
  if(!id) {
    id = uuid();
  }
  return {
    id: id,
    date: '2023-08-02T14:54:55.556Z',
    name: name,
    iconLink: "link",
    parentId: parentId
  }
}

function mockListItemsAndCategories(itemsAndCategories: (FileElement | FolderElement)[]) {
  let findOrCreateBaseFolderMock = MockInstance(BaseFolderService, 'findOrCreateBaseFolder',
    mock<BaseFolderService['findOrCreateBaseFolder']>());

  when(() => findOrCreateBaseFolderMock()).thenReturn(of('baseFolderId'));
  let listMock = MockInstance(FileService, 'findAll', mock<FileService['findAll']>());
  when(() => listMock()).thenReturn(of(itemsAndCategories));
  return listMock;
}

/**
 * @return two files, two categories and one sub-category
 */
function mockListItemsAndCategoriesWithTwoItemsAndThreeCategories() {
  let el3 = mockFolderElement('Cat1', 'baseFolderId', 'id3');
  let el4 = mockFolderElement('Cat2', 'baseFolderId', 'id4');
  let el5 = mockFolderElement('Cat1Child', el3.id, 'id5');
  let el1 = mockFileElement('name1', el3.id, 'id1', 1421315, '2023-08-14T14:48:44.928Z');
  let el2 = mockFileElement('name2', el5.id, 'id2', 1745, '2023-08-03T14:54:55.556Z');
  let itemsAndCategories = [el1, el2, el3, el4, el5];
  return mockListItemsAndCategories(itemsAndCategories);
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

  static getDisplayedFileNames(): string[] {
    return this.getTableRows().map(row => row[0]);
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
    return ngMocks.findAll(".categoryName")
      .map(value => value.nativeNode.textContent.trim());
  }

  async clickMenuTrash() {
    await this.clickMenu('.trash-file');
  }

  async clickMenuAssignCategory() {
    await this.clickMenu('.set-category-file');
  }

  async setCategoryInDialog(category: string) {
    let inputHarness = await this.loader.getHarness(MatInputHarness.with({placeholder: 'Select category...'}));
    await inputHarness.setValue(category);
    let testElement = await inputHarness.host();
    await testElement.sendKeys(TestKey.ENTER)
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

  async setFilter(filter: string) {
    let inputHarness = await this.loader.getHarness(MatInputHarness.with({placeholder: 'Filter'}));
    await inputHarness.setValue(filter);
  }

  async selectCategoryFilter(cat: string) {
    let categoryChipElement = ngMocks.findAll(".categoryName")
      .find(value => value.nativeNode.textContent.trim() === cat);
    let button: HTMLButtonElement = categoryChipElement?.nativeElement.querySelector('button');
    button.click();
  }

  private async clickMenu(selector: string) {
    let matMenuHarnesses = await this.loader.getAllHarnesses(MatMenuHarness);
    // The menu should be the one opened
    let matMenuHarness = await findAsyncSequential(matMenuHarnesses, value => value.isOpen());
    await matMenuHarness?.clickItem({selector: selector});
  }
}
