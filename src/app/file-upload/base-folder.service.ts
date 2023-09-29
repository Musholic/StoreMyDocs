import {Injectable} from '@angular/core';
import {map, mergeMap, of} from "rxjs";
import {HttpClient} from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class BaseFolderService {
  static readonly DRIVE_API_FILES_BASE_URL = 'https://www.googleapis.com/drive/v3/files';
  private readonly BASE_FOLDER_NAME = 'storemydocs.ovh';

  constructor(private http: HttpClient) {
  }

  findOrCreateBaseFolder(accessToken: string) {
    const authHeader = `Bearer ${accessToken}`;

    return this.findBaseFolder(authHeader).pipe(mergeMap(baseId => {
      if (baseId) {
        return of(baseId);
      } else {
        return this.createBaseFolder(authHeader);
      }
    }))
  }

  private findBaseFolder(authHeader: string) {
    const headers = {
      'Authorization': authHeader,
      'Content-Type': 'application/json'
    };
    const url = BaseFolderService.DRIVE_API_FILES_BASE_URL + '?q=' + encodeURI("mimeType='application/vnd.google-apps.folder' and name='" + this.BASE_FOLDER_NAME + "'");
    return this.http.get<gapi.client.drive.FileList>(url, {headers: headers}).pipe(map(res => {
      if (res.files && res.files.length > 0) {
        return res.files[0].id;
      }
      return undefined;
    }));
  }

  private createBaseFolder(authHeader: string) {
    const headers = {
      'Authorization': authHeader,
      'Content-Type': 'application/json'
    };
    const metadata = {
      'name': this.BASE_FOLDER_NAME,
      'mimeType': 'application/vnd.google-apps.folder'
    };
    const url = BaseFolderService.DRIVE_API_FILES_BASE_URL;

    return this.http.post<gapi.client.drive.File>(url, metadata, {headers: headers})
      .pipe(map(res => {
        if (!res.id) {
          throw new Error('Error creating base folder');
        }
        return res.id;
      }))
  }
}
