import {Injectable} from '@angular/core';
import {exportDB} from "dexie-export-import";
import {db} from "./db";
import {FileUploadService} from "../file-upload/file-upload.service";
import {lastValueFrom} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class DatabaseBackupAndRestoreService {

  constructor(private fileUploadService: FileUploadService) {
  }

  async backup() {
    let blob = await exportDB(db);
    // TODO: Don't create the file when it already exists
    await lastValueFrom(this.fileUploadService.upload({name: 'db.backup', blob}));
  }
}
