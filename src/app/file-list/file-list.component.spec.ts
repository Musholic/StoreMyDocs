import {fakeAsync, tick} from '@angular/core/testing';

import {FileElement, FileListComponent, FolderElement, SelectFileCategoryDialog} from './file-list.component';
import {MockBuilder, MockedComponentFixture, MockedDebugElement, MockInstance, MockRender, ngMocks} from "ng-mocks";
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
import {findAsyncSequential, mustBeConsumedAsyncObservable} from "../../testing/common-testing-function.spec";
import {BaseFolderService} from "../file-upload/base-folder.service";
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
    .keep(MatSortModule)
    .replace(BrowserAnimationsModule, NoopAnimationsModule)
  );

  it('should create (no element)', fakeAsync(() => {
    // Arrange
    let findOrCreateBaseFolderMock = MockInstance(BaseFolderService, 'findOrCreateBaseFolder',
      mock<BaseFolderService['findOrCreateBaseFolder']>());
    when(() => findOrCreateBaseFolderMock()).thenReturn(of('baseFolderId'));

    let listMock = MockInstance(FileService, 'findAll', mock<FileService['findAll']>());
    when(() => listMock()).thenReturn(mustBeConsumedAsyncObservable([]));

    // Act
    const component = MockRender(FileListComponent).point.componentInstance;

    // Assert
    tick();
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

  it('should sort items by name', () => {
    // Arrange
    let itemsAndCategories = [];
    itemsAndCategories.push(mockFileElement('za1'));
    itemsAndCategories.push(mockFileElement('ab5'));
    itemsAndCategories.push(mockFileElement('cd5'));
    itemsAndCategories.push(mockFileElement('cd4'));
    mockListItemsAndCategories(itemsAndCategories);

    // Act
    MockRender(FileListComponent)

    // Assert
    expect(Page.getDisplayedFileNames()).toEqual(['ab5', 'cd4', 'cd5', 'za1']);
  })

  it('should sort categories by name', () => {
    // Arrange
    let itemsAndCategories = [];
    itemsAndCategories.push(mockFolderElement('za1'));
    let ab5Cat = mockFolderElement('ab5');
    itemsAndCategories.push(ab5Cat);
    itemsAndCategories.push(mockFolderElement('cd5', ab5Cat.id));
    itemsAndCategories.push(mockFolderElement('cd4', ab5Cat.id));
    mockListItemsAndCategories(itemsAndCategories);

    // Act
    MockRender(FileListComponent)

    // Assert
    expect(Page.getCategories()).toEqual(['ab5', 'cd4', 'cd5', 'za1']);
  })

  it('should trash an item then refresh', fakeAsync(async () => {
    // Arrange
    let fileService = mockListItemsAndCategoriesWithTwoItemsAndThreeCategories();
    when(() => fileService.trash('id2'))
      .thenReturn(mustBeConsumedAsyncObservable(undefined));
    let el1: FileElement = {
      id: 'id1',
      size: 1421315,
      date: '2023-08-14T14:48:44.928Z',
      name: 'name1',
      iconLink: "link",
      dlLink: "dlLink",
      parentId: "rootId"
    };
    when(() => fileService.findAll()).thenReturn(of([el1]))

    let fixture = MockRender(FileListComponent);
    let page = new Page(fixture);

    // Act
    Page.openItemMenu('name2');
    await page.clickMenuTrash()

    // Assert
    tick();
    let actionsRow = 'more_vert';
    let expected = [['name1', '', 'Aug 14, 2023, 2:48:44 PM', '1.42 MB', actionsRow]];
    expect(Page.getTableRows()).toEqual(expected);
  }))

  it('When trashing the last file from a category, should also remove the category', fakeAsync(async () => {
    // Arrange
    let cat1Folder = mockFolderElement('Cat1');
    let fileElement = mockFileElement('name1', cat1Folder.id);
    let fileService = mockListItemsAndCategories([fileElement, cat1Folder]);
    // We expect a refresh, the refresh should include the folder and the file which have moved
    let fileElementAfterRefresh = mockFileElement('name1');
    when(() => fileService.findAll()).thenReturn(mustBeConsumedAsyncObservable([fileElementAfterRefresh, cat1Folder]));

    when(() => fileService.trash(fileElement.id))
      .thenReturn(mustBeConsumedAsyncObservable(undefined));

    // We expect the category to be trashed since there is no file in it anymore
    when(() => fileService.trash(cat1Folder.id))
      .thenReturn(mustBeConsumedAsyncObservable(undefined));

    // We expect a last refresh after trashing the category
    when(() => fileService.findAll()).thenReturn(mustBeConsumedAsyncObservable([fileElementAfterRefresh]));

    let fixture = MockRender(FileListComponent);
    let page = new Page(fixture);

    // Act
    Page.openItemMenu('name1');
    await page.clickMenuTrash();

    // Assert
    // No failure from mock setup
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

  it('should not list base folder as category in row categories', () => {
    // Arrange
    let baseFolder = mockFolderElement('BaseFolder', 'rootId', 'baseFolderId');
    let el1 = mockFileElement('name1', baseFolder.id, 'id1', 1421315, '2023-08-14T14:48:44.928Z');
    mockListItemsAndCategories([baseFolder, el1]);

    // Act
    let fixture = MockRender(FileListComponent);

    // Assert
    fixture.detectChanges();
    let actionsRow = 'more_vert';
    let expected = [['name1', '', 'Aug 14, 2023, 2:48:44 PM', '1.42 MB', actionsRow]];
    expect(Page.getTableRows()).toEqual(expected);
  })

  describe('Category assignment', () => {
    it('should refresh after assigning a category to a file', fakeAsync(async () => {
      // Arrange
      let el2 = mockFileElement('name2');
      let fileService = mockListItemsAndCategories([el2]);

      let el1: FileElement = {
        id: 'id1',
        size: 1421315,
        date: '2023-08-14T14:48:44.928Z',
        name: 'name1',
        iconLink: "link",
        dlLink: "dlLink",
        parentId: "rootId"
      };
      when(() => fileService.findAll()).thenReturn(of([el1]))
      let findOrCreateFolderMock = MockInstance(FileService, 'findOrCreateFolder', mock<FileService['findOrCreateFolder']>());
      when(() => findOrCreateFolderMock('Cat848', 'baseFolderId')).thenReturn(of('cat848Id'));
      let setCategoryMock = MockInstance(FileService, 'setCategory', mock<FileService['setCategory']>());
      when(() => setCategoryMock(el2.id, 'cat848Id')).thenReturn(of(undefined));

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

    it('should cancel when clicking on cancel', fakeAsync(async () => {
      // Arrange
      mockListItemsAndCategoriesWithTwoItemsAndThreeCategories();

      let fixture = MockRender(FileListComponent);
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
      // We expect a refresh
      when(() => fileService.findAll()).thenReturn(of());

      let setCategoryMock = MockInstance(FileService, 'setCategory', mock<FileService['setCategory']>());
      when(() => setCategoryMock(fileElement.id, "baseFolderId")).thenReturn(of(undefined));

      let fixture = MockRender(FileListComponent);
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
      // We expect a refresh
      when(() => fileService.findAll()).thenReturn(of());

      let setCategoryMock = MockInstance(FileService, 'setCategory', mock<FileService['setCategory']>());
      when(() => setCategoryMock(fileElement.id, "baseFolderId")).thenReturn(of(undefined));

      let fixture = MockRender(FileListComponent);
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
      // We expect a refresh
      when(() => fileService.findAll()).thenReturn(of());

      let setCategoryMock = MockInstance(FileService, 'setCategory', mock<FileService['setCategory']>());
      when(() => setCategoryMock(fileElement.id, "parentCat45Id")).thenReturn(of(undefined));

      let findOrCreateFolderMock = MockInstance(FileService, 'findOrCreateFolder', mock<FileService['findOrCreateFolder']>());
      when(() => findOrCreateFolderMock('Cat45', 'baseFolderId')).thenReturn(of('parentCat45Id'));

      let fixture = MockRender(FileListComponent);
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
      // We expect a refresh
      when(() => fileService.findAll()).thenReturn(of());

      let setCategoryMock = MockInstance(FileService, 'setCategory', mock<FileService['setCategory']>());
      when(() => setCategoryMock(el2.id, 'cat7Id')).thenReturn(of(undefined));

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

    it('should suggest root categories', async () => {
      // Arrange
      let cat1Folder = mockFolderElement('cat1');
      let cat2Folder = mockFolderElement('cat2');
      let cat1bFolder = mockFolderElement('cat1b', cat1Folder.id);
      let fileElement1 = mockFileElement('name1');
      mockListItemsAndCategories([cat1Folder, cat2Folder, cat1bFolder, fileElement1]);

      let fixture = MockRender(FileListComponent);
      let page = new Page(fixture);

      // Act
      Page.openItemMenu('name1');
      await page.clickMenuAssignCategory();

      // Assert
      let expected = await page.getSuggestedCategoryInDialog();
      expect(expected).toEqual(['cat1', 'cat2'])
    })

    it('should suggest root categories and filter them by the current input', async () => {
      // Arrange
      let cat1Folder = mockFolderElement('cat1');
      let cat2Folder = mockFolderElement('cat2');
      let cat1bFolder = mockFolderElement('cat1b', cat1Folder.id);
      let fileElement1 = mockFileElement('name1');
      mockListItemsAndCategories([cat1Folder, cat2Folder, cat1bFolder, fileElement1]);

      let fixture = MockRender(FileListComponent);
      let page = new Page(fixture);

      // Act
      Page.openItemMenu('name1');
      await page.clickMenuAssignCategory();
      await page.typeCategoryInDialog('1');

      // Assert
      let expected = await page.getSuggestedCategoryInDialog();
      expect(expected).toEqual(['cat1'])
    })

    it('should be able to select a suggested category', async () => {
      // Arrange
      let cat1Folder = mockFolderElement('cat1');
      let cat2Folder = mockFolderElement('cat2');
      let cat1bFolder = mockFolderElement('cat1b', cat1Folder.id);
      let fileElement1 = mockFileElement('name1');
      let fileService = mockListItemsAndCategories([cat1Folder, cat2Folder, cat1bFolder, fileElement1]);

      // We expect a refresh
      when(() => fileService.findAll()).thenReturn(of([]));

      let setCategoryMock = MockInstance(FileService, 'setCategory', mock<FileService['setCategory']>());
      when(() => setCategoryMock(fileElement1.id, cat1Folder.id)).thenReturn(of(undefined));

      let findOrCreateFolderMock = MockInstance(FileService, 'findOrCreateFolder', mock<FileService['findOrCreateFolder']>());
      when(() => findOrCreateFolderMock(cat1Folder.name, 'baseFolderId')).thenReturn(of(cat1Folder.id));

      let fixture = MockRender(FileListComponent);
      let page = new Page(fixture);

      // Act
      Page.openItemMenu('name1');
      await page.clickMenuAssignCategory();
      // First suggested category should be 'cat1'
      await page.clickFirstSuggestedCategoryInDialog();
      await page.clickOkInDialog();

      // Assert
      // No failure from mock setup
    })

    it('should suggest sub-categories', async () => {
      // Arrange
      let cat1Folder = mockFolderElement('cat1');
      let cat2Folder = mockFolderElement('cat2');
      let cat1bFolder = mockFolderElement('cat1b', cat1Folder.id);
      let fileElement1 = mockFileElement('name1');
      mockListItemsAndCategories([cat1Folder, cat2Folder, cat1bFolder, fileElement1]);

      let fixture = MockRender(FileListComponent);
      let page = new Page(fixture);

      // Act
      Page.openItemMenu('name1');
      await page.clickMenuAssignCategory();
      // First suggested category should be 'cat1'
      await page.clickFirstSuggestedCategoryInDialog();

      // Assert
      let expected = await page.getSuggestedCategoryInDialog();
      expect(expected).toEqual(['cat1b'])
    })

    it('should clear category input after selecting a category', fakeAsync(async () => {
      // Arrange
      let cat1Folder = mockFolderElement('cat1');
      let fileElement1 = mockFileElement('name1');
      mockListItemsAndCategories([cat1Folder, fileElement1]);

      let fixture = MockRender(FileListComponent);
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
      mockListItemsAndCategories([cat1Folder, cat1bFolder, fileElement]);

      let fixture = MockRender(FileListComponent);
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

    it('should initialize the category with the existing one', async () => {
      // Arrange
      let cat1Folder = mockFolderElement('cat1');
      let cat1bFolder = mockFolderElement('cat1b', cat1Folder.id);
      let fileElement1 = mockFileElement('name1', cat1bFolder.id);
      mockListItemsAndCategories([cat1Folder, cat1bFolder, fileElement1]);

      let fixture = MockRender(FileListComponent);
      let page = new Page(fixture);

      // Act
      Page.openItemMenu('name1');
      await page.clickMenuAssignCategory();

      // Assert
      let result = await page.getCategoriesInDialog();
      expect(result).toEqual(['cat1', 'cat1b'])
    })

    it('When moving the last file from a category, should also remove the category', fakeAsync(async () => {
      // Arrange
      let cat1Folder = mockFolderElement('Cat1');
      let fileElement = mockFileElement('name1', cat1Folder.id);
      let fileService = mockListItemsAndCategories([fileElement, cat1Folder]);
      // We expect a refresh, the refresh should include the folder and the file which have moved
      let fileElementAfterRefresh = mockFileElement('name1');
      when(() => fileService.findAll()).thenReturn(mustBeConsumedAsyncObservable([fileElementAfterRefresh, cat1Folder]));

      when(() => fileService.setCategory(fileElement.id, "baseFolderId")).thenReturn(mustBeConsumedAsyncObservable(undefined));

      let trashObservable = mustBeConsumedAsyncObservable(undefined);
      when(() => fileService.trash(cat1Folder.id))
        .thenReturn(trashObservable);
      // After removing the category, we expect another refresh
      when(() => fileService.findAll()).thenReturn(mustBeConsumedAsyncObservable([fileElementAfterRefresh], trashObservable));

      let fixture = MockRender(FileListComponent);
      let page = new Page(fixture);

      // Act
      Page.openItemMenu('name1');
      // We need to remove the existing category
      await page.clickMenuAssignCategory();
      await page.removeCategoryInDialog('Cat1');
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
      let fixture = MockRender(FileListComponent);
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
      let fixture = MockRender(FileListComponent);
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
      let fixture = MockRender(FileListComponent);
      let page = new Page(fixture);

      // Act
      await page.setFilter('not found');

      // Assert
      expect(Page.getDisplayedFileNames()).toEqual([]);
      expect(Page.getNotFoundMessage()).toEqual('No document matching the file name "not found"')
    })
  })

  describe('Filter by file category', () => {
    it('should filter out one item out of two items', () => {
      // Arrange
      mockListItemsAndCategoriesWithTwoItemsAndThreeCategories();
      MockRender(FileListComponent);

      // Act
      Page.selectCategoryFilter('Cat1Child');

      // Assert
      let actionsRow = 'more_vert';
      let expected = [['name2', 'Cat1Cat1Child', 'Aug 3, 2023, 2:54:55 PM', '1.75 kB', actionsRow]];
      expect(Page.getTableRows()).toEqual(expected);
    })

    it('should filter based on root category', () => {
      // Arrange
      mockTxtAndImageFiles();

      MockRender(FileListComponent);

      // Act
      Page.selectCategoryFilter('Image');

      // Assert
      expect(Page.getDisplayedFileNames()).toEqual(['avatar.png', 'default.png', 'funny.png'])
    })

    it('should filter on two unrelated categories', () => {
      // Arrange
      mockTxtAndImageFiles();

      let fixture = MockRender(FileListComponent);

      // Act
      Page.selectCategoryFilter('TXT');
      Page.selectCategoryFilter('Avatar');

      // Assert
      fixture.detectChanges()
      expect(Page.getDisplayedFileNames()).toEqual(['avatar.png', 'text.txt'])
    })

    it('should allow removing a category filter', () => {
      // Arrange
      mockTxtAndImageFiles();

      let fixture = MockRender(FileListComponent);

      // Act
      Page.selectCategoryFilter('TXT');
      Page.selectCategoryFilter('TXT');

      // Assert
      fixture.detectChanges()
      expect(Page.getDisplayedFileNames()).toEqual(['avatar.png', 'default.png', 'funny.png', 'text.txt'])
    })

    it('should allow filtering on the file categories, from a row of the table list', () => {
      // Arrange
      mockTxtAndImageFiles();

      let fixture = MockRender(FileListComponent);

      // Act
      Page.selectCategoryFilterOnFileRow('avatar.png', 'Avatar');

      // Assert
      fixture.detectChanges()
      expect(Page.getDisplayedFileNames()).toEqual(['avatar.png'])
    })

    it('when filtering from a row, should change the filter state on the categories list (for leaf category)', () => {
      // Arrange
      mockTxtAndImageFiles();

      let fixture = MockRender(FileListComponent);

      // Act
      Page.selectCategoryFilterOnFileRow('avatar.png', 'Avatar');

      // Assert
      fixture.detectChanges()
      expect(Page.isCategorySelectedOnCategoriesList('Avatar')).toBeTruthy();
    })

    it('when filtering from a row, should change the filter state on the categories list (for parent category)', () => {
      // Arrange
      mockTxtAndImageFiles();

      let fixture = MockRender(FileListComponent);

      // Act
      Page.selectCategoryFilterOnFileRow('avatar.png', 'Image');

      // Assert
      fixture.detectChanges()
      expect(Page.isCategorySelectedOnCategoriesList('Image')).toBeTruthy();
    })

    it('when filtering from the categories list, should change the filter state on the rows', () => {
      // Arrange
      mockTxtAndImageFiles();

      let fixture = MockRender(FileListComponent);

      // Act
      Page.selectCategoryFilter('TXT');

      // Assert
      fixture.detectChanges()
      expect(Page.isCategorySelectedOnFileRow('text.txt', 'TXT')).toBeTruthy();
    })

    it('in categories list, show a expand icon on parent category only', () => {
      // Arrange
      mockTxtAndImageFiles();

      // Act
      MockRender(FileListComponent);

      // Assert
      expect(Page.isCategoryWithExpandIcon('TXT')).toBeFalsy();
      expect(Page.isCategoryWithExpandIcon('Image')).toBeTruthy();
    })
  })
});

function mockFileElement(name: string, parentId: string = 'baseFolderId', id: string | undefined = undefined, size: number = 0, date: string = ''): FileElement {
  if (!id) {
    id = name + '-' + uuid();
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
  if (!id) {
    id = name + '-' + uuid();
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
  let fileServiceMock = mockFileService();
  when(() => fileServiceMock.findAll()).thenReturn(of(itemsAndCategories));
  return fileServiceMock;
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
