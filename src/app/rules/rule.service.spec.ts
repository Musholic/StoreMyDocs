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
import {BehaviorSubject, firstValueFrom} from "rxjs";
import {Progress} from "../background-task/background-task.service";
import {FileElement} from "../file-list/file-list.component";


function mockBillCategoryFindOrCreate(fileService: FileService) {
  when(() => fileService.findOrCreateFolder("Electricity", "baseFolderId"))
    .thenReturn(mustBeConsumedAsyncObservable('elecCatId548'));

  when(() => fileService.findOrCreateFolder("Bills", "elecCatId548"))
    .thenReturn(mustBeConsumedAsyncObservable('billsCatId489'));
}

function mockElectricityBillSample(file: FileElement, fileService: FileService) {
  const backgroundTaskService = mockBackgroundTaskService();
  const progress = mock<BehaviorSubject<Progress>>();
  when(() => backgroundTaskService.showProgress("Running all rules", 3))
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
  when(() => progress.next({
    index: 3,
    value: 100,
  })).thenReturn();

  mockBillCategoryFindOrCreate(fileService);

  when(() => fileService.downloadFile(file, progress))
    .thenReturn(mustBeConsumedAsyncObservable(new Blob(['not important content'])));

  const service = MockRender(RuleService).point.componentInstance;

  const ruleRepository = ngMocks.findInstance(RuleRepository);
  when(() => ruleRepository.findAll())
    .thenResolve(getSampleRules());

  // The first rule should be flagged as matching
  const ruleAfterRun = getSampleRules()[0];
  ruleAfterRun.fileRuns = [{id: file.id, value: true}];
  when(() => ruleRepository.update(ruleAfterRun)).thenResolve();

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
      const file = mockFileElement('electricity_bill.pdf');
      const fileService = mockFileService();

      // The file should be set to the bills category
      when(() => fileService.setCategory(file.id, 'billsCatId489'))
        .thenReturn(mustBeConsumedAsyncObservable(undefined));

      const service = mockElectricityBillSample(file, fileService);

      // Act
      const runAllPromise = firstValueFrom(service.runAll(), {defaultValue: undefined});

      // Assert
      tick();
      await runAllPromise;
      // No failure in mock setup
    }));

    it('should not categorize a file which is already in the correct category', fakeAsync(async () => {
      // Arrange
      const file = mockFileElement('electricity_bill.pdf', 'billsCatId489');
      const fileService = mockFileService();
      const service = mockElectricityBillSample(file, fileService);

      // Act
      const runAllPromise = firstValueFrom(service.runAll(), {defaultValue: undefined});

      // Assert
      tick();
      await runAllPromise;
      // No unexpected calls to fileService.setCategory
    }));

    it('should not run a rule for a file it was already run on', fakeAsync(async () => {
      // Arrange
      const backgroundTaskService = mockBackgroundTaskService();
      const progress = mock<BehaviorSubject<Progress>>();
      when(() => backgroundTaskService.showProgress("Running all rules", 2))
        .thenReturn(progress);
      when(() => progress.next({
        index: 2,
        value: 100,
      })).thenReturn();

      const file = mockFileElement('electricity_bill.txt');

      const service = MockRender(RuleService).point.componentInstance;

      const ruleRepository = ngMocks.findInstance(RuleRepository);
      when(() => ruleRepository.findAll())
        .thenResolve([{
          name: 'Electric bill',
          category: ['Electricity', 'Bills'],
          script: 'return fileContent.startsWith("Electricity Bill");',
          fileRuns: [{id: file.id, value: false}]
        }]);

      mockFilesCacheService([file]);

      // Act
      const runAllPromise = firstValueFrom(service.runAll(), {defaultValue: undefined});

      // Assert
      tick();
      await runAllPromise;
      // No failure in mock setup
    }));

    it('should automatically categorize a file (using txt file content)', fakeAsync(async () => {
      // Arrange
      const backgroundTaskService = mockBackgroundTaskService();
      const progress = mock<BehaviorSubject<Progress>>();
      when(() => backgroundTaskService.showProgress("Running all rules", 6))
        .thenReturn(progress);
      when(() => progress.next({
        index: 1,
        value: 0,
        description: "Downloading file content of 'electricity_bill.txt'"
      })).thenReturn();
      when(() => progress.next({
        index: 2,
        value: 0,
        description: "Running rule 'Electric bill' for 'electricity_bill.txt'"
      })).thenReturn();

      when(() => progress.next({
        index: 4,
        value: 0,
        description: "Downloading file content of 'something_else.txt'"
      })).thenReturn();
      when(() => progress.next({
        index: 5,
        value: 0,
        description: "Running rule 'Electric bill' for 'something_else.txt'"
      })).thenReturn();
      when(() => progress.next({
        index: 6,
        value: 0,
        description: "Running rule 'Dumb rule' for 'something_else.txt'"
      })).thenReturn()
      when(() => progress.next({
        index: 6,
        value: 100,
      })).thenReturn();

      const fileService = mockFileService();
      mockBillCategoryFindOrCreate(fileService);

      const file = mockFileElement('electricity_bill.txt');
      when(() => fileService.downloadFile(file, progress))
        .thenReturn(mustBeConsumedAsyncObservable(new Blob(['Electricity Bill. XXXXXX'])));

      const otherFile = mockFileElement('something_else.txt');
      when(() => fileService.downloadFile(otherFile, progress))
        .thenReturn(mustBeConsumedAsyncObservable(new Blob(['Something else'])));

      // The file should be set to the bills category
      when(() => fileService.setCategory(file.id, 'billsCatId489'))
        .thenReturn(mustBeConsumedAsyncObservable(undefined));

      const service = MockRender(RuleService).point.componentInstance;

      const ruleRepository = ngMocks.findInstance(RuleRepository);
      when(() => ruleRepository.findAll())
        .thenResolve([{
          name: 'Electric bill',
          category: ['Electricity', 'Bills'],
          script: 'return fileContent.startsWith("Electricity Bill");'
        }, {
          name: 'Dumb rule',
          category: ['Dumb'],
          script: 'return false'
        }]);

      // The first rule should be flagged as matching
      let ruleAfterRun = {
        name: 'Electric bill',
        category: ['Electricity', 'Bills'],
        script: 'return fileContent.startsWith("Electricity Bill");',
        fileRuns: [{id: file.id, value: true}]
      };
      when(() => ruleRepository.update(ruleAfterRun)).thenResolve();

      // Both rules should be flagged as not matching for the other file
      ruleAfterRun = {
        name: 'Electric bill',
        category: ['Electricity', 'Bills'],
        script: 'return fileContent.startsWith("Electricity Bill");',
        fileRuns: [{id: file.id, value: true}, {id: otherFile.id, value: false}]
      };
      when(() => ruleRepository.update(ruleAfterRun)).thenResolve();
      ruleAfterRun = {
        name: 'Dumb rule',
        category: ['Dumb'],
        script: 'return false',
        fileRuns: [{id: otherFile.id, value: false}]
      };
      when(() => ruleRepository.update(ruleAfterRun)).thenResolve();

      mockFilesCacheService([file, otherFile], true);

      // Act
      const runAllPromise = firstValueFrom(service.runAll(), {defaultValue: undefined});

      // Assert
      tick();
      await runAllPromise;
      // No failure in mock setup
    }));

    it('should not download content of a binary file', fakeAsync(async () => {
      // Arrange
      const backgroundTaskService = mockBackgroundTaskService();
      const progress = mock<BehaviorSubject<Progress>>();
      when(() => backgroundTaskService.showProgress("Running all rules", 2))
        .thenReturn(progress);
      when(() => progress.next({
        index: 2,
        value: 0,
        description: "Running rule 'Dumb file content rule' for 'test.png'"
      })).thenReturn();
      when(() => progress.next({
        index: 2,
        value: 100,
      })).thenReturn();

      mockFileService();

      const file = mockFileElement('test.png');
      file.mimeType = 'image/png'

      const service = MockRender(RuleService).point.componentInstance;

      const ruleRepository = ngMocks.findInstance(RuleRepository);
      when(() => ruleRepository.findAll())
        .thenResolve([{
          name: 'Dumb file content rule',
          category: ['Dumb'],
          script: 'return fileContent.includes("test")'
        }]);

      const ruleAfterRun = {
        name: 'Dumb file content rule',
        category: ['Dumb'],
        script: 'return fileContent.includes("test")',
        fileRuns: [{id: file.id, value: false}]
      };
      when(() => ruleRepository.update(ruleAfterRun)).thenResolve();

      mockFilesCacheService([file]);

      // Act
      const runAllPromise = firstValueFrom(service.runAll(), {defaultValue: undefined});

      // Assert
      tick();
      await runAllPromise;
      // No failure in mock setup
    }));

    it('should automatically categorize a file (using pdf file content)', fakeAsync(async () => {
      // Arrange
      const backgroundTaskService = mockBackgroundTaskService();
      const progress = mock<BehaviorSubject<Progress>>();
      when(() => backgroundTaskService.showProgress("Running all rules", 2))
        .thenReturn(progress);
      when(() => progress.next({
        index: 1,
        value: 0,
        description: "Downloading file content of 'dummy.pdf'"
      })).thenReturn();
      when(() => progress.next({
        index: 2,
        value: 0,
        description: "Running rule 'Dummy' for 'dummy.pdf'"
      })).thenReturn();

      when(() => progress.next({
        index: 2,
        value: 100,
      })).thenReturn();

      const fileService = mockFileService();
      when(() => fileService.findOrCreateFolder("Dummy", "baseFolderId"))
        .thenReturn(mustBeConsumedAsyncObservable('dummyCatId548'));

      const file = mockFileElement('dummy.pdf');
      file.mimeType = 'application/pdf';
      const dummyPdfResponse = await fetch('/base/testing-assets/rules/dummy.pdf');
      const dummyPdfBlob = await dummyPdfResponse.blob();
      when(() => fileService.downloadFile(file, progress))
        .thenReturn(mustBeConsumedAsyncObservable(dummyPdfBlob));

      // The file should be set to the bills category
      when(() => fileService.setCategory(file.id, 'dummyCatId548'))
        .thenReturn(mustBeConsumedAsyncObservable(undefined));

      const service = MockRender(RuleService).point.componentInstance;

      const ruleRepository = ngMocks.findInstance(RuleRepository);
      when(() => ruleRepository.findAll())
        .thenResolve([{
          name: 'Dummy',
          category: ['Dummy'],
          script: 'return fileContent.startsWith("Dummy");'
        }]);

      // The first rule should be flagged as matching
      const ruleAfterRun = {
        name: 'Dummy',
        category: ['Dummy'],
        script: 'return fileContent.startsWith("Dummy");',
        fileRuns: [{id: file.id, value: true}]
      };
      when(() => ruleRepository.update(ruleAfterRun)).thenResolve();

      mockFilesCacheService([file], true);

      // Act
      const runAllPromise = firstValueFrom(service.runAll(), {defaultValue: undefined});

      // Assert
      // fakeAsync(() => tick());
      await runAllPromise;
      // No failure in mock setup
    }));
  })

  describe('getFileToMatchingRuleMap', () => {
    it('should return the mapping with one match', async () => {
      // Arrange
      const service = MockRender(RuleService).point.componentInstance;

      const ruleRepository = ngMocks.findInstance(RuleRepository);
      when(() => ruleRepository.findAll())
        .thenResolve([{
          name: 'Matching rule',
          category: ['Test'],
          script: 'return true;',
          fileRuns: [{id: "id-file1", value: true}, {id: "id-file2", value: false}]
        }, {
          name: 'False rule',
          category: ['False'],
          script: 'return false;',
          fileRuns: [{id: "id-file1", value: false}, {id: "id-file2", value: false}]
        }]);

      // Act
      const fileToMatchingRuleMap = await service.getFileToMatchingRuleMap();

      // Assert
      expect(fileToMatchingRuleMap)
        .toEqual(new Map([['id-file1', 'Matching rule']]));
    })

  });
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
      delete: ruleServiceMock.delete,
      update: ruleServiceMock.update,
      scheduleRunAll: ruleServiceMock.scheduleRunAll
    }
  });
  return ruleServiceMock;
}
