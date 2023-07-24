import {NavBarComponent} from './nav-bar.component';
import {MockBuilder, MockInstance, MockRender, ngMocks} from "ng-mocks";
import {AppModule} from "../app.module";
import {It, mock, when} from "strong-mock";
import {GoogleDriveAuthService} from "../file-upload/google-drive-auth.service";

describe('NavBarComponent', () => {

  MockInstance.scope();

  beforeEach(() => {

    return MockBuilder(NavBarComponent, AppModule);
  });

  it('should create', () => {
    // Arrange
    let gIdMock = setupGoogleMocks();
    when(() => gIdMock.prompt()).thenReturn();
    let isAuthenticatedMock = MockInstance(GoogleDriveAuthService, 'isAuthenticated', mock<GoogleDriveAuthService['isAuthenticated']>());
    when(() => isAuthenticatedMock()).thenReturn(false).atLeast(1);

    // Act
    let component = MockRender(NavBarComponent).point.componentInstance;

    // Assert
    expect(component).toBeTruthy();
  });
  describe('When not authenticated', () => {
    it('should display login button', () => {
      // Arrange
      let gIdMock = setupGoogleMocks();
      when(() => gIdMock.prompt()).thenReturn();
      let isAuthenticatedMock = MockInstance(GoogleDriveAuthService, 'isAuthenticated', mock<GoogleDriveAuthService['isAuthenticated']>());
      when(() => isAuthenticatedMock()).thenReturn(false).atLeast(1);

      // Act
      MockRender(NavBarComponent);

      // Assert
      expect(Page.isLoginDisplayed()).toBeTrue();
      expect(Page.isAvatarDisplayed()).toBeFalse();
    })
  });
  describe('When already authenticated', () => {
    it('should not display login button', () => {
      // Arrange
      setupGoogleMocks();
      let isAuthenticatedMock = MockInstance(GoogleDriveAuthService, 'isAuthenticated', mock<GoogleDriveAuthService['isAuthenticated']>());
      when(() => isAuthenticatedMock()).thenReturn(true).atLeast(1);

      // Act
      MockRender(NavBarComponent);

      // Assert
      expect(Page.isLoginDisplayed()).toBeFalse();
      expect(Page.isAvatarDisplayed()).toBeTrue();
    })
  })
});

function setupGoogleMocks() {
  // @ts-ignore
  let gIdMock = mock<typeof google.accounts.id>();
  // @ts-ignore
  window['google'] = {
    // @ts-ignore
    accounts: {
      id: gIdMock
    }
  }

  when(() => gIdMock.initialize(It.isObject({
    client_id: '99873064994-bn94ep45ugmo6u1s3fl3li84fr3olvnv.apps.googleusercontent.com'
  }))).thenReturn();
  when(() => gIdMock.renderButton(It.isAny(), It.isObject())).thenReturn();
  return gIdMock;
}

class Page {
  static isLoginDisplayed() {
    return !ngMocks.find('#gbtn').attributes.hasOwnProperty('hidden');
  }

  static isAvatarDisplayed() {
    return !!ngMocks.find('.avatar-button', false);
  }
}
