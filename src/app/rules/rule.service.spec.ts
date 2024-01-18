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
import {mockBackgroundTaskService} from "../background-task/background-task.service.spec";
import {BehaviorSubject, lastValueFrom} from "rxjs";
import {Progress} from "../background-task/background-task.service";
import {FileElement} from "../file-list/file-list.component";


function mockBillCategoryFindOrCreate(fileService: FileService) {
  when(() => fileService.findOrCreateFolder("Electricity", "baseFolderId"))
    .thenReturn(mustBeConsumedAsyncObservable('elecCatId548'));

  when(() => fileService.findOrCreateFolder("Bills", "elecCatId548"))
    .thenReturn(mustBeConsumedAsyncObservable('billsCatId489'));
}

function mockElectricityBillSample(file: FileElement, fileService: FileService) {
  let backgroundTaskService = mockBackgroundTaskService();
  let progress = mock<BehaviorSubject<Progress>>();
  when(() => backgroundTaskService.showProgress("Running all rules", "", 3))
    .thenReturn(progress);
  when(() => progress.next({
    index: 1,
    value: 0,
    description: "Downloading file content of 'electricity_bill.pdf'"
  })).thenReturn()
  when(() => progress.next({
    index: 2,
    value: 0,
    description: "Running rule 'Electric bill' for 'electricity_bill.pdf'"
  })).thenReturn()

  mockBillCategoryFindOrCreate(fileService);

  when(() => fileService.downloadFile(file, progress))
    .thenReturn(mustBeConsumedAsyncObservable(new Blob(['not important content'])));

  const service = MockRender(RuleService).point.componentInstance;

  let ruleRepository = ngMocks.findInstance(RuleRepository);
  when(() => ruleRepository.findAll())
    .thenResolve(getSampleRules());

  mockFilesCacheService([file], true);

  return service;
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
    it('should automatically categorize a file', fakeAsync(async () => {
      // Arrange
      let file = mockFileElement('electricity_bill.pdf');
      let fileService = mockFileService();

      // The file should be set to the bills category
      when(() => fileService.setCategory(file.id, 'billsCatId489'))
        .thenReturn(mustBeConsumedAsyncObservable(undefined));

      let service = mockElectricityBillSample(file, fileService);

      // Act
      let runAllPromise = lastValueFrom(service.runAll(), {defaultValue: undefined});

      // Assert
      tick();
      await runAllPromise;
      // No failure in mock setup
    }));

    it('should not categorize a file which is already in the correct category', fakeAsync(async () => {
      // Arrange
      let file = mockFileElement('electricity_bill.pdf', 'billsCatId489');
      let fileService = mockFileService();
      let service = mockElectricityBillSample(file, fileService);

      // Act
      let runAllPromise = lastValueFrom(service.runAll(), {defaultValue: undefined});

      // Assert
      tick();
      await runAllPromise;
      // No unexpected calls to fileService.setCategory
    }));

    it('should automatically categorize a file (using txt file content)', fakeAsync(async () => {
      // Arrange
      let backgroundTaskService = mockBackgroundTaskService();
      let progress = mock<BehaviorSubject<Progress>>();
      when(() => backgroundTaskService.showProgress("Running all rules", "", 2))
        .thenReturn(progress);
      when(() => progress.next({
        index: 1,
        value: 0,
        description: "Downloading file content of 'electricity_bill.txt'"
      })).thenReturn()
      when(() => progress.next({
        index: 2,
        value: 0,
        description: "Running rule 'Electric bill' for 'electricity_bill.txt'"
      })).thenReturn()
      let fileService = mockFileService();
      mockBillCategoryFindOrCreate(fileService);

      let file = mockFileElement('electricity_bill.txt');
      when(() => fileService.downloadFile(file, progress))
        .thenReturn(mustBeConsumedAsyncObservable(new Blob(['Electricity Bill. XXXXXX'])));

      // The file should be set to the bills category
      when(() => fileService.setCategory(file.id, 'billsCatId489'))
        .thenReturn(mustBeConsumedAsyncObservable(undefined));

      const service = MockRender(RuleService).point.componentInstance;

      let ruleRepository = ngMocks.findInstance(RuleRepository);
      when(() => ruleRepository.findAll())
        .thenResolve([{
          name: 'Electric bill',
          category: ['Electricity', 'Bills'],
          script: 'return fileContent.startsWith("Electricity Bill");'
        }]);

      mockFilesCacheService([file], true);

      // Act
      let runAllPromise = lastValueFrom(service.runAll(), {defaultValue: undefined});

      // Assert
      tick();
      await runAllPromise;
      // No failure in mock setup
    }));
    // TODO: distinguish between binary file and readable files
    // TODO: only keep one file content in memory and only if the file type content can be fetched
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
