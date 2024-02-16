import {fakeAsync, flush, tick} from '@angular/core/testing';

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
import {RuleService} from "../rules/rule.service";
import {MatTooltipModule} from "@angular/material/tooltip";
import {MatTooltipHarness} from "@angular/material/tooltip/testing";

function mockRenderAndWaitForChanges(mockRuleService: boolean = true) {
  if (mockRuleService) {
    const ruleService = ngMocks.get(RuleService);
    when(() => ruleService.getFileToMatchingRuleMap()).thenResolve(new Map());
  }
  const fixture = MockRender(FileListComponent, null, {reset: true});
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
    .keep(MatTooltipModule)
    .provide({
      provide: FilesCacheService,
      useValue: mock<FilesCacheService>()
    })
    .provide({
      provide: RuleService,
      useValue: mock<RuleService>()
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
    const actionsRow = 'more_vert';
    const expected = [['name1', 'Cat1', 'Aug 14, 2023, 2:48:44 PM', '1.42 MB', actionsRow],
      ['name2', 'Cat1Cat1Child', 'Aug 3, 2023, 2:54:55 PM', '1.75 kB', actionsRow]];
    expect(Page.getTableRows()).toEqual(expected);
  }))

  it('should sort items by name', fakeAsync(() => {
    // Arrange
    const itemsAndCategories = [];
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
    const itemsAndCategories = [];
    itemsAndCategories.push(mockFolderElement('za1'));
    const ab5Cat = mockFolderElement('ab5');
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
    const cat1 = mockFolderElement('Cat1');
    const el1 = mockFileElement('name1', cat1.id);
    const fileService = mockListItemsAndCategories([el1, cat1]);
    when(() => fileService.trash(el1.id))
      .thenReturn(mustBeConsumedAsyncObservable(undefined));
    // A refresh is expected
    const filesCacheService = ngMocks.get(FilesCacheService);
    when(() => filesCacheService.refreshCacheAndReload()).thenReturn();

    const fixture = mockRenderAndWaitForChanges();
    const page = new Page(fixture);

    // Act
    Page.openItemMenu('name1');
    await page.clickMenuTrash()

    // Assert
    // No failure in mock setup
  }))

  it('When a category is empty, should automatically remove it', fakeAsync(async () => {
    // Arrange
    const cat1Folder = mockFolderElement('Cat1');
    const fileElement = mockFileElement('name1');
    const fileService = mockListItemsAndCategories([fileElement, cat1Folder]);

    // We expect the category to be trashed since there is no file in it anymore
    when(() => fileService.trash(cat1Folder.id))
      .thenReturn(mustBeConsumedAsyncObservable(undefined));

    const filesCacheService = ngMocks.findInstance(FilesCacheService);
    when(() => filesCacheService.refreshCacheAndReload()).thenReturn();

    // Act
    mockRenderAndWaitForChanges();

    // Assert
    // No failure from mock setup
  }))

  it('should list two categories and one sub-category', fakeAsync(() => {
    // Arrange
    const cat1 = mockFolderElement('Cat1');
    const cat1Child = mockFolderElement('Cat1Child', cat1.id);
    const cat2 = mockFolderElement('Cat2');
    mockListItemsAndCategories([cat1, cat1Child, cat2], true);

    // Act
    mockRenderAndWaitForChanges();

    // Assert
    tick();
    expect(Page.getCategories()).toEqual(['Cat1', 'Cat1Child', 'Cat2'])
  }))

  it('should not list base folder as category in row categories', fakeAsync(() => {
    // Arrange
    const baseFolder = mockFolderElement('BaseFolder', 'rootId');
    baseFolder.id = 'baseFolderId'
    const el1 = mockFileElement('name1', baseFolder.id, 1421315, '2023-08-14T14:48:44.928Z');
    mockListItemsAndCategories([baseFolder, el1]);

    // Act
    mockRenderAndWaitForChanges();

    // Assert
    const actionsRow = 'more_vert';
    const expected = [['name1', '', 'Aug 14, 2023, 2:48:44 PM', '1.42 MB', actionsRow]];
    expect(Page.getTableRows()).toEqual(expected);
  }))

  describe('Category assignment', () => {
    it('should refresh after assigning a category to a file', fakeAsync(async () => {
      // Arrange
      const el2 = mockFileElement('name2');
      const fileService = mockListItemsAndCategories([el2]);

      // A refresh is expected
      const filesCacheService = ngMocks.get(FilesCacheService);
      when(() => filesCacheService.refreshCacheAndReload()).thenReturn();

      when(() => fileService.findOrCreateFolder('Cat848', 'baseFolderId')).thenReturn(of('cat848Id'));
      when(() => fileService.setCategory(el2.id, 'cat848Id')).thenReturn(of(undefined));

      const fixture = mockRenderAndWaitForChanges();
      const page = new Page(fixture);

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

      const fixture = mockRenderAndWaitForChanges();
      const page = new Page(fixture);

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

      const fixture = mockRenderAndWaitForChanges();
      const page = new Page(fixture);
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
      const fileElement = mockFileElement('name1');
      const fileService = mockListItemsAndCategories([fileElement]);
      // A refresh is expected
      const filesCacheService = ngMocks.get(FilesCacheService);
      when(() => filesCacheService.refreshCacheAndReload()).thenReturn();

      when(() => fileService.setCategory(fileElement.id, "baseFolderId")).thenReturn(of(undefined));

      const fixture = mockRenderAndWaitForChanges();
      const page = new Page(fixture);

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
      const fileElement = mockFileElement('name1');
      const fileService = mockListItemsAndCategories([fileElement]);
      // A refresh is expected
      const filesCacheService = ngMocks.get(FilesCacheService);
      when(() => filesCacheService.refreshCacheAndReload()).thenReturn();

      when(() => fileService.setCategory(fileElement.id, "baseFolderId")).thenReturn(of(undefined));

      const fixture = mockRenderAndWaitForChanges();
      const page = new Page(fixture);

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
      const fileElement = mockFileElement('name1');
      const fileService = mockListItemsAndCategories([fileElement]);
      // A refresh is expected
      const filesCacheService = ngMocks.get(FilesCacheService);
      when(() => filesCacheService.refreshCacheAndReload()).thenReturn();

      when(() => fileService.setCategory(fileElement.id, "parentCat45Id")).thenReturn(of(undefined));

      when(() => fileService.findOrCreateFolder('Cat45', 'baseFolderId')).thenReturn(of('parentCat45Id'));

      const fixture = mockRenderAndWaitForChanges();
      const page = new Page(fixture);

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
      const el2 = mockFileElement('name2');
      const fileService = mockListItemsAndCategories([el2]);
      // A refresh is expected
      const filesCacheService = ngMocks.get(FilesCacheService);
      when(() => filesCacheService.refreshCacheAndReload()).thenReturn();

      when(() => fileService.setCategory(el2.id, 'cat7Id')).thenReturn(of(undefined));

      when(() => fileService.findOrCreateFolder('ParentCat8', 'baseFolderId')).thenReturn(of('parentCat8Id'));
      when(() => fileService.findOrCreateFolder('Cat7', 'parentCat8Id')).thenReturn(of('cat7Id'));

      const fixture = mockRenderAndWaitForChanges();
      const page = new Page(fixture);

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
      const cat1Folder = mockFolderElement('cat1');
      const cat2Folder = mockFolderElement('cat2');
      const cat1bFolder = mockFolderElement('cat1b', cat1Folder.id);
      const fileElement1 = mockFileElement('name1');
      mockListItemsAndCategories([cat1Folder, cat2Folder, cat1bFolder, fileElement1], true);

      const fixture = mockRenderAndWaitForChanges();
      const page = new Page(fixture);

      // Act
      Page.openItemMenu('name1');
      await page.clickMenuAssignCategory();

      // Assert
      const expected = await page.getSuggestedCategoryInDialog();
      expect(expected).toEqual(['cat1', 'cat2'])
    }))

    it('should suggest root categories and filter them by the current input', fakeAsync(async () => {
      // Arrange
      const cat1Folder = mockFolderElement('cat1');
      const cat2Folder = mockFolderElement('cat2');
      const cat1bFolder = mockFolderElement('cat1b', cat1Folder.id);
      const fileElement1 = mockFileElement('name1');
      mockListItemsAndCategories([cat1Folder, cat2Folder, cat1bFolder, fileElement1], true);

      const fixture = mockRenderAndWaitForChanges();
      const page = new Page(fixture);

      // Act
      Page.openItemMenu('name1');
      await page.clickMenuAssignCategory();
      await page.typeCategoryInDialog('1');

      // Assert
      const expected = await page.getSuggestedCategoryInDialog();
      expect(expected).toEqual(['cat1'])
    }))

    it('should be able to select a suggested category', fakeAsync(async () => {
      // Arrange
      const cat1Folder = mockFolderElement('cat1');
      const cat2Folder = mockFolderElement('cat2');
      const cat1bFolder = mockFolderElement('cat1b', cat1Folder.id);
      const fileElement1 = mockFileElement('name1');
      const fileService = mockListItemsAndCategories([cat1Folder, cat2Folder, cat1bFolder, fileElement1], true);

      // A refresh is expected
      const filesCacheService = ngMocks.get(FilesCacheService);
      when(() => filesCacheService.refreshCacheAndReload()).thenReturn();

      when(() => fileService.setCategory(fileElement1.id, cat1Folder.id)).thenReturn(of(undefined));

      when(() => fileService.findOrCreateFolder(cat1Folder.name, 'baseFolderId')).thenReturn(of(cat1Folder.id));

      const fixture = mockRenderAndWaitForChanges();
      const page = new Page(fixture);

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
      const cat1Folder = mockFolderElement('cat1');
      const cat2Folder = mockFolderElement('cat2');
      const cat1bFolder = mockFolderElement('cat1b', cat1Folder.id);
      const fileElement1 = mockFileElement('name1');
      mockListItemsAndCategories([cat1Folder, cat2Folder, cat1bFolder, fileElement1], true);

      const fixture = mockRenderAndWaitForChanges();
      const page = new Page(fixture);

      // Act
      Page.openItemMenu('name1');
      await page.clickMenuAssignCategory();
      // First suggested category should be 'cat1'
      await page.clickFirstSuggestedCategoryInDialog();

      // Assert
      const expected = await page.getSuggestedCategoryInDialog();
      expect(expected).toEqual(['cat1b'])
    }))

    it('should clear category input after selecting a category', fakeAsync(async () => {
      // Arrange
      const cat1Folder = mockFolderElement('cat1');
      const fileElement1 = mockFileElement('name1');
      mockListItemsAndCategories([cat1Folder, fileElement1], true);

      const fixture = mockRenderAndWaitForChanges()
      const page = new Page(fixture);

      // Act
      Page.openItemMenu('name1');
      await page.clickMenuAssignCategory();
      await page.setCategoryInDialog('cat1');

      // Assert
      expect(await page.getInputCategoryValue()).toEqual('');
    }))


    it('should refresh category suggestion after removing a category', fakeAsync(async () => {
      // Arrange
      const cat1Folder = mockFolderElement('cat1');
      const cat1bFolder = mockFolderElement('cat1b', cat1Folder.id);
      const fileElement = mockFileElement('name1');
      mockListItemsAndCategories([cat1Folder, cat1bFolder, fileElement], true);

      const fixture = mockRenderAndWaitForChanges();
      const page = new Page(fixture);

      // Act
      Page.openItemMenu('name1');
      await page.clickMenuAssignCategory();
      await page.setCategoryInDialog('cat1');
      await page.removeCategoryInDialog('cat1');

      // Assert
      fixture.detectChanges();
      tick();

      const result = await page.getSuggestedCategoryInDialog();
      expect(result).toEqual(['cat1'])
    }))

    it('should initialize the category with the existing one', fakeAsync(async () => {
      // Arrange
      const cat1Folder = mockFolderElement('cat1');
      const cat1bFolder = mockFolderElement('cat1b', cat1Folder.id);
      const fileElement1 = mockFileElement('name1', cat1bFolder.id);
      mockListItemsAndCategories([cat1Folder, cat1bFolder, fileElement1]);

      const fixture = mockRenderAndWaitForChanges();
      const page = new Page(fixture);

      // Act
      Page.openItemMenu('name1');
      await page.clickMenuAssignCategory();

      // Assert
      const result = await page.getCategoriesInDialog();
      expect(result).toEqual(['cat1', 'cat1b'])
    }))

    it('should prevent category assignment when the file categories were automatically assigned', fakeAsync(async () => {
      // Arrange
      const folder = mockFolderElement('Auto');
      const file = mockFileElement('name', folder.id);
      mockFilesCacheService([file, folder], true);

      const ruleService = ngMocks.get(RuleService);
      const fileToMatchingRuleMap = new Map();
      fileToMatchingRuleMap.set(file.id, "Existing Rule");
      when(() => ruleService.getFileToMatchingRuleMap()).thenResolve(fileToMatchingRuleMap);

      const fixture = mockRenderAndWaitForChanges(false);
      const page = new Page(fixture);

      // Act
      Page.openItemMenu('name');

      // Assert
      fixture.detectChanges();
      flush();
      const isMenuDisabled = await page.isMenuAssignCategoryDisabled();
      expect(isMenuDisabled).toBeTruthy();
      const tooltip = await page.getMenuAssignCategoryTooltip();
      expect(tooltip).toEqual('Automatically assigned by rule "Existing Rule"');
      expect(Page.getTableRows()).toEqual([['name', 'calculate Auto', 'Jan 1, 2000, 12:00:00 AM', '0 B', 'more_vert']]);
    }))
  })

  describe('Filter by file name', () => {
    it('should filter out one item out of two items', async () => {
      // Arrange
      mockListItemsAndCategoriesWithTwoItemsAndTwoCategories();
      const fixture = mockRenderAndWaitForChanges();
      const page = new Page(fixture);

      // Act
      await page.setFilter('name1');

      // Assert
      const actionsRow = 'more_vert';
      const expected = [['name1', 'Cat1', 'Aug 14, 2023, 2:48:44 PM', '1.42 MB', actionsRow]];
      expect(Page.getTableRows()).toEqual(expected);
    })

    it('should ignore case', async () => {
      // Arrange
      const el1 = mockFileElement('nAme1');
      mockListItemsAndCategories([el1]);
      const fixture = mockRenderAndWaitForChanges();
      const page = new Page(fixture);

      // Act
      await page.setFilter('NaMe1');

      // Assert
      expect(Page.getDisplayedFileNames()).toEqual(['nAme1']);
    })

    it('should ignore trailing and leading spaces in the filter', async () => {
      // Arrange
      const el1 = mockFileElement('name1');
      mockListItemsAndCategories([el1]);
      const fixture = mockRenderAndWaitForChanges();
      const page = new Page(fixture);

      // Act
      await page.setFilter(' name1 ');

      // Assert
      expect(Page.getDisplayedFileNames()).toEqual(['name1']);
    })

    it('should show a not found message when there is no document matching the filter', async () => {
      // Arrange
      const el1 = mockFileElement('name1');
      mockListItemsAndCategories([el1]);
      const fixture = mockRenderAndWaitForChanges();
      const page = new Page(fixture);

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
      const fixture = mockRenderAndWaitForChanges();

      // Act
      Page.selectCategoryFilter('Cat1Child');

      // Assert
      fixture.detectChanges();
      const actionsRow = 'more_vert';
      const expected = [['name2', 'Cat1Cat1Child', 'Aug 3, 2023, 2:54:55 PM', '1.75 kB', actionsRow]];
      expect(Page.getTableRows()).toEqual(expected);
    }))

    it('should filter based on root category', fakeAsync(() => {
      // Arrange
      mockTxtAndImageFiles();

      const fixture = mockRenderAndWaitForChanges();

      // Act
      Page.selectCategoryFilter('Image');

      // Assert
      fixture.detectChanges();
      expect(Page.getDisplayedFileNames()).toEqual(['avatar.png', 'default.png', 'funny.png'])
    }))

    it('should filter on two unrelated categories', fakeAsync(() => {
      // Arrange
      mockTxtAndImageFiles();

      const fixture = mockRenderAndWaitForChanges();

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

      const fixture = mockRenderAndWaitForChanges();

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

      const fixture = mockRenderAndWaitForChanges()

      // Act
      Page.selectCategoryFilterOnFileRow('avatar.png', 'Avatar');

      // Assert
      fixture.detectChanges()
      expect(Page.getDisplayedFileNames()).toEqual(['avatar.png'])
    }))

    it('when filtering from a row, should change the filter state on the categories list (for leaf category)', fakeAsync(() => {
      // Arrange
      mockTxtAndImageFiles();

      const fixture = mockRenderAndWaitForChanges();

      // Act
      Page.selectCategoryFilterOnFileRow('avatar.png', 'Avatar');

      // Assert
      fixture.detectChanges()
      expect(Page.isCategorySelectedOnCategoriesList('Avatar')).toBeTruthy();
    }))

    it('when filtering from a row, should change the filter state on the categories list (for parent category)', fakeAsync(() => {
      // Arrange
      mockTxtAndImageFiles();

      const fixture = mockRenderAndWaitForChanges();

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

      const fixture = mockRenderAndWaitForChanges();

      // Act
      Page.selectCategoryFilter('TXT');

      // Assert
      fixture.detectChanges()
      flush();
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
  const id = name + '-' + uuid();
  return {
    mimeType: "text/plain",
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
  const id = name + '-' + uuid();
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
    const categories = itemsAndCategories.filter(file => !isFileElement(file))
      .map(value => value as FolderElement);
    categories.forEach(cat => {
      itemsAndCategories.push(mockFileElement(cat.name + "_file", cat.id))
    })
  }
  mockFilesCacheService(itemsAndCategories, true);
  return mockFileService();
}

function mockTxtAndImageFiles() {
  const txtFolder = mockFolderElement('TXT');
  const imageFolder = mockFolderElement('Image');
  const imageFunnyFolder = mockFolderElement('Funny', imageFolder.id);
  const imageAvatarFolder = mockFolderElement('Avatar', imageFolder.id);
  const itemsAndCategories = [txtFolder, imageFolder, imageFunnyFolder, imageAvatarFolder];
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
  const cat1 = mockFolderElement('Cat1', 'baseFolderId');
  const cat1Child = mockFolderElement('Cat1Child', cat1.id);
  const el1 = mockFileElement('name1', cat1.id, 1421315, '2023-08-14T14:48:44.928Z');
  const el2 = mockFileElement('name2', cat1Child.id, 1745, '2023-08-03T14:54:55.556Z');
  const itemsAndCategories = [el1, el2, cat1, cat1Child];
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
    const categoryChipElement = ngMocks.findAll(".categoryName")
      .find(value => value.nativeNode.textContent.trim() === cat);
    const button: HTMLButtonElement = categoryChipElement?.nativeElement.querySelector('button');
    button.click();
  }

  static selectCategoryFilterOnFileRow(fileName: string, cat: string) {
    const categoryChipElement = this.getFileRow(fileName).queryAll(By.css("mat-chip-option"))
      .find(value => value.nativeNode.textContent.trim() === cat);
    const button: HTMLButtonElement = categoryChipElement?.nativeElement.querySelector('button');
    button.click();
  }

  static isCategorySelectedOnCategoriesList(cat: string) {
    const categoryChipElement = ngMocks.findAll(".categoryName")
      .find(value => value.nativeNode.textContent.trim() === cat);
    return !!categoryChipElement?.classes['mat-mdc-chip-selected'];
  }

  static isCategoryWithExpandIcon(cat: string) {
    const categoryChipElement = ngMocks.findAll(".categoryName")
      .find(value => value.nativeNode.textContent.trim() === cat);
    const parent: DebugElement = <DebugElement>categoryChipElement?.parent;
    // Check we have a button which is the expand icon
    return parent.children.some(value => value.name === 'button');
  }


  static isCategorySelectedOnFileRow(fileName: string, cat: string) {
    const categoryChipElement = this.getFileRow(fileName).queryAll(By.css("mat-chip-option"))
      .find(value => value.nativeNode.textContent.trim() === cat);
    return !!categoryChipElement?.classes['mat-mdc-chip-selected'];
  }

  static getNotFoundMessage() {
    return ngMocks.find('.not_found').nativeNode.textContent.trim();
  }

  private static getFileRow(name: string): MockedDebugElement {
    return ngMocks.findAll("[mat-row]")
      .filter(value => {
        const nameColumn = ngMocks.find(value, ".mat-column-name");
        return nameColumn.nativeNode.textContent.trim() === name;
      })[0];
  }

  async clickMenuTrash() {
    const matMenuItemHarness = await this.getMenu('.trash-file');
    await matMenuItemHarness.click();
  }

  async clickMenuAssignCategory() {
    const matMenuItemHarness = await this.getMenu('.set-category-file');
    await matMenuItemHarness.click();
  }

  async isMenuAssignCategoryDisabled() {
    const matMenuItemHarness = await this.getMenu('.set-category-file');
    return matMenuItemHarness.isDisabled();
  }

  async getMenuAssignCategoryTooltip() {
    // There is only one toolTip in our tests, so we can simplify this method
    const matTooltipHarness = await this.loader.getHarness(MatTooltipHarness);
    await matTooltipHarness.show();
    return matTooltipHarness.getTooltipText();
  }

  async setCategoryInDialog(category: string) {
    const testElement = await this.typeCategoryInDialog(category);
    await testElement.sendKeys(TestKey.ENTER)
  }

  async getCategoriesInDialog() {
    const dialogHarness = await this.loader.getHarness(MatDialogHarness);
    const matChipGridHarness = await dialogHarness.getHarness(MatChipGridHarness);
    const matChipRowHarnesses = await matChipGridHarness.getRows();
    return Promise.all(matChipRowHarnesses.map(value => value.getText()));
  }

  async typeCategoryInDialog(category: string) {
    const inputHarness = await this.getCategoryInput();
    await inputHarness.setValue(category);
    return await inputHarness.host();
  }

  async getInputCategoryValue() {
    const inputHarness = await this.getCategoryInput();
    return inputHarness.getValue();
  }

  async clickOkInDialog() {
    const button = await this.loader.getHarness(MatButtonHarness.with({text: 'Ok'}));
    await button.click();
  }

  async clickCancelInDialog() {
    const button = await this.loader.getHarness(MatButtonHarness.with({text: 'Cancel'}));
    await button.click();
  }

  async getDialogTitle() {
    const dialogHarness = await this.loader.getHarness(MatDialogHarness);
    return dialogHarness.getTitleText();
  }

  async hasDialogOpened() {
    const dialogHarness = await this.loader.getHarnessOrNull(MatDialogHarness);
    return dialogHarness !== null;
  }

  async getSuggestedCategoryInDialog() {
    const matAutocompleteHarness = await this.loader.getHarness(MatAutocompleteHarness);
    const options = await matAutocompleteHarness.getOptions();
    return Promise.all(options.map(value => value.getText()));
  }

  async clickFirstSuggestedCategoryInDialog() {
    const matAutocompleteHarness = await this.loader.getHarness(MatAutocompleteHarness);
    const options = await matAutocompleteHarness.getOptions();
    await options[0].click();
  }

  async setFilter(filter: string) {
    const inputHarness = await this.loader.getHarness(MatInputHarness.with({placeholder: 'Filter'}));
    await inputHarness.setValue(filter);
  }

  async removeCategoryInDialog(catToRemove: string) {
    const selectFileCategoryDialog = this.getSelectFileCategoryDialog();
    selectFileCategoryDialog.remove(catToRemove);
  }

  private getCategoryInput() {
    return this.loader.getHarness(MatInputHarness.with({placeholder: 'Select category...'}));
  }

  private getSelectFileCategoryDialog() {
    return this.fixture.debugElement.parent?.query(By.directive(SelectFileCategoryDialog)).componentInstance as SelectFileCategoryDialog;
  }

  private async getMenu(selector: string) {
    const matMenuHarnesses = await this.loader.getAllHarnesses(MatMenuHarness);
    // The menu should be the one opened
    const matMenuHarness = await findAsyncSequential(matMenuHarnesses, value => value.isOpen());
    if (!matMenuHarness) {
      throw new Error("No menu for selector: " + selector);
    }
    const menuItems = await matMenuHarness.getItems({selector: selector});
    return menuItems[0];
  }

}
