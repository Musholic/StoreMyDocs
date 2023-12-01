import {Injectable} from '@angular/core';
import {exportDB, importDB} from "dexie-export-import";
import {db} from "./db";
import {FileUploadService} from "../file-upload/file-upload.service";
import {from, map, mergeMap, Observable, of} from "rxjs";
import {FileService} from "../file-list/file.service";
import {FileElement, isFileElement} from "../file-list/file-list.component";
import {HttpClient} from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class DatabaseBackupAndRestoreService {

  private static readonly DB_NAME = 'db.backup';

  constructor(private fileUploadService: FileUploadService, private fileService: FileService, private http: HttpClient) {
  }

  backup() {
    return from(exportDB(db))
      .pipe(mergeMap(blob => {
        return this.findExistingDbFile()
          .pipe(mergeMap(dbFile => {
            return this.fileUploadService.upload({name: DatabaseBackupAndRestoreService.DB_NAME, blob}, dbFile?.id);
          }));
      }));
  }

  restore(): Observable<void> {
    return this.findExistingDbFile().pipe(mergeMap(dbFile => {
      if (dbFile) {
        let dlLink = FileService.DRIVE_API_FILES_BASE_URL + '/' + dbFile.id + '?alt=media';
        return this.http.get(dlLink, {responseType: "blob"});
      }
      return of();
    }), mergeMap(dbDownloadResponse => {
      return from(importDB(dbDownloadResponse));
    }), map(() => void 0));
  }

  private findExistingDbFile() {
    return this.fileService.findAll()
      .pipe(map(files => {
        // TODO: ensure there cannot be any conflicts with user files
        return files.filter(f => isFileElement(f))
          .map(f => f as FileElement)
          .find(file => file.name === DatabaseBackupAndRestoreService.DB_NAME)
      }));
  }
}
