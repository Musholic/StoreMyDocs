import {Injectable} from '@angular/core';
import {FileService} from "../file-list/file.service";

@Injectable({
  providedIn: 'root'
})
export class BaseFolderService {
  public static readonly BASE_FOLDER_NAME = 'storemydocs.ovh';

  constructor(private fileService: FileService) {
  }

  findOrCreateBaseFolder() {
    return this.fileService.findOrCreateFolder(BaseFolderService.BASE_FOLDER_NAME);
  }
}
