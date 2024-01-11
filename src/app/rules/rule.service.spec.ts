import {RuleService} from './rule.service';
import {MockBuilder, MockInstance, MockRender, ngMocks} from "ng-mocks";
import {AppModule} from "../app.module";
import {mockFileService} from "../file-list/file.service.spec";
import {mock, when} from "strong-mock";
import {mustBeConsumedAsyncObservable} from "../../testing/common-testing-function.spec";
import {fakeAsync, tick} from "@angular/core/testing";
import {mockFileElement} from "../file-list/file-list.component.spec";
import {FileService} from "../file-list/file.service";
import {getSampleRules} from "./rules.component.spec";
import {RuleRepository} from "./rule.repository";
import {FilesCacheService} from "../files-cache/files-cache.service";
import {mockFilesCacheService} from "../files-cache/files-cache.service.spec";


function mockBillCategoryFindOrCreate(fileService: FileService) {
  when(() => fileService.findOrCreateFolder("Electricity", "baseFolderId"))
    .thenReturn(mustBeConsumedAsyncObservable('elecCatId548'));

  when(() => fileService.findOrCreateFolder("Bills", "elecCatId548"))
    .thenReturn(mustBeConsumedAsyncObservable('billsCatId489'));
}

describe('RuleService', () => {
  beforeEach(() => MockBuilder(RuleService, AppModule)
    .provide({
      provide: FilesCacheService,
      useValue: mock<FilesCacheService>()
    })
    .provide({
      provide: RuleRepository,
      useValue: mock<RuleRepository>()
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
      let fileService = mockFileService();
      mockBillCategoryFindOrCreate(fileService);

      // The file should be set to the bills category
      let file = mockFileElement('electricity_bill.pdf');
      when(() => fileService.setCategory(file.id, 'billsCatId489'))
        .thenReturn(mustBeConsumedAsyncObservable(undefined));

      const service = MockRender(RuleService).point.componentInstance;

      let ruleRepository = ngMocks.findInstance(RuleRepository);
      when(() => ruleRepository.findAll())
        .thenResolve(getSampleRules());

      mockFilesCacheService([file], true);

      // Act
      service.runAll().subscribe();

      // Assert
      tick();
      // No failure in mock setup
    }));

    it('should not categorize a file which is already in the correct category', fakeAsync(() => {
      // Arrange
      let fileService = mockFileService();

      mockBillCategoryFindOrCreate(fileService);


      const service = MockRender(RuleService).point.componentInstance;

      let ruleRepository = ngMocks.findInstance(RuleRepository);
      when(() => ruleRepository.findAll())
        .thenResolve(getSampleRules());

      let file = mockFileElement('electricity_bill.pdf', 'billsCatId489');
      mockFilesCacheService([file], true);

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
