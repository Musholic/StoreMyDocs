import {DatabaseBackupAndRestoreService} from './database-backup-and-restore.service';
import {MockBuilder, MockInstance, MockRender} from "ng-mocks";
import {AppModule} from "../app.module";
import {mockFileUploadService} from "../file-upload/file-upload.service.spec";
import {It, mock, when} from "strong-mock";
import {mustBeConsumedAsyncObservable} from "../../testing/common-testing-function.spec";
import {HttpEventType, HttpResponse} from "@angular/common/http";
import {mockFileService} from "../file-list/file.service.spec";
import {mockFileElement} from "../file-list/file-list.component.spec";

describe('DatabaseBackupAndRestoreService', () => {
  beforeEach(() => MockBuilder(DatabaseBackupAndRestoreService, AppModule));

  it('should be created', () => {
    // Act
    const databaseBackupAndRestoreService = MockRender(DatabaseBackupAndRestoreService).point.componentInstance;

    // Assert
    expect(databaseBackupAndRestoreService).toBeTruthy();
  });

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
      await databaseBackupAndRestoreService.backup();

      // Assert
      // No failure in mock setup
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
      await databaseBackupAndRestoreService.backup();

      // Assert
      // No failure in mock setup
    })
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
