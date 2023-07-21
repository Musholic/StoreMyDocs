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
    const service = MockRender(GoogleDriveAuthService).point.componentInstance;
    expect(service).toBeTruthy();
  });

  describe('When there is no available token', () => {
    it('Should request a new token', async () => {
      // Arrange
      let localStorageMock = getLocalStorageMock();
      when(() => localStorageMock.getItem('google_api_token')).thenReturn('');
      when(() => localStorageMock.getItem('google_auth_token')).thenReturn('');

      setupAuthExchange();

      // @ts-ignore
      const service = MockRender(GoogleDriveAuthService).point.componentInstance;

      // Act
      const accessToken = await service.getApiToken();

      // Assert
      expect(accessToken).toEqual('at8765465');
    });
  })
  describe('When there is an existing token', () => {
    it('Should get existing token', async () => {
      // Arrange
      let localStorageMock = getLocalStorageMock();
      when(() => localStorageMock.getItem('google_auth_token')).thenReturn('');
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
      when(() => localStorageMock.getItem('google_auth_token')).thenReturn('');
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
    scope: 'https://www.googleapis.com/auth/drive.file'
  })))
    .thenReturn(tokenClientMock)

  when(() => tokenClientMock.requestAccessToken).thenReturn(() => {
    initTokenClientCallback.value?.({access_token: 'at8765465'} as TokenResponse)
  })
}
