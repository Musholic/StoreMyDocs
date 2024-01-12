import {fakeAsync, tick} from '@angular/core/testing';

import {
  FileElement,
  FileListComponent,
  FolderElement,
  isFileElement,
  SelectFileCategoryDialog
} from './file-list.component';
import {MockBuilder, MockedComponentFixture, MockedDebugElement, MockRender, ngMocks} from "ng-mocks";
import {AppModule} from "../app.module";
import {MatTableModule} from "@angular/material/table";
import {mock, when} from "strong-mock";
import {of} from "rxjs";
import {NgxFilesizeModule} from "ngx-filesize";
import {TestbedHarnessEnvironment} from "@angular/cdk/testing/testbed";
import {HarnessLoader, TestKey} from "@angular/cdk/testing";
import {MatMenuHarness} from "@angular/material/menu/testing";
import {MatMenuModule} from "@angular/material/menu";
import {BrowserAnimationsModule, NoopAnimationsModule} from "@angular/platform-browser/animations";
import {findAsyncSequential, mustBeConsumedAsyncObservable} from "../../testing/common-testing-function.spec";
import {MatInputHarness} from "@angular/material/input/testing";
import {MatButtonHarness} from "@angular/material/button/testing";
import {MatDialogModule} from "@angular/material/dialog";
import {MatDialogHarness} from "@angular/material/dialog/testing";
import {MatInputModule} from "@angular/material/input";
import {FormsModule} from "@angular/forms";
import {MatTreeModule} from "@angular/material/tree";
import {MatChipsModule} from "@angular/material/chips";
import {v4 as uuid} from 'uuid';
import {By} from "@angular/platform-browser";
import {DebugElement} from "@angular/core";
import {MatAutocompleteHarness} from "@angular/material/autocomplete/testing";
import {MatChipGridHarness} from "@angular/material/chips/testing";
import {mockFileService} from "./file.service.spec";
import {MatSortModule} from "@angular/material/sort";
import {BreakpointObserver} from "@angular/cdk/layout";
import {FilesCacheService} from "../files-cache/files-cache.service";
import {mockFilesCacheService} from "../files-cache/files-cache.service.spec";

function mockRenderAndWaitForChanges() {
  let fixture = MockRender(FileListComponent, null, {reset: true});
  try {
    tick();
  } catch (e) {
  }
  fixture.detectChanges();
  return fixture;
}

describe('FileListComponent', () => {
  beforeEach(() => MockBuilder(FileListComponent, AppModule)
    .mock(FilesCacheService)
    .keep(MatTableModule)
    .keep(NgxFilesizeModule)
    .keep(MatMenuModule)
    .keep(MatDialogModule)
    .keep(MatInputModule)
    .keep(FormsModule)
    .keep(MatTreeModule)
    .keep(MatChipsModule)
    .keep(MatSortModule)
    .keep(BreakpointObserver)
    .provide({
      provide: FilesCacheService,
      useValue: mock<FilesCacheService>()
    })
    .replace(BrowserAnimationsModule, NoopAnimationsModule)
  );

  it('should create (no element)', fakeAsync(() => {
    // Arrange
    mockFilesCacheService([], true);

    // Act
    const component = mockRenderAndWaitForChanges().point.componentInstance;

    // Assert
    expect(component).toBeTruthy();
    expect(Page.getTableRows()).toEqual([]);
  }));

  it('should list two items', fakeAsync(() => {
    // Arrange
    mockListItemsAndCategoriesWithTwoItemsAndTwoCategories();

    // Act
    mockRenderAndWaitForChanges()

    // Assert
    let actionsRow = 'more_vert';
    let expected = [['name1', 'Cat1', 'Aug 14, 2023, 2:48:44 PM', '1.42 MB', actionsRow],
      ['name2', 'Cat1Cat1Child', 'Aug 3, 2023, 2:54:55 PM', '1.75 kB', actionsRow]];
    expect(Page.getTableRows()).toEqual(expected);
  }))

  it('should sort items by name', fakeAsync(() => {
    // Arrange
    let itemsAndCategories = [];
    itemsAndCategories.push(mockFileElement('za1'));
    itemsAndCategories.push(mockFileElement('ab5'));
    itemsAndCategories.push(mockFileElement('cd5'));
    itemsAndCategories.push(mockFileElement('cd4'));
    mockListItemsAndCategories(itemsAndCategories);

    // Act
    mockRenderAndWaitForChanges();

    // Assert
    expect(Page.getDisplayedFileNames()).toEqual(['ab5', 'cd4', 'cd5', 'za1']);
  }))

  it('should sort categories by name', fakeAsync(() => {
    // Arrange
    let itemsAndCategories = [];
    itemsAndCategories.push(mockFolderElement('za1'));
    let ab5Cat = mockFolderElement('ab5');
    itemsAndCategories.push(ab5Cat);
    itemsAndCategories.push(mockFolderElement('cd5', ab5Cat.id));
    itemsAndCategories.push(mockFolderElement('cd4', ab5Cat.id));
    mockListItemsAndCategories(itemsAndCategories, true);

    // Act
    mockRenderAndWaitForChanges();

    // Assert
    expect(Page.getCategories()).toEqual(['ab5', 'cd4', 'cd5', 'za1']);
  }))

  it('should trash an item then refresh', fakeAsync(async () => {
    // Arrange
    let cat1 = mockFolderElement('Cat1');
    let el1 = mockFileElement('name1', cat1.id);
    let fileService = mockListItemsAndCategories([el1, cat1]);
    when(() => fileService.trash(el1.id))
      .thenReturn(mustBeConsumedAsyncObservable(undefined));
    // A refresh is expected
    let filesCacheService = ngMocks.get(FilesCacheService);
    when(() => filesCacheService.refreshCacheAndReload()).thenReturn();

    let fixture = mockRenderAndWaitForChanges();
    let page = new Page(fixture);

    // Act
    Page.openItemMenu('name1');
    await page.clickMenuTrash()

    // Assert
    // No failure in mock setup
  }))

  it('When a category is empty, should automatically remove it', fakeAsync(async () => {
    // Arrange
    let cat1Folder = mockFolderElement('Cat1');
    let fileElement = mockFileElement('name1');
    let fileService = mockListItemsAndCategories([fileElement, cat1Folder]);

    // We expect the category to be trashed since there is no file in it anymore
    when(() => fileService.trash(cat1Folder.id))
      .thenReturn(mustBeConsumedAsyncObservable(undefined));

    let filesCacheService = ngMocks.findInstance(FilesCacheService);
    when(() => filesCacheService.refreshCacheAndReload()).thenReturn();

    // Act
    mockRenderAndWaitForChanges();

    // Assert
    // No failure from mock setup
  }))

  it('should list two categories and one sub-category', fakeAsync(() => {
    // Arrange
    let cat1 = mockFolderElement('Cat1');
    let cat1Child = mockFolderElement('Cat1Child', cat1.id);
    let cat2 = mockFolderElement('Cat2');
    mockListItemsAndCategories([cat1, cat1Child, cat2], true);

    // Act
    mockRenderAndWaitForChanges();

    // Assert
    tick();
    expect(Page.getCategories()).toEqual(['Cat1', 'Cat1Child', 'Cat2'])
  }))

  it('should not list base folder as category in row categories', fakeAsync(() => {
    // Arrange
    let baseFolder = mockFolderElement('BaseFolder', 'rootId');
    baseFolder.id = 'baseFolderId'
    let el1 = mockFileElement('name1', baseFolder.id, 1421315, '2023-08-14T14:48:44.928Z');
    mockListItemsAndCategories([baseFolder, el1]);

    // Act
    mockRenderAndWaitForChanges();

    // Assert
    let actionsRow = 'more_vert';
    let expected = [['name1', '', 'Aug 14, 2023, 2:48:44 PM', '1.42 MB', actionsRow]];
    expect(Page.getTableRows()).toEqual(expected);
  }))

  describe('Category assignment', () => {
    it('should refresh after assigning a category to a file', fakeAsync(async () => {
      // Arrange
      let el2 = mockFileElement('name2');
      let fileService = mockListItemsAndCategories([el2]);

      // A refresh is expected
      let filesCacheService = ngMocks.get(FilesCacheService);
      when(() => filesCacheService.refreshCacheAndReload()).thenReturn();

      when(() => fileService.findOrCreateFolder('Cat848', 'baseFolderId')).thenReturn(of('cat848Id'));
      when(() => fileService.setCategory(el2.id, 'cat848Id')).thenReturn(of(undefined));

      let fixture = mockRenderAndWaitForChanges();
      let page = new Page(fixture);

      // Act
      Page.openItemMenu('name2');
      await page.clickMenuAssignCategory();
      await page.setCategoryInDialog('Cat848');
      await page.clickOkInDialog();

      // Assert
      // No failure in mock setup
    }))

    it('should show name of the file being assigned to a category in dialog', fakeAsync(async () => {
      // Arrange
      mockListItemsAndCategoriesWithTwoItemsAndTwoCategories();

      let fixture = mockRenderAndWaitForChanges();
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

    it('should cancel when clicking on cancel', fakeAsync(async () => {
      // Arrange
      mockListItemsAndCategoriesWithTwoItemsAndTwoCategories();

      let fixture = mockRenderAndWaitForChanges();
      let page = new Page(fixture);
      Page.openItemMenu('name2');
      // Open a dialog here
      await page.clickMenuAssignCategory();

      // Act
      await page.clickCancelInDialog();

      // Assert
      tick();
      // The dialog should be closed
      expect(await page.hasDialogOpened()).toBeFalsy();
    }))

    it('should not accept empty category', fakeAsync(async () => {
      // Arrange
      let fileElement = mockFileElement('name1');
      let fileService = mockListItemsAndCategories([fileElement]);
      // A refresh is expected
      let filesCacheService = ngMocks.get(FilesCacheService);
      when(() => filesCacheService.refreshCacheAndReload()).thenReturn();

      when(() => fileService.setCategory(fileElement.id, "baseFolderId")).thenReturn(of(undefined));

      let fixture = mockRenderAndWaitForChanges();
      let page = new Page(fixture);

      // Act
      Page.openItemMenu('name1');
      await page.clickMenuAssignCategory();
      // When we try to create this empty category, nothing happens actually
      await page.setCategoryInDialog('');
      await page.clickOkInDialog();

      // Assert
      // No failure from mock setup
    }))

    it('should be able to remove a category', fakeAsync(async () => {
      // Arrange
      let fileElement = mockFileElement('name1');
      let fileService = mockListItemsAndCategories([fileElement]);
      // A refresh is expected
      let filesCacheService = ngMocks.get(FilesCacheService);
      when(() => filesCacheService.refreshCacheAndReload()).thenReturn();

      when(() => fileService.setCategory(fileElement.id, "baseFolderId")).thenReturn(of(undefined));

      let fixture = mockRenderAndWaitForChanges();
      let page = new Page(fixture);

      // Act
      Page.openItemMenu('name1');
      await page.clickMenuAssignCategory();
      await page.setCategoryInDialog('CatToRemove');
      await page.removeCategoryInDialog('CatToRemove');
      await page.clickOkInDialog();

      // Assert
      // No failure from mock setup
    }))

    it('should remove trailing and leading spaces from a category', fakeAsync(async () => {
      // Arrange
      let fileElement = mockFileElement('name1');
      let fileService = mockListItemsAndCategories([fileElement]);
      // A refresh is expected
      let filesCacheService = ngMocks.get(FilesCacheService);
      when(() => filesCacheService.refreshCacheAndReload()).thenReturn();

      when(() => fileService.setCategory(fileElement.id, "parentCat45Id")).thenReturn(of(undefined));

      when(() => fileService.findOrCreateFolder('Cat45', 'baseFolderId')).thenReturn(of('parentCat45Id'));

      let fixture = mockRenderAndWaitForChanges();
      let page = new Page(fixture);

      // Act
      Page.openItemMenu('name1');
      await page.clickMenuAssignCategory();
      await page.setCategoryInDialog('   Cat45   ');
      await page.clickOkInDialog();

      // Assert
      // No failure from mock setup
    }))

    it('should create and assign a sub-category', fakeAsync(async () => {
      // Arrange
      let el2 = mockFileElement('name2');
      let fileService = mockListItemsAndCategories([el2]);
      // A refresh is expected
      let filesCacheService = ngMocks.get(FilesCacheService);
      when(() => filesCacheService.refreshCacheAndReload()).thenReturn();

      when(() => fileService.setCategory(el2.id, 'cat7Id')).thenReturn(of(undefined));

      when(() => fileService.findOrCreateFolder('ParentCat8', 'baseFolderId')).thenReturn(of('parentCat8Id'));
      when(() => fileService.findOrCreateFolder('Cat7', 'parentCat8Id')).thenReturn(of('cat7Id'));

      let fixture = mockRenderAndWaitForChanges();
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

    it('should suggest root categories', fakeAsync(async () => {
      // Arrange
      let cat1Folder = mockFolderElement('cat1');
      let cat2Folder = mockFolderElement('cat2');
      let cat1bFolder = mockFolderElement('cat1b', cat1Folder.id);
      let fileElement1 = mockFileElement('name1');
      mockListItemsAndCategories([cat1Folder, cat2Folder, cat1bFolder, fileElement1], true);

      let fixture = mockRenderAndWaitForChanges();
      let page = new Page(fixture);

      // Act
      Page.openItemMenu('name1');
      await page.clickMenuAssignCategory();

      // Assert
      let expected = await page.getSuggestedCategoryInDialog();
      expect(expected).toEqual(['cat1', 'cat2'])
    }))

    it('should suggest root categories and filter them by the current input', fakeAsync(async () => {
      // Arrange
      let cat1Folder = mockFolderElement('cat1');
      let cat2Folder = mockFolderElement('cat2');
      let cat1bFolder = mockFolderElement('cat1b', cat1Folder.id);
      let fileElement1 = mockFileElement('name1');
      mockListItemsAndCategories([cat1Folder, cat2Folder, cat1bFolder, fileElement1], true);

      let fixture = mockRenderAndWaitForChanges();
      let page = new Page(fixture);

      // Act
      Page.openItemMenu('name1');
      await page.clickMenuAssignCategory();
      await page.typeCategoryInDialog('1');

      // Assert
      let expected = await page.getSuggestedCategoryInDialog();
      expect(expected).toEqual(['cat1'])
    }))

    it('should be able to select a suggested category', fakeAsync(async () => {
      // Arrange
      let cat1Folder = mockFolderElement('cat1');
      let cat2Folder = mockFolderElement('cat2');
      let cat1bFolder = mockFolderElement('cat1b', cat1Folder.id);
      let fileElement1 = mockFileElement('name1');
      let fileService = mockListItemsAndCategories([cat1Folder, cat2Folder, cat1bFolder, fileElement1], true);

      // A refresh is expected
      let filesCacheService = ngMocks.get(FilesCacheService);
      when(() => filesCacheService.refreshCacheAndReload()).thenReturn();

      when(() => fileService.setCategory(fileElement1.id, cat1Folder.id)).thenReturn(of(undefined));

      when(() => fileService.findOrCreateFolder(cat1Folder.name, 'baseFolderId')).thenReturn(of(cat1Folder.id));

      let fixture = mockRenderAndWaitForChanges();
      let page = new Page(fixture);

      // Act
      Page.openItemMenu('name1');
      await page.clickMenuAssignCategory();
      // First suggested category should be 'cat1'
      await page.clickFirstSuggestedCategoryInDialog();
      await page.clickOkInDialog();

      // Assert
      // No failure from mock setup
    }))

    it('should suggest sub-categories', fakeAsync(async () => {
      // Arrange
      let cat1Folder = mockFolderElement('cat1');
      let cat2Folder = mockFolderElement('cat2');
      let cat1bFolder = mockFolderElement('cat1b', cat1Folder.id);
      let fileElement1 = mockFileElement('name1');
      mockListItemsAndCategories([cat1Folder, cat2Folder, cat1bFolder, fileElement1], true);

      let fixture = mockRenderAndWaitForChanges();
      let page = new Page(fixture);

      // Act
      Page.openItemMenu('name1');
      await page.clickMenuAssignCategory();
      // First suggested category should be 'cat1'
      await page.clickFirstSuggestedCategoryInDialog();

      // Assert
      let expected = await page.getSuggestedCategoryInDialog();
      expect(expected).toEqual(['cat1b'])
    }))

    it('should clear category input after selecting a category', fakeAsync(async () => {
      // Arrange
      let cat1Folder = mockFolderElement('cat1');
      let fileElement1 = mockFileElement('name1');
      mockListItemsAndCategories([cat1Folder, fileElement1], true);

      let fixture = mockRenderAndWaitForChanges()
      let page = new Page(fixture);

      // Act
      Page.openItemMenu('name1');
      await page.clickMenuAssignCategory();
      await page.setCategoryInDialog('cat1');

      // Assert
      expect(await page.getInputCategoryValue()).toEqual('');
    }))


    it('should refresh category suggestion after removing a category', fakeAsync(async () => {
      // Arrange
      let cat1Folder = mockFolderElement('cat1');
      let cat1bFolder = mockFolderElement('cat1b', cat1Folder.id);
      let fileElement = mockFileElement('name1');
      mockListItemsAndCategories([cat1Folder, cat1bFolder, fileElement], true);

      let fixture = mockRenderAndWaitForChanges();
      let page = new Page(fixture);

      // Act
      Page.openItemMenu('name1');
      await page.clickMenuAssignCategory();
      await page.setCategoryInDialog('cat1');
      await page.removeCategoryInDialog('cat1');

      // Assert
      fixture.detectChanges();
      tick();

      let result = await page.getSuggestedCategoryInDialog();
      expect(result).toEqual(['cat1'])
    }))

    it('should initialize the category with the existing one', fakeAsync(async () => {
      // Arrange
      let cat1Folder = mockFolderElement('cat1');
      let cat1bFolder = mockFolderElement('cat1b', cat1Folder.id);
      let fileElement1 = mockFileElement('name1', cat1bFolder.id);
      mockListItemsAndCategories([cat1Folder, cat1bFolder, fileElement1]);

      let fixture = mockRenderAndWaitForChanges();
      let page = new Page(fixture);

      // Act
      Page.openItemMenu('name1');
      await page.clickMenuAssignCategory();

      // Assert
      let result = await page.getCategoriesInDialog();
      expect(result).toEqual(['cat1', 'cat1b'])
    }))
  })

  describe('Filter by file name', () => {
    it('should filter out one item out of two items', async () => {
      // Arrange
      mockListItemsAndCategoriesWithTwoItemsAndTwoCategories();
      let fixture = mockRenderAndWaitForChanges();
      let page = new Page(fixture);

      // Act
      await page.setFilter('name1');

      // Assert
      let actionsRow = 'more_vert';
      let expected = [['name1', 'Cat1', 'Aug 14, 2023, 2:48:44 PM', '1.42 MB', actionsRow]];
      expect(Page.getTableRows()).toEqual(expected);
    })

    it('should ignore case', async () => {
      // Arrange
      let el1 = mockFileElement('nAme1');
      mockListItemsAndCategories([el1]);
      let fixture = mockRenderAndWaitForChanges();
      let page = new Page(fixture);

      // Act
      await page.setFilter('NaMe1');

      // Assert
      expect(Page.getDisplayedFileNames()).toEqual(['nAme1']);
    })

    it('should ignore trailing and leading spaces in the filter', async () => {
      // Arrange
      let el1 = mockFileElement('name1');
      mockListItemsAndCategories([el1]);
      let fixture = mockRenderAndWaitForChanges();
      let page = new Page(fixture);

      // Act
      await page.setFilter(' name1 ');

      // Assert
      expect(Page.getDisplayedFileNames()).toEqual(['name1']);
    })

    it('should show a not found message when there is no document matching the filter', async () => {
      // Arrange
      let el1 = mockFileElement('name1');
      mockListItemsAndCategories([el1]);
      let fixture = mockRenderAndWaitForChanges();
      let page = new Page(fixture);

      // Act
      await page.setFilter('not found');

      // Assert
      expect(Page.getDisplayedFileNames()).toEqual([]);
      expect(Page.getNotFoundMessage()).toEqual('No document matching the file name "not found"')
    })
  })

  describe('Filter by file category', () => {
    it('should filter out one item out of two items', fakeAsync(() => {
      // Arrange
      mockListItemsAndCategoriesWithTwoItemsAndTwoCategories();
      let fixture = mockRenderAndWaitForChanges();

      // Act
      Page.selectCategoryFilter('Cat1Child');

      // Assert
      fixture.detectChanges();
      let actionsRow = 'more_vert';
      let expected = [['name2', 'Cat1Cat1Child', 'Aug 3, 2023, 2:54:55 PM', '1.75 kB', actionsRow]];
      expect(Page.getTableRows()).toEqual(expected);
    }))

    it('should filter based on root category', fakeAsync(() => {
      // Arrange
      mockTxtAndImageFiles();

      let fixture = mockRenderAndWaitForChanges();

      // Act
      Page.selectCategoryFilter('Image');

      // Assert
      fixture.detectChanges();
      expect(Page.getDisplayedFileNames()).toEqual(['avatar.png', 'default.png', 'funny.png'])
    }))

    it('should filter on two unrelated categories', fakeAsync(() => {
      // Arrange
      mockTxtAndImageFiles();

      let fixture = mockRenderAndWaitForChanges();

      // Act
      Page.selectCategoryFilter('TXT');
      Page.selectCategoryFilter('Avatar');

      // Assert
      fixture.detectChanges()
      expect(Page.getDisplayedFileNames()).toEqual(['avatar.png', 'text.txt'])
    }))

    it('should allow removing a category filter', fakeAsync(() => {
      // Arrange
      mockTxtAndImageFiles();

      let fixture = mockRenderAndWaitForChanges();

      // Act
      Page.selectCategoryFilter('TXT');
      Page.selectCategoryFilter('TXT');

      // Assert
      fixture.detectChanges()
      expect(Page.getDisplayedFileNames()).toEqual(['avatar.png', 'default.png', 'funny.png', 'text.txt'])
    }))

    it('should allow filtering on the file categories, from a row of the table list', fakeAsync(() => {
      // Arrange
      mockTxtAndImageFiles();

      let fixture = mockRenderAndWaitForChanges()

      // Act
      Page.selectCategoryFilterOnFileRow('avatar.png', 'Avatar');

      // Assert
      fixture.detectChanges()
      expect(Page.getDisplayedFileNames()).toEqual(['avatar.png'])
    }))

    it('when filtering from a row, should change the filter state on the categories list (for leaf category)', fakeAsync(() => {
      // Arrange
      mockTxtAndImageFiles();

      let fixture = mockRenderAndWaitForChanges();

      // Act
      Page.selectCategoryFilterOnFileRow('avatar.png', 'Avatar');

      // Assert
      fixture.detectChanges()
      expect(Page.isCategorySelectedOnCategoriesList('Avatar')).toBeTruthy();
    }))

    it('when filtering from a row, should change the filter state on the categories list (for parent category)', fakeAsync(() => {
      // Arrange
      mockTxtAndImageFiles();

      let fixture = mockRenderAndWaitForChanges();

      // Act
      Page.selectCategoryFilterOnFileRow('avatar.png', 'Image');

      // Assert
      tick();
      fixture.detectChanges()
      expect(Page.isCategorySelectedOnCategoriesList('Image')).toBeTruthy();
    }))

    it('when filtering from the categories list, should change the filter state on the rows', fakeAsync(() => {
      // Arrange
      mockTxtAndImageFiles();

      let fixture = mockRenderAndWaitForChanges();

      // Act
      Page.selectCategoryFilter('TXT');

      // Assert
      fixture.detectChanges()
      expect(Page.isCategorySelectedOnFileRow('text.txt', 'TXT')).toBeTruthy();
    }))

    it('in categories list, show a expand icon on parent category only', fakeAsync(() => {
      // Arrange
      mockTxtAndImageFiles();

      // Act
      mockRenderAndWaitForChanges();

      // Assert
      expect(Page.isCategoryWithExpandIcon('TXT')).toBeFalsy();
      expect(Page.isCategoryWithExpandIcon('Image')).toBeTruthy();
    }))
  })
});

export function mockFileElement(name: string, parentId: string = 'baseFolderId', size: number = 0, date: string = '0'): FileElement {
  let id = name + '-' + uuid();
  return {
    id: id,
    size: size,
    createdTime: new Date(date),
    modifiedTime: new Date(date),
    name: name,
    iconLink: "link",
    dlLink: "dlLink",
    parentId: parentId
  };
}

function mockFolderElement(name: string, parentId: string = 'baseFolderId'): FolderElement {
  let id = name + '-' + uuid();
  return {
    id: id,
    createdTime: new Date('2023-08-02T14:54:55.556Z'),
    modifiedTime: new Date('2023-08-02T14:54:55.556Z'),
    name: name,
    iconLink: "link",
    parentId: parentId
  }
}

function mockListItemsAndCategories(itemsAndCategories: (FileElement | FolderElement)[], fillEachCategory: boolean = false) {
  if (fillEachCategory) {
    let categories = itemsAndCategories.filter(file => !isFileElement(file))
      .map(value => value as FolderElement);
    categories.forEach(cat => {
      itemsAndCategories.push(mockFileElement(cat.name + "_file", cat.id))
    })
  }
  mockFilesCacheService(itemsAndCategories, true);
  return mockFileService();
}

function mockTxtAndImageFiles() {
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
}

/**
 * @return two files, two categories and one sub-category
 */
function mockListItemsAndCategoriesWithTwoItemsAndTwoCategories() {
  let cat1 = mockFolderElement('Cat1', 'baseFolderId');
  let cat1Child = mockFolderElement('Cat1Child', cat1.id);
  let el1 = mockFileElement('name1', cat1.id, 1421315, '2023-08-14T14:48:44.928Z');
  let el2 = mockFileElement('name2', cat1Child.id, 1745, '2023-08-03T14:54:55.556Z');
  let itemsAndCategories = [el1, el2, cat1, cat1Child];
  return mockListItemsAndCategories(itemsAndCategories);
}

class Page {
  private fixture: MockedComponentFixture<FileListComponent, FileListComponent>;
  private loader: HarnessLoader;

  constructor(fixture: MockedComponentFixture<FileListComponent, FileListComponent>) {
    this.fixture = fixture;
    this.loader = TestbedHarnessEnvironment.documentRootLoader(fixture);
  }

  static getTableRows(): string[][] {
    return ngMocks.findAll("[mat-row]")
      .map(row => row.children
        .map(child => child.nativeNode.textContent.trim()));
  }

  static getDisplayedFileNames(): string[] {
    return this.getTableRows().map(row => row[0]);
  }

  static openItemMenu(name: string) {
    ngMocks.find(this.getFileRow(name), ".mat-column-actions").nativeNode.click();
  }

  static getCategories() {
    return ngMocks.findAll(".categoryName")
      .map(value => value.nativeNode.textContent.trim());
  }

  static selectCategoryFilter(cat: string) {
    let categoryChipElement = ngMocks.findAll(".categoryName")
      .find(value => value.nativeNode.textContent.trim() === cat);
    let button: HTMLButtonElement = categoryChipElement?.nativeElement.querySelector('button');
    button.click();
  }

  static selectCategoryFilterOnFileRow(fileName: string, cat: string) {
    let categoryChipElement = this.getFileRow(fileName).queryAll(By.css("mat-chip-option"))
      .find(value => value.nativeNode.textContent.trim() === cat);
    let button: HTMLButtonElement = categoryChipElement?.nativeElement.querySelector('button');
    button.click();
  }

  static isCategorySelectedOnCategoriesList(cat: string) {
    let categoryChipElement = ngMocks.findAll(".categoryName")
      .find(value => value.nativeNode.textContent.trim() === cat);
    return !!categoryChipElement?.classes['mat-mdc-chip-selected'];
  }

  static isCategoryWithExpandIcon(cat: string) {
    let categoryChipElement = ngMocks.findAll(".categoryName")
      .find(value => value.nativeNode.textContent.trim() === cat);
    let parent: DebugElement = <DebugElement>categoryChipElement?.parent;
    // Check we have a button which is the expand icon
    return parent.children.some(value => value.name === 'button');
  }


  static isCategorySelectedOnFileRow(fileName: string, cat: string) {
    let categoryChipElement = this.getFileRow(fileName).queryAll(By.css("mat-chip-option"))
      .find(value => value.nativeNode.textContent.trim() === cat);
    return !!categoryChipElement?.classes['mat-mdc-chip-selected'];
  }

  static getNotFoundMessage() {
    return ngMocks.find('.not_found').nativeNode.textContent.trim();
  }

  private static getFileRow(name: string): MockedDebugElement {
    return ngMocks.findAll("[mat-row]")
      .filter(value => {
        let nameColumn = ngMocks.find(value, ".mat-column-name");
        return nameColumn.nativeNode.textContent.trim() === name;
      })[0];
  }

  async clickMenuTrash() {
    await this.clickMenu('.trash-file');
  }

  async clickMenuAssignCategory() {
    await this.clickMenu('.set-category-file');
  }

  async setCategoryInDialog(category: string) {
    let testElement = await this.typeCategoryInDialog(category);
    await testElement.sendKeys(TestKey.ENTER)
  }

  async getCategoriesInDialog() {
    let dialogHarness = await this.loader.getHarness(MatDialogHarness);
    let matChipGridHarness = await dialogHarness.getHarness(MatChipGridHarness);
    let matChipRowHarnesses = await matChipGridHarness.getRows();
    return Promise.all(matChipRowHarnesses.map(value => value.getText()));
  }

  async typeCategoryInDialog(category: string) {
    let inputHarness = await this.getCategoryInput();
    await inputHarness.setValue(category);
    return await inputHarness.host();
  }

  async getInputCategoryValue() {
    let inputHarness = await this.getCategoryInput();
    return inputHarness.getValue();
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

  async hasDialogOpened() {
    let dialogHarness = await this.loader.getHarnessOrNull(MatDialogHarness);
    return dialogHarness !== null;
  }

  async getSuggestedCategoryInDialog() {
    let matAutocompleteHarness = await this.loader.getHarness(MatAutocompleteHarness);
    let options = await matAutocompleteHarness.getOptions();
    return Promise.all(options.map(value => value.getText()));
  }

  async clickFirstSuggestedCategoryInDialog() {
    let matAutocompleteHarness = await this.loader.getHarness(MatAutocompleteHarness);
    let options = await matAutocompleteHarness.getOptions();
    await options[0].click();
  }

  async setFilter(filter: string) {
    let inputHarness = await this.loader.getHarness(MatInputHarness.with({placeholder: 'Filter'}));
    await inputHarness.setValue(filter);
  }

  async removeCategoryInDialog(catToRemove: string) {
    let selectFileCategoryDialog = this.getSelectFileCategoryDialog();
    selectFileCategoryDialog.remove(catToRemove);
  }

  private getCategoryInput() {
    return this.loader.getHarness(MatInputHarness.with({placeholder: 'Select category...'}));
  }

  private getSelectFileCategoryDialog() {
    return this.fixture.debugElement.parent?.query(By.directive(SelectFileCategoryDialog)).componentInstance as SelectFileCategoryDialog;
  }

  private async clickMenu(selector: string) {
    let matMenuHarnesses = await this.loader.getAllHarnesses(MatMenuHarness);
    // The menu should be the one opened
    let matMenuHarness = await findAsyncSequential(matMenuHarnesses, value => value.isOpen());
    await matMenuHarness?.clickItem({selector: selector});
  }

}
