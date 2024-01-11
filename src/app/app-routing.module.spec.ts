import {MockBuilder, MockInstance, NG_MOCKS_RESOLVERS, ngMocks} from "ng-mocks";
import {RouterModule} from "@angular/router";
import {RouterTestingModule} from "@angular/router/testing";
import {AppModule} from "./app.module";
import {fakeAsync} from "@angular/core/testing";
import {RulesComponent} from "./rules/rules.component";
import {GoogleDriveAuthService} from "./file-upload/google-drive-auth.service";
import {mock, when} from "strong-mock";
import {HomepageComponent} from "./homepage/homepage.component";
import {UserRootComponent} from "./user-root/user-root.component";
import {mustBeConsumedAsyncObservable, navigateTo} from "../testing/common-testing-function.spec";
import {DatabaseBackupAndRestoreService} from "./database/database-backup-and-restore.service";
import {mockDatabaseBackupAndRestoreService} from "./database/database-backup-and-restore.service.spec";

describe('AppRoutingModule', () => {
  beforeEach(() => {
    return MockBuilder(
      [
        RouterModule,
        RouterTestingModule.withRoutes([]),
      ],
      AppModule,
    )
      .mock(DatabaseBackupAndRestoreService)
      // We use the real UserRootComponent as we need it to load its children route
      .keep(UserRootComponent)
      .exclude(NG_MOCKS_RESOLVERS)
  });

  beforeEach(() => {
    // Since we use the real UserRootComponent, we need to mock the automatic restore
    let databaseBackupAndRestoreService = mockDatabaseBackupAndRestoreService();
    when(() => databaseBackupAndRestoreService.restore())
      .thenReturn(mustBeConsumedAsyncObservable(undefined));
  })

  describe('when logged in', () => {
    beforeEach(() => {
      // Mock that the user is logged in
      let authService = mock<GoogleDriveAuthService>();
      MockInstance(GoogleDriveAuthService, () => {
        return {
          isAuthenticatedAndHasValidApiToken: authService.isAuthenticatedAndHasValidApiToken
        }
      });
      when(() => authService.isAuthenticatedAndHasValidApiToken()).thenReturn(true);
    })

    it('should display rules page', fakeAsync(() => {
      // Act
      navigateTo('/rules');

      // Assert
      expect(() => ngMocks.find(UserRootComponent)).not.toThrow();
      expect(() => ngMocks.find(RulesComponent)).not.toThrow();
    }));

    it('should display home page', fakeAsync(() => {
      // Act
      navigateTo("/")

      // Assert
      expect(() => ngMocks.find(HomepageComponent)).not.toThrow();
    }));
  })

});
