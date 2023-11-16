import {LoginComponent} from './login.component';
import {MockBuilder, MockInstance, MockRender, ngMocks} from "ng-mocks";
import {AppModule} from "../app.module";
import {GoogleDriveAuthService} from "../file-upload/google-drive-auth.service";
import {mock, when} from "strong-mock";
import {HarnessLoader} from "@angular/cdk/testing";
import {ComponentFixture} from "@angular/core/testing";
import {TestbedHarnessEnvironment} from "@angular/cdk/testing/testbed";
import {MatButtonHarness} from "@angular/material/button/testing";
import {Router} from "@angular/router";

describe('LoginComponent', () => {
  beforeEach(() => MockBuilder(LoginComponent, AppModule));

  it('should create', () => {
    let component = MockRender(LoginComponent).point.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should ask for authentication when the user is not authenticated', () => {
    // Arrange
    // Ensure we don't try to authorize
    MockInstance(GoogleDriveAuthService, 'requestApiToken', mock<GoogleDriveAuthService['requestApiToken']>());
    let isAuthenticatedMock = MockInstance(GoogleDriveAuthService, 'isAuthenticated', mock<GoogleDriveAuthService['isAuthenticated']>());
    when(() => isAuthenticatedMock()).thenReturn(false).atLeast(1);
    MockRender(LoginComponent);

    // Act
    let message = Page.getMessage();

    // Assert
    expect(message).toEqual('You must be logged in to use this application')
  })

  describe('When the user does not have a valid API token', () => {
    it('should automatically request authorization', async () => {
      // Arrange
      // Expect the api token to be requested
      let getApiTokenMock = MockInstance(GoogleDriveAuthService, 'requestApiToken', mock<GoogleDriveAuthService['requestApiToken']>());
      when(() => getApiTokenMock()).thenResolve('apiToken');

      // Expect a redirection
      let navigateByUrlMock = MockInstance(Router, 'navigateByUrl', mock<Router['navigateByUrl']>());
      when(() => navigateByUrlMock('/')).thenResolve(true)

      // The user is already authenticated
      let isAuthenticatedMock = MockInstance(GoogleDriveAuthService, 'isAuthenticated', mock<GoogleDriveAuthService['isAuthenticated']>());
      when(() => isAuthenticatedMock()).thenReturn(true).atLeast(1);

      // Act
      MockRender(LoginComponent);
    })

    it('should ask for authorization', () => {
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

    it('should authorize and then redirect when clicking on authorize button', async () => {
      // Arrange
      let isAuthenticatedMock = MockInstance(GoogleDriveAuthService, 'isAuthenticated', mock<GoogleDriveAuthService['isAuthenticated']>());
      when(() => isAuthenticatedMock()).thenReturn(true).atLeast(1);

      let getApiTokenMock = MockInstance(GoogleDriveAuthService, 'requestApiToken', mock<GoogleDriveAuthService['requestApiToken']>());
      // Reject the automatic authorization
      when(() => getApiTokenMock()).thenReject();
      // Expect the api token to be requested a second time when clicking on the button
      when(() => getApiTokenMock()).thenResolve('apiToken');

      // Expect a redirection
      let navigateByUrlMock = MockInstance(Router, 'navigateByUrl', mock<Router['navigateByUrl']>());
      when(() => navigateByUrlMock('/')).thenResolve(true)

      let fixture = MockRender(LoginComponent);
      let page = new Page(fixture);

      // Act
      await page.clickAuthorize();
    })
  })
});

class Page {
  private loader: HarnessLoader;

  constructor(fixture: ComponentFixture<LoginComponent>) {
    this.loader = TestbedHarnessEnvironment.loader(fixture);
  }

  static getMessage(): string {
    return ngMocks.find('.login-message').nativeNode.textContent.trim();
  }

  async clickAuthorize() {
    let button = await this.loader.getHarness(MatButtonHarness.with({text: 'Authorize'}));
    return button.click();
  }
}
