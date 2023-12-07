import {MockBuilder, MockInstance, MockRender, ngMocks} from "ng-mocks";
import {Router, RouterModule, RouterOutlet} from "@angular/router";
import {RouterTestingModule} from "@angular/router/testing";
import {AppModule} from "./app.module";
import {Location} from '@angular/common';
import {fakeAsync, tick} from "@angular/core/testing";
import {RulesComponent} from "./rules/rules.component";
import {GoogleDriveAuthService} from "./file-upload/google-drive-auth.service";
import {mock, when} from "strong-mock";
import {HomepageComponent} from "./homepage/homepage.component";

describe('AppRoutingModule', () => {
  beforeEach(() => {
    return MockBuilder(
      [
        RouterModule,
        RouterTestingModule.withRoutes([])
      ],
      AppModule,
    );
  });
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
      // Arrange
      const fixture = MockRender(RouterOutlet, {});
      const router: Router = fixture.point.injector.get(Router);
      const location: Location = fixture.point.injector.get(Location);

      // Act
      location.go('/rules');

      // Assert
      if (fixture.ngZone) {
        fixture.ngZone.run(() => router.initialNavigation());
        tick(); // is needed for rendering of the current route.
      }

      expect(location.path()).toEqual('/rules');
      expect(() => ngMocks.find(RulesComponent)).not.toThrow();
    }));

    it('should display home page', fakeAsync(() => {
      // Arrange
      const fixture = MockRender(RouterOutlet, {});
      const router: Router = fixture.point.injector.get(Router);
      const location: Location = fixture.point.injector.get(Location);

      // Act
      location.go('/');

      // Assert
      if (fixture.ngZone) {
        fixture.ngZone.run(() => router.initialNavigation());
        tick(); // is needed for rendering of the current route.
      }

      expect(location.path()).toEqual('/');
      expect(() => ngMocks.find(HomepageComponent)).not.toThrow();
    }));
  })

});
