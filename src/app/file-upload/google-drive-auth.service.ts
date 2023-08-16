import {Injectable} from '@angular/core';
import {JwtHelperService} from "@auth0/angular-jwt";

@Injectable({
  providedIn: 'root'
})
export class GoogleDriveAuthService {
  private SCOPE = 'https://www.googleapis.com/auth/drive.file';
  private CLIENT_ID = '99873064994-bn94ep45ugmo6u1s3fl3li84fr3olvnv.apps.googleusercontent.com';
  private static readonly LOCAL_STORAGE_AUTH_TOKEN = 'google_auth_token';
  private static readonly LOCAL_STORAGE_API_TOKEN = 'google_api_token';
  private static readonly LOCAL_STORAGE_API_TOKEN_EXPIRES_AT = 'google_api_token_expires_at';
  private authToken: AuthToken | null = null;
  private apiToken: string | null = null;
  private jwtHelper: JwtHelperService;

  constructor() {
    this.jwtHelper = new JwtHelperService();
    let encodedAuthToken = localStorage.getItem(GoogleDriveAuthService.LOCAL_STORAGE_AUTH_TOKEN);
    this.setAuthTokenFromEncodedToken(encodedAuthToken);
    this.apiToken = localStorage.getItem(GoogleDriveAuthService.LOCAL_STORAGE_API_TOKEN);
  }

  private setAuthTokenFromEncodedToken(encodedAuthToken: string | null) {
    if (encodedAuthToken) {
      this.authToken = this.jwtHelper.decodeToken(encodedAuthToken);
    }
  }

  private async auth() {
    let tokenResponsePromise = new Promise<google.accounts.oauth2.TokenResponse>((resolve, reject) => {
      try {
        let tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: this.CLIENT_ID,
          scope: this.SCOPE,
          callback: resolve,
          hint: this.authToken?.email
        });
        tokenClient.requestAccessToken();
      } catch (err) {
        reject(err);
      }
    });
    let tokenResponse = await tokenResponsePromise;
    localStorage.setItem(GoogleDriveAuthService.LOCAL_STORAGE_API_TOKEN, tokenResponse.access_token)

    let expires_at = new Date();
    // @ts-ignore TODO: remove
    expires_at.setSeconds(expires_at.getSeconds() + tokenResponse.expires_in);
    localStorage.setItem(GoogleDriveAuthService.LOCAL_STORAGE_API_TOKEN_EXPIRES_AT, expires_at.getTime() + '')
    this.apiToken = tokenResponse.access_token;
  }

  async getApiToken() {
    if (this.apiToken) {
      let expires_at = Number(localStorage.getItem(GoogleDriveAuthService.LOCAL_STORAGE_API_TOKEN_EXPIRES_AT));
      if (expires_at < new Date().getTime()) {
        this.apiToken = null;
      }
    }
    if (!this.apiToken) {
      await this.auth();
    }
    return this.apiToken;
  }

  isAuthenticated(): boolean {
    return this.authToken !== null;
  }

  authenticate(credential: string) {
    localStorage.setItem(GoogleDriveAuthService.LOCAL_STORAGE_AUTH_TOKEN, credential);
    this.setAuthTokenFromEncodedToken(credential)
  }

  getAuthToken() {
    return this.authToken;
  }

  logout() {
    google.accounts.id.disableAutoSelect();
    this.authToken = null;
    this.apiToken = null;
    localStorage.removeItem(GoogleDriveAuthService.LOCAL_STORAGE_AUTH_TOKEN);
    localStorage.removeItem(GoogleDriveAuthService.LOCAL_STORAGE_API_TOKEN);
  }
}


export interface AuthToken {
  name: string,
  email: string,
  picture: string
}
