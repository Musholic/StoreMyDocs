import {authGuard} from './auth.guard';
import {MockBuilder, MockedComponentFixture, MockInstance, MockRender, NG_MOCKS_GUARDS, ngMocks} from "ng-mocks";
import {Router, RouterModule, RouterOutlet} from "@angular/router";
import {RouterTestingModule} from "@angular/router/testing";
import {AppModule} from "../app.module";
import {fakeAsync, tick} from "@angular/core/testing";
import {GoogleDriveAuthService} from "../file-upload/google-drive-auth.service";
import {mock, when} from "strong-mock";

function initializeNavigation(fixture: MockedComponentFixture<RouterOutlet, {}>, router: Router) {
  // First we need to initialize navigation.
  if (fixture.ngZone) {
    fixture.ngZone.run(() => router.initialNavigation());
    tick(); // is needed for rendering of the current route.
  }
}

describe('authGuard', () => {
  beforeEach(() =>
    MockBuilder(
      [
        RouterModule,
        RouterTestingModule.withRoutes([])
      ],
      AppModule,
    )
      // excluding all guards to avoid side effects
      .exclude(NG_MOCKS_GUARDS)
      // keeping guard for testing
      .keep(authGuard)
  );

  describe('when we are not logged in', () => {
    it('redirects to login', fakeAsync(() => {
      // Arrange
      let isAuthenticatedMock = MockInstance(GoogleDriveAuthService, 'isAuthenticatedAndHasValidApiToken',
        mock<GoogleDriveAuthService['isAuthenticatedAndHasValidApiToken']>());
      when(() => isAuthenticatedMock()).thenReturn(false);

      const fixture = MockRender(RouterOutlet, {});

      const router = ngMocks.get(Router);

      // Act
      initializeNavigation(fixture, router);

      // Assert
      expect(router.url).toEqual('/login');
    }));
  })

  describe('when we are already logged in', () => {
    it('allows navigation to root', fakeAsync(() => {
      // Arrange
      let isAuthenticatedMock = MockInstance(GoogleDriveAuthService, 'isAuthenticatedAndHasValidApiToken',
        mock<GoogleDriveAuthService['isAuthenticatedAndHasValidApiToken']>());
      when(() => isAuthenticatedMock()).thenReturn(true);

      const fixture = MockRender(RouterOutlet, {});
      const router = ngMocks.get(Router);

      // Act
      initializeNavigation(fixture, router);

      // Assert
      // Because by default we are not logged, the guard should
      // redirect us /login page.
      expect(router.url).toEqual('/');
    }));
  });
});
