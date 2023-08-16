import {Injectable} from '@angular/core';
import {FileElement} from "./file-list.component";
import {from, map, mergeMap, Observable} from "rxjs";
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
        if (accessToken == null) {
          throw new Error('no api access token!')
        }
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
    const url = BaseFolderService.DRIVE_API_FILES_BASE_URL + '?q=' + encodeURI("'" + folderId + "' in parents") + "&fields=" + encodeURI("files(name,createdTime,size)");
    return this.http.get<gapi.client.drive.FileList>(url, {headers: headers}).pipe(map(res => {
      if (res.files) {
        return res.files.map(f => {
          return {
            name: f.name,
            date: f.createdTime,
            size: Number(f.size)
          } as FileElement;
        })
      } else {
        return []
      }
    }));
  }
}
