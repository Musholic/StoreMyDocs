import {Injectable} from '@angular/core';
import {FileService} from "../file-list/file.service";

@Injectable({
  providedIn: 'root'
})
export class BaseFolderService {
  static readonly DRIVE_API_FILES_BASE_URL = 'https://www.googleapis.com/drive/v3/files';
  private readonly BASE_FOLDER_NAME = 'storemydocs.ovh';

  constructor(private fileService: FileService) {
  }

  findOrCreateBaseFolder(accessToken: string) {

    return this.fileService.findOrCreateFolder(accessToken, this.BASE_FOLDER_NAME);
  }

}
