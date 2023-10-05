import {Injectable} from '@angular/core';
import {FileElement} from "./file-list.component";
import {from, map, mergeMap, Observable, of} from "rxjs";
import {BaseFolderService} from "../file-upload/base-folder.service";
import {GoogleDriveAuthService} from "../file-upload/google-drive-auth.service";
import {HttpClient} from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class FileService {

  constructor(private authService: GoogleDriveAuthService, private http: HttpClient) {
  }

  findInFolder(accessToken: string, folderId: string) {
    const authHeader = `Bearer ${accessToken}`;
    const headers = {
      'Authorization': authHeader,
      'Content-Type': 'application/json'
    };
    const url = BaseFolderService.DRIVE_API_FILES_BASE_URL + '?q=' + encodeURI("'" + folderId + "' in parents and trashed = false") + "&fields=" + encodeURI("files(id,name,createdTime,size,iconLink,webContentLink)");
    return this.http.get<gapi.client.drive.FileList>(url, {headers: headers}).pipe(map(res => {
      if (res.files) {
        return res.files.map(f => {
          return {
            id: f.id,
            name: f.name,
            date: f.createdTime,
            size: Number(f.size),
            iconLink: f.iconLink,
            dlLink: f.webContentLink
          } as FileElement;
        })
      } else {
        return []
      }
    }));
  }

  trash(id: string) {
    return from(this.authService.getApiToken()).pipe(
      mergeMap(accessToken => {
        const authHeader = `Bearer ${accessToken}`;
        const headers = {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        };

        const url = BaseFolderService.DRIVE_API_FILES_BASE_URL + '/' + id
        return this.http.patch<void>(url, {trashed: true}, {headers: headers});
      }));
  }

  setCategory(fileId: string, category: string): Observable<void> {
    return from(this.authService.getApiToken()).pipe(
      mergeMap(accessToken => {
        // TODO: create the folder inside the base folder
        return this.findOrCreateFolder(accessToken, category).pipe(mergeMap(folderId => {
          const authHeader = `Bearer ${accessToken}`;
          const headers = {
            'Authorization': authHeader,
            'Content-Type': 'application/json'
          };

          const url = BaseFolderService.DRIVE_API_FILES_BASE_URL + '/' + fileId + "?addParents=" + folderId;
          return this.http.patch<void>(url, {}, {headers: headers});
        }))
      }));
  }

  findOrCreateFolder(accessToken: string, folderName: string) {
    const authHeader = `Bearer ${accessToken}`;
    return this.findFolder(authHeader, folderName).pipe(mergeMap(baseId => {
      if (baseId) {
        return of(baseId);
      } else {
        return this.createFolder(authHeader, folderName);
      }
    }))
  }

  private findFolder(authHeader: string, folderName: string) {
    const headers = {
      'Authorization': authHeader,
      'Content-Type': 'application/json'
    };
    const url = BaseFolderService.DRIVE_API_FILES_BASE_URL + '?q=' + encodeURI("mimeType='application/vnd.google-apps.folder' and name='" + folderName + "'");
    return this.http.get<gapi.client.drive.FileList>(url, {headers: headers}).pipe(map(res => {
      if (res.files && res.files.length > 0) {
        return res.files[0].id;
      }
      return undefined;
    }));
  }

  private createFolder(authHeader: string, folderName: string) {
    const headers = {
      'Authorization': authHeader,
      'Content-Type': 'application/json'
    };
    const metadata = {
      'name': folderName,
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
