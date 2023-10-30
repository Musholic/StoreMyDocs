import {Injectable} from '@angular/core';
import {FileService} from "../file-list/file.service";

@Injectable({
  providedIn: 'root'
})
export class BaseFolderService {
  private readonly BASE_FOLDER_NAME = 'storemydocs.ovh';

  constructor(private fileService: FileService) {
  }

  findOrCreateBaseFolder() {
    return this.fileService.findOrCreateFolder(this.BASE_FOLDER_NAME);
  }
}
