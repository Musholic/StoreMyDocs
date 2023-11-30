import {Injectable} from '@angular/core';
import {exportDB} from "dexie-export-import";
import {db} from "./db";
import {FileUploadService} from "../file-upload/file-upload.service";
import {lastValueFrom, mergeMap} from "rxjs";
import {FileService} from "../file-list/file.service";

@Injectable({
  providedIn: 'root'
})
export class DatabaseBackupAndRestoreService {

  private static readonly DB_NAME = 'db.backup';

  constructor(private fileUploadService: FileUploadService, private fileService: FileService) {
  }

  async backup() {
    let blob = await exportDB(db);
    await lastValueFrom(this.fileService.findAll()
      .pipe(mergeMap(files => {
        // TODO: ensure there cannot be any conflicts with user files
        let dbFile = files.find(file => file.name === DatabaseBackupAndRestoreService.DB_NAME);
        return this.fileUploadService.upload({name: DatabaseBackupAndRestoreService.DB_NAME, blob}, dbFile?.id);
      })));
  }
}
