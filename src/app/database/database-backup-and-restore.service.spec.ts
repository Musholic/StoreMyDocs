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
import {BehaviorSubject, firstValueFrom} from "rxjs";
import {mockBackgroundTaskService} from "../background-task/background-task.service.spec";
import {Progress} from "../background-task/background-task.service";
import {mockFilesCacheService} from "../files-cache/files-cache.service.spec";
import {FileUploadService} from "../file-upload/file-upload.service";
import {FilesCacheService} from "../files-cache/files-cache.service";
import {FileElement} from "../file-list/file-list.component";
import {Rule} from "../rules/rule.repository";
import {mockFileService} from "../file-list/file.service.spec";
import JSZip from "jszip";

async function setupMockForRestore(dbBackupFileElement: FileElement) {
  const backgroundTaskService = mockBackgroundTaskService();

  const progress = mock<BehaviorSubject<Progress>>();
  when(() => backgroundTaskService.showProgress("Automatic restore", 3, "Downloading last backup"))
    .thenReturn(progress);
  when(() => progress.next({index: 2, value: 0, description: "Extracting last backup"})).thenReturn();
  when(() => progress.next({index: 3, value: 0, description: "Importing last backup"})).thenReturn();
  when(() => progress.next({index: 3, value: 100})).thenReturn();

  const fileService = mockFileService();
  const compressedDbBackupFile = await fetch("/base/testing-assets/database/db.backup.zip");
  const compressedDbBackupBlob = await compressedDbBackupFile.blob();
  when(() => fileService.downloadFile(dbBackupFileElement, progress))
    .thenReturn(mustBeConsumedAsyncObservable(compressedDbBackupBlob));
}

const EMPTY_DB_BACKUP = `{"formatName":"dexie","formatVersion":1,"data":{"databaseName":"StoreMyDocsDB","databaseVersion":3,"tables":[{"name":"rules","schema":"++id","rowCount":0}],"data":[{"tableName":"rules","inbound":true,"rows":[]}]}}`;

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
      const localStorageMock = getLocalStorageMock();
      when(() => localStorageMock.getItem('last_db_backup_time')).thenReturn(null);
      when(() => localStorageMock.setItem('last_db_backup_time', It.isAny())).thenReturn();

      const dbBackupFile = mockFileElement('db.backup');
      await setupMockForRestore(dbBackupFile);

      const databaseBackupAndRestoreService = MockRender(DatabaseBackupAndRestoreService).point.componentInstance;

      mockFilesCacheService([dbBackupFile]);

      // Act
      const restorePromise = firstValueFrom(databaseBackupAndRestoreService.restore());

      // Assert
      // We need to explicitly wait for the restore to finish
      await restorePromise;

      const rules = await db.rules.toArray();
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
      const localStorageMock = getLocalStorageMock();
      when(() => localStorageMock.getItem('last_db_backup_time')).thenReturn(null);
      when(() => localStorageMock.setItem('last_db_backup_time', It.isAny())).thenReturn();

      const dbBackupFile = mockFileElement('db.backup');
      await setupMockForRestore(dbBackupFile);

      const databaseBackupAndRestoreService = MockRender(DatabaseBackupAndRestoreService).point.componentInstance;

      mockFilesCacheService([dbBackupFile]);
      const oldRule: Rule = {
        id: 1,
        name: 'OldTestRule',
        category: ['Test1', 'ChildTest1'],
        script: 'return old'
      };
      db.rules.add(oldRule)

      // Act
      const restorePromise = firstValueFrom(databaseBackupAndRestoreService.restore());

      // Assert
      // We need to explicitly wait for the restore to finish
      await restorePromise;

      const rules = await db.rules.toArray();
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
      const databaseBackupAndRestoreService = MockRender(DatabaseBackupAndRestoreService).point.componentInstance;

      const localStorageMock = getLocalStorageMock();
      // Last db backup is one second later as it will generally be the case
      when(() => localStorageMock.getItem('last_db_backup_time'))
        .thenReturn('2024-01-09T17:53:08.560Z');
      const dbBackupFile = mockFileElement('db.backup');
      dbBackupFile.modifiedTime = new Date('2024-01-09T17:53:07.560Z')
      mockFilesCacheService([dbBackupFile]);

      // Act
      const restorePromise = firstValueFrom(databaseBackupAndRestoreService.restore());

      // Assert
      tick();

      // We need to explicitly wait for the restore to finish
      await restorePromise;
    }));
  })


  describe('backup', () => {
    it('Should upload a new backup file when there is no backup yet', async () => {
      // Arrange
      const localStorageMock = getLocalStorageMock();
      when(() => localStorageMock.setItem('last_db_backup_time', It.isAny())).thenReturn();

      const backgroundTaskService = mockBackgroundTaskService();
      const progress = mock<BehaviorSubject<Progress>>();
      when(() => backgroundTaskService.showProgress("Backup", 3, "Creating backup"))
        .thenReturn(progress);
      when(() => progress.next({index: 2, description: "Compressing backup", value: 0})).thenReturn();
      when(() => progress.next({index: 3, description: "Uploading backup", value: 0})).thenReturn();
      when(() => backgroundTaskService.updateProgress(progress, It.isAny())).thenReturn();

      const databaseBackupAndRestoreService = MockRender(DatabaseBackupAndRestoreService).point.componentInstance;

      mockFilesCacheService([]);

      const fileUploadService = ngMocks.get(FileUploadService);
      const blobUploadCapture = It.willCapture<Blob>();
      when(() => fileUploadService.upload(It.isObject({blob: blobUploadCapture, name: "db.backup"})))
        .thenReturn(mustBeConsumedAsyncObservable({
          type: HttpEventType.Response
        } as HttpResponse<any>));

      // Act
      const backupPromise = firstValueFrom(databaseBackupAndRestoreService.backup());

      // Assert
      // No failure in mock setup
      await backupPromise;

      // The blob should be a compressed zip, we have to unzip it and check its content
      const blob = await blobUploadCapture.value;
      let stringResult: string | undefined;
      if (blob) {
        const zipResult = await JSZip.loadAsync(blob);
        stringResult = await zipResult.file("db.backup")?.async("string");
      }
      expect(stringResult).toEqual(EMPTY_DB_BACKUP)
    })

    it('should overwrite the existing backup file when there is already an existing backup', async () => {
      // Arrange
      const localStorageMock = getLocalStorageMock();
      when(() => localStorageMock.setItem('last_db_backup_time', It.isAny())).thenReturn();

      const backgroundTaskService = mockBackgroundTaskService();
      const progress = mock<BehaviorSubject<Progress>>();
      when(() => backgroundTaskService.showProgress("Backup", 3, "Creating backup"))
        .thenReturn(progress);
      when(() => progress.next({index: 2, description: "Compressing backup", value: 0})).thenReturn();
      when(() => progress.next({index: 3, description: "Uploading backup", value: 0})).thenReturn();
      when(() => backgroundTaskService.updateProgress(progress, It.isAny())).thenReturn();

      const databaseBackupAndRestoreService = MockRender(DatabaseBackupAndRestoreService).point.componentInstance;

      const dbBackupFile = mockFileElement('db.backup');
      mockFilesCacheService([dbBackupFile]);

      const fileUploadService = ngMocks.get(FileUploadService);
      when(() => fileUploadService.upload(It.isObject({blob: It.isAny(), name: "db.backup"}), dbBackupFile.id))
        .thenReturn(mustBeConsumedAsyncObservable({
          type: HttpEventType.Response
        } as HttpResponse<any>));

      // Act
      const backupPromise = firstValueFrom(databaseBackupAndRestoreService.backup());

      // Assert
      // No failure in mock setup
      await backupPromise;
    });
  })
});

export function mockDatabaseBackupAndRestoreService() {
  const databaseBackupAndRestoreService = mock<DatabaseBackupAndRestoreService>();
  MockInstance(DatabaseBackupAndRestoreService, () => {
    return {
      restore: databaseBackupAndRestoreService.restore
    };
  })
  return databaseBackupAndRestoreService;
}
