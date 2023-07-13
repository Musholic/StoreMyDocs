import {Injectable} from '@angular/core';


@Injectable({
  providedIn: 'root'
})
export class GoogleDriveAuthService {
  private SCOPE = 'https://www.googleapis.com/auth/drive.file';
  private DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
  private CLIENT_ID = '99873064994-bn94ep45ugmo6u1s3fl3li84fr3olvnv.apps.googleusercontent.com';

  constructor() {
  }

  async auth() {
    return new Promise((resolve, reject) => {
      // @ts-ignore
      gapi.load('client', {
        callback: resolve,
        onerror: reject,
        timeout: 1000, // 5 seconds.
        ontimeout: reject
      });
    }).then(() => {

      // @ts-ignore
      return new Promise((resolve, reject) => {

        try {
          // @ts-ignore
          let tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: this.CLIENT_ID,
            scope: this.SCOPE,
            prompt: 'consent',
            callback: resolve,
          });
          // TODO: only if token not valid
          tokenClient.requestAccessToken();
        } catch (err) {
          reject(err);
        }
      });
    }).then(() => {
      // @ts-ignore
      return gapi.client.init({
        'discoveryDocs': [this.DISCOVERY_DOC]
      })
    })
  }
}

