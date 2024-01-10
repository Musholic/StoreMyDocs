import {UserRootComponent} from "../user-root/user-root.component";
import {RuleService} from './rule.service';
import {MockBuilder, MockInstance, MockRender} from "ng-mocks";
import {AppModule} from "../app.module";
import {mockFileService} from "../file-list/file.service.spec";
import {mock, when} from "strong-mock";
import {mustBeConsumedAsyncObservable} from "../../testing/common-testing-function.spec";
import {fakeAsync, tick} from "@angular/core/testing";
import {mockFileElement} from "../file-list/file-list.component.spec";
import {mockBaseFolderService} from "../file-upload/base-folder.service.spec";
import {FileService} from "../file-list/file.service";
import {mockRuleRepository} from "./rule.repository.spec";
import {getSampleRules} from "./rules.component.spec";
import {mockFilesCache} from "../user-root/user-root.component.spec";


function mockBillCategoryFindOrCreate(fileService: FileService) {
  when(() => fileService.findOrCreateFolder("Electricity", "baseFolderId"))
    .thenReturn(mustBeConsumedAsyncObservable('elecCatId548'));

  when(() => fileService.findOrCreateFolder("Bills", "elecCatId548"))
    .thenReturn(mustBeConsumedAsyncObservable('billsCatId489'));
}

describe('RuleService', () => {
  beforeEach(() => MockBuilder(RuleService, AppModule)
    // For some reason, we need to explicitly add a provider for UserRootComponent
    .provide({
      provide: UserRootComponent,
      useValue: mock<UserRootComponent>()
    })
  );

  it('should be created', () => {
    // Act
    const service = MockRender(RuleService).point.componentInstance;

    // Assert
    expect(service).toBeTruthy();
  });

  describe('runAll', () => {
    it('should automatically categorize a file', fakeAsync(() => {
      // Arrange
      mockBaseFolderService();

      let fileService = mockFileService();
      mockBillCategoryFindOrCreate(fileService);

      let ruleRepository = mockRuleRepository();
      when(() => ruleRepository.findAll())
        .thenResolve(getSampleRules());

      // The file should be set to the bills category
      let file = mockFileElement('electricity_bill.pdf');
      when(() => fileService.setCategory(file.id, 'billsCatId489'))
        .thenReturn(mustBeConsumedAsyncObservable(undefined));

      const service = MockRender(RuleService).point.componentInstance;

      mockFilesCache([file]);

      // Act
      service.runAll().subscribe();

      // Assert
      tick();
      // No failure in mock setup
    }));

    it('should not categorize a file which is already in the correct category', fakeAsync(() => {
      // Arrange
      mockBaseFolderService();

      let fileService = mockFileService();

      mockBillCategoryFindOrCreate(fileService);

      let ruleRepository = mockRuleRepository();
      when(() => ruleRepository.findAll())
        .thenResolve(getSampleRules());

      const service = MockRender(RuleService).point.componentInstance;

      let file = mockFileElement('electricity_bill.pdf', 'billsCatId489');
      mockFilesCache([file]);

      // Act
      service.runAll().subscribe();

      // Assert
      tick();
      // No unexpected calls to fileService.setCategory
    }));
  })
});

let ruleServiceMock: RuleService;

export function mockRuleService() {
  if (!ruleServiceMock) {
    ruleServiceMock = mock<RuleService>();
  }
  MockInstance(RuleService, () => {
    return {
      runAll: ruleServiceMock.runAll,
      create: ruleServiceMock.create,
      findAll: ruleServiceMock.findAll,
      delete: ruleServiceMock.delete
    }
  });
  return ruleServiceMock;
}
