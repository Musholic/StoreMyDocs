import {Injectable} from '@angular/core';
import {FileService} from "../file-list/file.service";
import {from, mergeMap, Observable} from "rxjs";
import {FileElement} from "../file-list/file-list.component";
import {GoogleDriveAuthService} from "./google-drive-auth.service";

@Injectable({
  providedIn: 'root'
})
export class BaseFolderService {
  static readonly DRIVE_API_FILES_BASE_URL = 'https://www.googleapis.com/drive/v3/files';
  private readonly BASE_FOLDER_NAME = 'storemydocs.ovh';

  constructor(private fileService: FileService, private authService: GoogleDriveAuthService) {
  }

  findOrCreateBaseFolder(accessToken: string) {

    return this.fileService.findOrCreateFolder(accessToken, this.BASE_FOLDER_NAME);
  }

  listAllFiles(): Observable<FileElement[]> {
    return from(this.authService.getApiToken()).pipe(
      mergeMap(accessToken => {
        return this.findOrCreateBaseFolder(accessToken).pipe(
          mergeMap(baseFolderId => {
            return this.fileService.findInFolder(accessToken, baseFolderId)
          })
        );
      }));
  }


}
