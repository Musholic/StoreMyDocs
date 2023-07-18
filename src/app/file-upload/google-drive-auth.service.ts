import {Injectable} from '@angular/core';



@Injectable({
    providedIn: 'root'
})
export class GoogleDriveAuthService {
    private SCOPE = 'https://www.googleapis.com/auth/drive.file';
    private CLIENT_ID = '99873064994-bn94ep45ugmo6u1s3fl3li84fr3olvnv.apps.googleusercontent.com';
    private static readonly LOCAL_STORAGE_TOKEN = 'google_auth_token';
    private accessToken = '';

    private async auth() {
        // @ts-ignore
        let tokenResponsePromise = new Promise<google.accounts.oauth2.TokenResponse>((resolve, reject) => {
            try {
                // @ts-ignore
                let tokenClient = google.accounts.oauth2.initTokenClient({
                    client_id: this.CLIENT_ID,
                    scope: this.SCOPE,
                    prompt: 'consent',
                    callback: resolve,
                });
                tokenClient.requestAccessToken();
            } catch (err) {
                reject(err);
            }
        });
        let tokenResponse = await tokenResponsePromise;
        localStorage.setItem(GoogleDriveAuthService.LOCAL_STORAGE_TOKEN, tokenResponse.access_token)

        let expires_at = new Date();
        expires_at.setSeconds(expires_at.getSeconds() + tokenResponse.expires_in);
        localStorage.setItem('google_auth_token_expires_at', expires_at.getTime() + '')
        this.accessToken = tokenResponse.access_token;
    }

    async getAccessToken() {
        if (!this.accessToken) {
            this.accessToken = localStorage.getItem(GoogleDriveAuthService.LOCAL_STORAGE_TOKEN) as string;
            if (!this.accessToken) {
                await this.auth();
            }
        }
        return this.accessToken;
    }
}

