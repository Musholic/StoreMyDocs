import {Injectable} from '@angular/core';
import {FileService} from "../file-list/file.service";
import {mergeMap, Observable} from "rxjs";
import {FileElement} from "../file-list/file-list.component";

@Injectable({
  providedIn: 'root'
})
export class BaseFolderService {
  static readonly DRIVE_API_FILES_BASE_URL = 'https://www.googleapis.com/drive/v3/files';
  private readonly BASE_FOLDER_NAME = 'storemydocs.ovh';

  constructor(private fileService: FileService) {
  }

  findOrCreateBaseFolder() {
    return this.fileService.findOrCreateFolder(this.BASE_FOLDER_NAME);
  }

  listAllFiles(): Observable<FileElement[]> {
    return this.findOrCreateBaseFolder().pipe(
      mergeMap(baseFolderId => {
        return this.fileService.findInFolder(baseFolderId)
      })
    );
  }
}
