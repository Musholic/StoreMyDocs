import {DatabaseBackupAndRestoreService} from './database-backup-and-restore.service';
import {MockBuilder, MockInstance, MockRender, ngMocks} from "ng-mocks";
import {AppModule} from "../app.module";
import {It, mock, when} from "strong-mock";
import {
  dbCleanUp,
  getLocalStorageMock,
  mustBeConsumedAsyncObservable
} from "../../testing/common-testing-function.spec";
import {HttpEventType, HttpResponse} from "@angular/common/http";
import {mockFileElement} from "../file-list/file-list.component.spec";
import {fakeAsync, tick} from "@angular/core/testing";
import {db} from "./db";
import {BehaviorSubject, lastValueFrom} from "rxjs";
import {mockBackgroundTaskService} from "../background-task/background-task.service.spec";
import {Progress} from "../background-task/background-task.service";
import {mockFilesCacheService} from "../files-cache/files-cache.service.spec";
import {FileUploadService} from "../file-upload/file-upload.service";
import {FilesCacheService} from "../files-cache/files-cache.service";
import {FileElement} from "../file-list/file-list.component";
import {Rule} from "../rules/rule.repository";
import {mockFileService} from "../file-list/file.service.spec";

function setupMockForRestore(dbBackupFile: FileElement) {
  let backgroundTaskService = mockBackgroundTaskService();

  let progress = mock<BehaviorSubject<Progress>>();
  when(() => backgroundTaskService.showProgress("Automatic restore", "Downloading last backup", 2))
    .thenReturn(progress);
  when(() => progress.next({index: 2, value: 0, description: "Importing last backup"})).thenReturn();
  when(() => progress.next({index: 2, value: 100})).thenReturn();

  let fileService = mockFileService();
  when(() => fileService.downloadFile(dbBackupFile, progress))
    .thenReturn(mustBeConsumedAsyncObservable(new Blob([JSON.stringify({
      "formatName": "dexie",
      "formatVersion": 1,
      "data": {
        "databaseName": "StoreMyDocsDB",
        "databaseVersion": 3,
        "tables": [{"name": "rules", "schema": "++id", "rowCount": 1}],
        "data": [{
          "tableName": "rules",
          "inbound": true,
          "rows": [{
            "name": "TestRule",
            "category": ["Test1", "ChildTest1"],
            "script": "return true",
            "id": 1,
            "$types": {"category": "arrayNonindexKeys"}
          }]
        }]
      }
    })])));
}

describe('DatabaseBackupAndRestoreService', () => {
  beforeEach(() => MockBuilder(DatabaseBackupAndRestoreService, AppModule)
    .provide({
      provide: FileUploadService,
      useValue: mock<FileUploadService>()
    })
    .provide({
      provide: FilesCacheService,
      useValue: mock<FilesCacheService>()
    })
  );

  // Db cleanup after each test
  afterEach(async () => {
    await dbCleanUp();
  });

  it('should be created', () => {
    // Act
    const databaseBackupAndRestoreService = MockRender(DatabaseBackupAndRestoreService).point.componentInstance;

    // Assert
    expect(databaseBackupAndRestoreService).toBeTruthy();
  });

  describe('restore', () => {
    it('The database should be restored', fakeAsync(async () => {
      // Arrange

      let localStorageMock = getLocalStorageMock();
      when(() => localStorageMock.getItem('last_db_backup_time')).thenReturn(null);
      when(() => localStorageMock.setItem('last_db_backup_time', It.isAny())).thenReturn();

      let dbBackupFile = mockFileElement('db.backup');
      setupMockForRestore(dbBackupFile);

      let databaseBackupAndRestoreService = MockRender(DatabaseBackupAndRestoreService).point.componentInstance;

      mockFilesCacheService([dbBackupFile]);

      // Act
      let restorePromise = lastValueFrom(databaseBackupAndRestoreService.restore());

      // Assert
      tick();
      // We need to explicitly wait for the restore to finish
      await restorePromise;

      let rules = await db.rules.toArray();
      expect(rules)
        .toEqual([{
          id: 1,
          name: 'TestRule',
          category: ['Test1', 'ChildTest1'],
          script: 'return true'
        }]);
    }));

    it('The database should be restored even if there is existing and conflicting old data', fakeAsync(async () => {
      // Arrange
      let localStorageMock = getLocalStorageMock();
      when(() => localStorageMock.getItem('last_db_backup_time')).thenReturn(null);
      when(() => localStorageMock.setItem('last_db_backup_time', It.isAny())).thenReturn();

      let dbBackupFile = mockFileElement('db.backup');
      setupMockForRestore(dbBackupFile);

      let databaseBackupAndRestoreService = MockRender(DatabaseBackupAndRestoreService).point.componentInstance;

      mockFilesCacheService([dbBackupFile]);
      let oldRule: Rule = {
        id: 1,
        name: 'OldTestRule',
        category: ['Test1', 'ChildTest1'],
        script: 'return old'
      };
      db.rules.add(oldRule)

      // Act
      let restorePromise = lastValueFrom(databaseBackupAndRestoreService.restore());

      // Assert
      tick();

      // We need to explicitly wait for the restore to finish
      await restorePromise;

      let rules = await db.rules.toArray();
      expect(rules)
        .toEqual([{
          id: 1,
          name: 'TestRule',
          category: ['Test1', 'ChildTest1'],
          script: 'return true'
        }]);
    }));

    it('The database should not be restored if it is already up-to-date', fakeAsync(async () => {
      // Arrange
      mockBackgroundTaskService();
      let databaseBackupAndRestoreService = MockRender(DatabaseBackupAndRestoreService).point.componentInstance;

      let localStorageMock = getLocalStorageMock();
      // Last db backup is one second later as it will generally be the case
      when(() => localStorageMock.getItem('last_db_backup_time'))
        .thenReturn('2024-01-09T17:53:08.560Z');
      let dbBackupFile = mockFileElement('db.backup');
      dbBackupFile.modifiedTime = new Date('2024-01-09T17:53:07.560Z')
      mockFilesCacheService([dbBackupFile]);

      // Act
      let restorePromise = lastValueFrom(databaseBackupAndRestoreService.restore());

      // Assert
      tick();

      // We need to explicitly wait for the restore to finish
      await restorePromise;
    }));
  })


  describe('backup', () => {
    it('Should upload a new backup file when there is no backup yet', async () => {
      // Arrange
      let localStorageMock = getLocalStorageMock();
      when(() => localStorageMock.setItem('last_db_backup_time', It.isAny())).thenReturn();

      let backgroundTaskService = mockBackgroundTaskService();
      let progress = mock<BehaviorSubject<Progress>>();
      when(() => backgroundTaskService.showProgress("Backup", "Creating backup", 2))
        .thenReturn(progress);
      when(() => progress.next({index: 2, description: "Uploading backup", value: 0})).thenReturn();
      when(() => backgroundTaskService.updateProgress(progress, It.isAny())).thenReturn();

      const databaseBackupAndRestoreService = MockRender(DatabaseBackupAndRestoreService).point.componentInstance;

      mockFilesCacheService([]);

      let fileUploadService = ngMocks.get(FileUploadService);
      when(() => fileUploadService.upload(It.isObject({blob: It.isAny(), name: "db.backup"})))
        .thenReturn(mustBeConsumedAsyncObservable({
          type: HttpEventType.Response
        } as HttpResponse<any>));

      // Act
      let backupPromise = lastValueFrom(databaseBackupAndRestoreService.backup());

      // Assert
      // No failure in mock setup
      await backupPromise;
    })

    it('should overwrite the existing backup file when there is already an existing backup', async () => {
      // Arrange
      let localStorageMock = getLocalStorageMock();
      when(() => localStorageMock.setItem('last_db_backup_time', It.isAny())).thenReturn();

      let backgroundTaskService = mockBackgroundTaskService();
      let progress = mock<BehaviorSubject<Progress>>();
      when(() => backgroundTaskService.showProgress("Backup", "Creating backup", 2))
        .thenReturn(progress);
      when(() => progress.next({index: 2, description: "Uploading backup", value: 0})).thenReturn();
      when(() => backgroundTaskService.updateProgress(progress, It.isAny())).thenReturn();

      const databaseBackupAndRestoreService = MockRender(DatabaseBackupAndRestoreService).point.componentInstance;

      let dbBackupFile = mockFileElement('db.backup');
      mockFilesCacheService([dbBackupFile]);

      let fileUploadService = ngMocks.get(FileUploadService);
      when(() => fileUploadService.upload(It.isObject({blob: It.isAny(), name: "db.backup"}), dbBackupFile.id))
        .thenReturn(mustBeConsumedAsyncObservable({
          type: HttpEventType.Response
        } as HttpResponse<any>));

      // Act
      let backupPromise = lastValueFrom(databaseBackupAndRestoreService.backup());

      // Assert
      // No failure in mock setup
      await backupPromise;
    });
  })
});

export function mockDatabaseBackupAndRestoreService() {
  let databaseBackupAndRestoreService = mock<DatabaseBackupAndRestoreService>();
  MockInstance(DatabaseBackupAndRestoreService, () => {
    return {
      restore: databaseBackupAndRestoreService.restore
    };
  })
  return databaseBackupAndRestoreService;
}
