import {GoogleDriveAuthService} from './google-drive-auth.service';
import {MockBuilder, MockInstance, MockRender} from "ng-mocks";
import {AppModule} from "../app.module";
import {It, mock, when} from 'strong-mock';
import {Router} from "@angular/router";
import {getLocalStorageMock,} from "../../testing/common-testing-function.spec";
import TokenClient = google.accounts.oauth2.TokenClient;
import TokenResponse = google.accounts.oauth2.TokenResponse;


function setupValidAuthenticationAndApiToken() {
  const localStorageMock = getLocalStorageMock();
  when(() => localStorageMock.getItem('google_auth_token')).thenReturn(encodedTestUserAuthToken);
  when(() => localStorageMock.getItem('google_api_token')).thenReturn('at54613');
  when(() => localStorageMock.getItem('google_api_token_expires_at')).thenReturn('' + (new Date().getTime() + 60 * 1000));
}

describe('GoogleDriveAuthService', () => {
  beforeEach(() =>
    MockBuilder(GoogleDriveAuthService, AppModule)
  );

  it('should be created', () => {
    // Arrange
    const localStorageMock = getLocalStorageMock();
    when(() => localStorageMock.getItem('google_auth_token')).thenReturn('');
    when(() => localStorageMock.getItem('google_api_token')).thenReturn('');

    // Act
    const service = MockRender(GoogleDriveAuthService).point.componentInstance;

    // Assert
    expect(service).toBeTruthy();
  });

  describe('When there is no available token', () => {
    it('Should request a new token (user is authenticated)', async () => {
      // Arrange
      const localStorageMock = getLocalStorageMock();
      when(() => localStorageMock.getItem('google_auth_token')).thenReturn(encodedTestUserAuthToken);
      when(() => localStorageMock.getItem('google_api_token')).thenReturn('');

      setupAuthExchange();

      const service = MockRender(GoogleDriveAuthService).point.componentInstance;

      // Act
      const accessToken = await service.requestApiToken();

      // Assert
      expect(accessToken).toEqual('at8765465');
      expect(service.isAuthenticated()).toEqual(true);
    });

    it('Should authenticate', () => {
      // Arrange
      const localStorageMock = getLocalStorageMock();
      when(() => localStorageMock.getItem('google_auth_token')).thenReturn('');
      when(() => localStorageMock.getItem('google_api_token')).thenReturn('');
      when(() => localStorageMock.setItem('google_auth_token', encodedTestUserAuthToken)).thenReturn();

      const service = MockRender(GoogleDriveAuthService).point.componentInstance;

      // Act
      service.authenticate(encodedTestUserAuthToken);

      // Assert
      expect(service.getAuthToken()).toEqual(decodedTestUserAuthToken);
    });
  })
  describe('When there is an existing token', () => {

    it('Should get existing token', async () => {
      // Arrange
      setupValidAuthenticationAndApiToken();

      const service = MockRender(GoogleDriveAuthService).point.componentInstance;

      // Act
      const accessToken = await service.requestApiToken();

      // Assert
      expect(accessToken).toEqual('at54613');
      expect(service.getApiToken()).toEqual('at54613')
    });

    it('Should refresh existing expired token', async () => {
      // Arrange
      const localStorageMock = getLocalStorageMock();
      when(() => localStorageMock.getItem('google_auth_token')).thenReturn(encodedTestUserAuthToken);
      when(() => localStorageMock.getItem('google_api_token')).thenReturn('at54613_expired');
      when(() => localStorageMock.getItem('google_api_token_expires_at')).thenReturn(new Date().getTime() + '');
      setupAuthExchange()

      const service = MockRender(GoogleDriveAuthService).point.componentInstance;

      // Act
      const accessToken = await service.requestApiToken();

      // Assert
      expect(accessToken).toEqual('at8765465');
      expect(service.getApiToken()).toEqual('at8765465')
    });

    it('Should logout', () => {
      // Arrange
      const localStorageMock = getLocalStorageMock();
      when(() => localStorageMock.getItem('google_auth_token')).thenReturn(encodedTestUserAuthToken);
      when(() => localStorageMock.getItem('google_api_token')).thenReturn('at8454');
      when(() => localStorageMock.removeItem('google_auth_token')).thenReturn();
      when(() => localStorageMock.removeItem('google_api_token')).thenReturn();
      const disableAutoSelectMock = mock<() => void>();
      window['google'] = {
        accounts: {
          id: {
            disableAutoSelect: disableAutoSelectMock
          }
        },
      } as typeof google;
      when(() => disableAutoSelectMock()).thenReturn();

      // Expect a redirection to the login page
      const navigateByUrlMock = MockInstance(Router, 'navigateByUrl', mock<Router['navigateByUrl']>());
      when(() => navigateByUrlMock('/login')).thenResolve(true)

      const service = MockRender(GoogleDriveAuthService).point.componentInstance;

      // Act
      service.logout();

      // Assert
      expect(service.getAuthToken()).toBeNull();
      expect(service.isAuthenticated()).toEqual(false);
      expect(service.getApiToken()).toBeNull();
    });
  })
  describe('isAuthenticatedAndHasValidApiToken', () => {
    it('Should return true when authenticated with valid api token', () => {
      // Arrange
      setupValidAuthenticationAndApiToken();

      const service = MockRender(GoogleDriveAuthService).point.componentInstance;

      // Act
      const result = service.isAuthenticatedAndHasValidApiToken();

      // Assert
      expect(result).toBeTruthy();
    });

    it('Should return false when not authenticated', () => {
      // Arrange
      const localStorageMock = getLocalStorageMock();
      when(() => localStorageMock.getItem('google_auth_token')).thenReturn(null);
      when(() => localStorageMock.getItem('google_api_token')).thenReturn('at54613');

      const service = MockRender(GoogleDriveAuthService).point.componentInstance;

      // Act
      const result = service.isAuthenticatedAndHasValidApiToken();

      // Assert
      expect(result).toBeFalsy();
    });

    it('Should return false when there is no api token', () => {
      // Arrange
      const localStorageMock = getLocalStorageMock();
      when(() => localStorageMock.getItem('google_auth_token')).thenReturn(encodedTestUserAuthToken);
      when(() => localStorageMock.getItem('google_api_token')).thenReturn(null);

      const service = MockRender(GoogleDriveAuthService).point.componentInstance;

      // Act
      const result = service.isAuthenticatedAndHasValidApiToken();

      // Assert
      expect(result).toBeFalsy();
    });

    it('Should return false when api token is not valid', () => {
      // Arrange
      const localStorageMock = getLocalStorageMock();
      when(() => localStorageMock.getItem('google_auth_token')).thenReturn(encodedTestUserAuthToken);
      when(() => localStorageMock.getItem('google_api_token')).thenReturn('at54613');
      when(() => localStorageMock.getItem('google_api_token_expires_at')).thenReturn('' + (new Date().getTime() - 60 * 1000));

      const service = MockRender(GoogleDriveAuthService).point.componentInstance;

      // Act
      const result = service.isAuthenticatedAndHasValidApiToken();

      // Assert
      expect(result).toBeFalsy();
    });
  })

});

function setupAuthExchange() {
  type initTokenClientCallbackType = google.accounts.oauth2.TokenClientConfig['callback'];
  const initTokenClientMock = mock<typeof google.accounts.oauth2['initTokenClient']>();
  window['google'] = {
    accounts: {
      oauth2: {
        initTokenClient: initTokenClientMock
      }
    }
  } as typeof google;
  const localStorageMock = window.localStorage;
  when(() => localStorageMock.setItem('google_api_token', 'at8765465')).thenReturn();
  when(() => localStorageMock.setItem('google_api_token_expires_at',
    It.matches(expires_at => {
      const num = Number(expires_at);
      const date = new Date().getTime();
      return num > date && num <= date + 3600 * 1000
    })
  )).thenReturn();

  const tokenClientMock = mock<TokenClient>();
  const initTokenClientCallback = It.willCapture<initTokenClientCallbackType>();
  when(() => initTokenClientMock(It.isObject({
    client_id: '99873064994-bn94ep45ugmo6u1s3fl3li84fr3olvnv.apps.googleusercontent.com',
    callback: initTokenClientCallback,
    scope: 'https://www.googleapis.com/auth/drive.file',
    hint: 'testuser@gmail.com'
  })))
    .thenReturn(tokenClientMock)

  when(() => tokenClientMock.requestAccessToken).thenReturn(() => {
    initTokenClientCallback.value?.({access_token: 'at8765465', expires_in: '3600'} as TokenResponse)
  })
}

const encodedTestUserAuthToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIxMjM0LmFwcHMuZ29vZ2' +
  'xldXNlcmNvbnRlbnQuY29tIiwiYXpwIjoiMTIzNC5hcHBzLmdvb2dsZXVzZXJjb250ZW50LmNvbSIsImVtYWlsIjoidGVzdHVzZXJAZ21haWwu' +
  'Y29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImV4cCI6MTIzNCwiZmFtaWx5X25hbWUiOiJUZXN0IiwiZ2l2ZW5fbmFtZSI6IlVzZXIiLCJpYX' +
  'QiOjEyMzQsImlzcyI6Imh0dHBzOi8vYWNjb3VudHMuZ29vZ2xlLmNvbSIsImp0aSI6IjEyMzQiLCJuYW1lIjoiVGVzdCBVc2VyIiwibmJmIjox' +
  'MjM0LCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvMTIzND1zOTYtYyIsInN1YiI6IjEyMzQifQ.OSuenoQ' +
  'jQ5BG0f-z504e7YcP9k5hEZ66MHmPjVZicj4'

const decodedTestUserAuthToken = {
  "aud": "1234.apps.googleusercontent.com",
  "azp": "1234.apps.googleusercontent.com",
  "email": "testuser@gmail.com",
  "email_verified": true,
  "exp": 1234,
  "family_name": "Test",
  "given_name": "User",
  "iat": 1234,
  "iss": "https://accounts.google.com",
  "jti": "1234",
  "name": "Test User",
  "nbf": 1234,
  "picture": "https://lh3.googleusercontent.com/a/1234=s96-c",
  "sub": "1234"
}
