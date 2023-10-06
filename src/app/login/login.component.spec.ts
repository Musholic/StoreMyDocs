import {LoginComponent} from './login.component';
import {MockBuilder, MockInstance, MockRender, ngMocks} from "ng-mocks";
import {AppModule} from "../app.module";
import {GoogleDriveAuthService} from "../file-upload/google-drive-auth.service";
import {mock, when} from "strong-mock";

describe('LoginComponent', () => {
  MockInstance.scope();

  beforeEach(() => MockBuilder(LoginComponent, AppModule));

  it('should create', () => {
    let component = MockRender(LoginComponent).point.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should ask for authentication when the user is not authenticated', () => {
    // Arrange
    let isAuthenticatedMock = MockInstance(GoogleDriveAuthService, 'isAuthenticated', mock<GoogleDriveAuthService['isAuthenticated']>());
    when(() => isAuthenticatedMock()).thenReturn(false).atLeast(1);
    MockRender(LoginComponent);

    // Act
    let message = Page.getMessage();

    // Assert
    expect(message).toEqual('You must be logged in to use this application')
  })

  it('should ask for authorization if the user does not have a valid API token', () => {
    // Arrange
    let isAuthenticatedMock = MockInstance(GoogleDriveAuthService, 'isAuthenticated', mock<GoogleDriveAuthService['isAuthenticated']>());
    when(() => isAuthenticatedMock()).thenReturn(true).atLeast(1);
    MockRender(LoginComponent);

    // Act
    let message = Page.getMessage();

    // Assert
    expect(message).toEqual('You need to authorize the access to your Google Drive files. ' +
      'Only the files and folders that you open or create with this application will be accessible')
  })
});

class Page {
  static getMessage(): string {
    return ngMocks.find('.login-message').nativeNode.textContent.trim();
  }
}
