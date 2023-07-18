import {GoogleDriveAuthService} from './google-drive-auth.service';
import {MockBuilder, MockRender} from "ng-mocks";
import {AppModule} from "../app.module";
import {It, mock, verifyAll, when} from 'strong-mock';
// @ts-ignore
import TokenResponse = google.accounts.oauth2.TokenResponse;
// @ts-ignore
import TokenClientConfig = google.accounts.oauth2.TokenClientConfig;
// @ts-ignore
import TokenClient = google.accounts.oauth2.TokenClient;

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
            let tokenClientMock = mock<TokenClient>();
            let initTokenClientCallback = It.willCapture<initTokenClientCallbackType>();
            when(() => initTokenClientMock(It.isObject({
                client_id: '99873064994-bn94ep45ugmo6u1s3fl3li84fr3olvnv.apps.googleusercontent.com',
                // @ts-ignore
                callback: initTokenClientCallback,
                scope: 'https://www.googleapis.com/auth/drive.file',
                prompt: 'consent'
            })))
                .thenReturn(tokenClientMock)

            when(() => tokenClientMock.requestAccessToken).thenReturn(() => {
                initTokenClientCallback.value?.({access_token: 'at8765465'} as TokenResponse)
            })

            // @ts-ignore
            const service = MockRender(GoogleDriveAuthService).point.componentInstance;

            // Act
            const accessToken = await service.getAccessToken();

            // Assert
            expect(accessToken).toEqual('at8765465');
        });
    })
    afterEach(() => {
        verifyAll();
    })
});
