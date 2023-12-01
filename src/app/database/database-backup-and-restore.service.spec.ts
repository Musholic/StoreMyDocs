import {DatabaseBackupAndRestoreService} from './database-backup-and-restore.service';
import {MockBuilder, MockInstance, MockRender} from "ng-mocks";
import {AppModule} from "../app.module";
import {mockFileUploadService} from "../file-upload/file-upload.service.spec";
import {It, mock, when} from "strong-mock";
import {dbCleanUp, mustBeConsumedAsyncObservable} from "../../testing/common-testing-function.spec";
import {HttpClientModule, HttpEventType, HttpResponse} from "@angular/common/http";
import {mockFileService} from "../file-list/file.service.spec";
import {mockFileElement} from "../file-list/file-list.component.spec";
import {HttpClientTestingModule, HttpTestingController} from "@angular/common/http/testing";
import {fakeAsync, TestBed, tick} from "@angular/core/testing";
import {db} from "./db";
import {lastValueFrom} from "rxjs";

describe('DatabaseBackupAndRestoreService', () => {
  beforeEach(() => MockBuilder(DatabaseBackupAndRestoreService, AppModule)
    .replace(HttpClientModule, HttpClientTestingModule)
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
    it('the database should be automatically restored', fakeAsync(async () => {
      // Arrange
      let fileService = mockFileService();
      let dbBackupFile = mockFileElement('db.backup');
      when(() => fileService.findAll()).thenReturn(mustBeConsumedAsyncObservable([dbBackupFile]));

      let fixture = MockRender(DatabaseBackupAndRestoreService);
      let databaseBackupAndRestoreService = fixture.point.componentInstance;

      // Act
      let restorePromise = lastValueFrom(databaseBackupAndRestoreService.restore());

      // Assert
      tick();
      let httpTestingController = TestBed.inject(HttpTestingController);

      let request = httpTestingController.expectOne('https://www.googleapis.com/drive/v3/files/' + dbBackupFile.id + '?alt=media');
      request.flush(new Blob([JSON.stringify({
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
      })]));

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

      httpTestingController.verify();
    }));
  })


  describe('backup', () => {
    it('should upload a new backup file when there is no backup yet', async () => {
      // Arrange
      let fileService = mockFileService();
      when(() => fileService.findAll()).thenReturn(mustBeConsumedAsyncObservable([]));

      let fileUploadService = mockFileUploadService();
      when(() => fileUploadService.upload(It.isObject({blob: It.isAny(), name: "db.backup"})))
        .thenReturn(mustBeConsumedAsyncObservable({
          type: HttpEventType.Response
        } as HttpResponse<any>));

      const databaseBackupAndRestoreService = MockRender(DatabaseBackupAndRestoreService).point.componentInstance;

      // Act
      let backupPromise = lastValueFrom(databaseBackupAndRestoreService.backup());

      // Assert
      // No failure in mock setup
      await backupPromise;
    })

    it('should overwrite the existing backup file when there is already an existing backup', async () => {
      // Arrange
      let fileService = mockFileService();
      let dbBackupFile = mockFileElement('db.backup');
      when(() => fileService.findAll()).thenReturn(mustBeConsumedAsyncObservable([dbBackupFile]));

      let fileUploadService = mockFileUploadService();
      when(() => fileUploadService.upload(It.isObject({blob: It.isAny(), name: "db.backup"}), dbBackupFile.id))
        .thenReturn(mustBeConsumedAsyncObservable({
          type: HttpEventType.Response
        } as HttpResponse<any>));

      const databaseBackupAndRestoreService = MockRender(DatabaseBackupAndRestoreService).point.componentInstance;

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
      backup: databaseBackupAndRestoreService.backup
    }
  });
  return databaseBackupAndRestoreService;
}