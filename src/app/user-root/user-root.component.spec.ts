import {UserRootComponent} from './user-root.component';
import {MockBuilder, MockRender} from "ng-mocks";
import {AppModule} from "../app.module";
import {when} from "strong-mock";
import {mustBeConsumedAsyncObservable} from "../../testing/common-testing-function.spec";
import {mockDatabaseBackupAndRestoreService} from "../database/database-backup-and-restore.service.spec";
import {DatabaseBackupAndRestoreService} from "../database/database-backup-and-restore.service";
import {fakeAsync, tick} from "@angular/core/testing";


describe('UserRootComponent', () => {
  beforeEach(() => MockBuilder(UserRootComponent, AppModule)
    .mock(DatabaseBackupAndRestoreService)
  )

  it('should restore automatically', fakeAsync(() => {
    // Arrange
    let databaseBackupAndRestoreService = mockDatabaseBackupAndRestoreService();
    when(() => databaseBackupAndRestoreService.restore())
      .thenReturn(mustBeConsumedAsyncObservable(undefined));

    // Act
    MockRender(UserRootComponent);

    // Assert
    tick();
    // No failure in mock setup
  }));
});
