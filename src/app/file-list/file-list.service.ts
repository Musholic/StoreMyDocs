import {Injectable} from '@angular/core';
import {FileElement} from "./file-list.component";
import {from, map, mergeMap, Observable, of} from "rxjs";
import {BaseFolderService} from "../file-upload/base-folder.service";
import {GoogleDriveAuthService} from "../file-upload/google-drive-auth.service";
import {HttpClient} from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class FileListService {

  constructor(private baseFolderService: BaseFolderService, private authService: GoogleDriveAuthService, private http: HttpClient) {
  }

  list(): Observable<FileElement[]> {
    return from(this.authService.getApiToken()).pipe(
      mergeMap(accessToken => {
        return this.baseFolderService.findOrCreateBaseFolder(accessToken).pipe(
          mergeMap(baseFolderId => {
            return this.findInFolder(accessToken, baseFolderId)
          })
        );
      }));
  }

  private findInFolder(accessToken: string, folderId: string) {
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
  setCategory() :Observable<void>{
    return of();
  }

}
