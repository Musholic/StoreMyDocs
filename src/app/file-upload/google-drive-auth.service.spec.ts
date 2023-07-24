import {GoogleDriveAuthService} from './google-drive-auth.service';
import {MockBuilder, MockRender} from "ng-mocks";
import {AppModule} from "../app.module";
import {It, mock, when} from 'strong-mock';

// @ts-ignore
import TokenResponse = google.accounts.oauth2.TokenResponse;
// @ts-ignore
import TokenClientConfig = google.accounts.oauth2.TokenClientConfig;
// @ts-ignore
import TokenClient = google.accounts.oauth2.TokenClient;

function getLocalStorageMock() {
  let localStorageMock = mock<Storage>();
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
  });
  return localStorageMock;
}

describe('GoogleDriveAuthService', () => {

  beforeEach(() =>
    MockBuilder(GoogleDriveAuthService, AppModule)
  );

  it('should be created', () => {
    // Arrange
    let localStorageMock = getLocalStorageMock();
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
      let localStorageMock = getLocalStorageMock();
      when(() => localStorageMock.getItem('google_auth_token')).thenReturn(encodedTestUserAuthToken);
      when(() => localStorageMock.getItem('google_api_token')).thenReturn('');

      setupAuthExchange();

      // @ts-ignore
      const service = MockRender(GoogleDriveAuthService).point.componentInstance;

      // Act
      const accessToken = await service.getApiToken();

      // Assert
      expect(accessToken).toEqual('at8765465');
      expect(service.isAuthenticated()).toEqual(true);
    });

    it('Should authenticate', () => {
      // Arrange
      let localStorageMock = getLocalStorageMock();
      when(() => localStorageMock.getItem('google_auth_token')).thenReturn('');
      when(() => localStorageMock.getItem('google_api_token')).thenReturn('');
      when(() => localStorageMock.setItem('google_auth_token', encodedTestUserAuthToken)).thenReturn();

      // @ts-ignore
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
      let localStorageMock = getLocalStorageMock();
      when(() => localStorageMock.getItem('google_auth_token')).thenReturn(encodedTestUserAuthToken);
      when(() => localStorageMock.getItem('google_api_token')).thenReturn('at54613');
      when(() => localStorageMock.getItem('google_api_token_expires_at')).thenReturn('' + (new Date().getTime() + 60 * 1000));

      // @ts-ignore
      const service = MockRender(GoogleDriveAuthService).point.componentInstance;

      // Act
      const accessToken = await service.getApiToken();

      // Assert
      expect(accessToken).toEqual('at54613');
    });

    it('Should refresh existing expired token', async () => {
      // Arrange
      let localStorageMock = getLocalStorageMock();
      when(() => localStorageMock.getItem('google_auth_token')).thenReturn(encodedTestUserAuthToken);
      when(() => localStorageMock.getItem('google_api_token')).thenReturn('at54613_expired');
      when(() => localStorageMock.getItem('google_api_token_expires_at')).thenReturn(new Date().getTime() + '');
      setupAuthExchange()

      // @ts-ignore
      const service = MockRender(GoogleDriveAuthService).point.componentInstance;

      // Act
      const accessToken = await service.getApiToken();

      // Assert
      expect(accessToken).toEqual('at8765465');
    });

    it('Should logout', () => {
      // Arrange
      let localStorageMock = getLocalStorageMock();
      when(() => localStorageMock.getItem('google_auth_token')).thenReturn(encodedTestUserAuthToken);
      when(() => localStorageMock.getItem('google_api_token')).thenReturn('at8454');
      when(() => localStorageMock.removeItem('google_auth_token')).thenReturn();
      when(() => localStorageMock.removeItem('google_api_token')).thenReturn();
      let disableAutoSelectMock = mock<() => void>();
      // @ts-ignore
      window['google'] = {
        accounts: {
          // @ts-ignore
          id: {
            disableAutoSelect: disableAutoSelectMock
          }
        }
      }
      when(() => disableAutoSelectMock()).thenReturn();

      // @ts-ignore
      const service = MockRender(GoogleDriveAuthService).point.componentInstance;

      // Act
      service.logout();

      // Assert
      expect(service.getAuthToken()).toBeNull();
      expect(service.isAuthenticated()).toEqual(false);
    });
  })

});

function setupAuthExchange() {
  type initTokenClientCallbackType = TokenClientConfig['callback'];
  // @ts-ignore
  let initTokenClientMock = mock<typeof google.accounts.oauth2['initTokenClient']>();
  // @ts-ignore
  window['google'] = {
    accounts: {
      // @ts-ignore
      oauth2: {
        initTokenClient: initTokenClientMock
      }
    }
  }
  let localStorageMock = window.localStorage;
  when(() => localStorageMock.setItem('google_api_token', 'at8765465')).thenReturn();
  when(() => localStorageMock.setItem('google_api_token_expires_at', It.isString())).thenReturn();

  let tokenClientMock = mock<TokenClient>();
  let initTokenClientCallback = It.willCapture<initTokenClientCallbackType>();
  when(() => initTokenClientMock(It.isObject({
    client_id: '99873064994-bn94ep45ugmo6u1s3fl3li84fr3olvnv.apps.googleusercontent.com',
    // @ts-ignore
    callback: initTokenClientCallback,
    scope: 'https://www.googleapis.com/auth/drive.file',
    hint: 'testuser@gmail.com'
  })))
    .thenReturn(tokenClientMock)

  when(() => tokenClientMock.requestAccessToken).thenReturn(() => {
    initTokenClientCallback.value?.({access_token: 'at8765465'} as TokenResponse)
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
