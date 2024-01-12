import {Injectable} from '@angular/core';
import {exportDB} from "dexie-export-import";
import {db} from "./db";
import {FileUploadService} from "../file-upload/file-upload.service";
import {filter, from, last, map, mergeMap, Observable, of, tap} from "rxjs";
import {FileService} from "../file-list/file.service";
import {FileElement, isFileElement} from "../file-list/file-list.component";
import {HttpClient, HttpEvent, HttpEventType, HttpProgressEvent, HttpResponse} from "@angular/common/http";
import {BackgroundTaskService} from "../background-task/background-task.service";
import {FilesCacheService} from "../files-cache/files-cache.service";

@Injectable()
export class DatabaseBackupAndRestoreService {

  private static readonly DB_NAME = 'db.backup';

  constructor(private fileUploadService: FileUploadService, private http: HttpClient,
              private backgroundTaskService: BackgroundTaskService, private filesCacheService: FilesCacheService) {
    // TODO: check refresh after restore
  }

  backup() {
    let progress = this.backgroundTaskService.showProgress('Backup',
      "Creating backup", 2);
    return from(exportDB(db))
      .pipe(tap(() => progress.next({index: 2, value: 0, description: "Uploading backup"})),
        mergeMap(blob => {
          let dbFile = this.findExistingDbFile();
          return this.fileUploadService.upload({name: DatabaseBackupAndRestoreService.DB_NAME, blob}, dbFile?.id);
        }),
        tap(httpEvent => this.backgroundTaskService.updateProgress(progress, httpEvent)));
  }

  restore(): Observable<void> {
    let progress = this.backgroundTaskService.showProgress('Automatic restore',
      "Downloading last backup", 2);
    let dbFile = this.findExistingDbFile();
    if (dbFile) {
      let dlLink = FileService.DRIVE_API_FILES_BASE_URL + '/' + dbFile.id + '?alt=media';
      return this.http.get(dlLink, {responseType: "blob", observe: "events", reportProgress: true})
        .pipe(
          filter((e: HttpEvent<any>): e is HttpProgressEvent | HttpResponse<any> =>
            e.type === HttpEventType.DownloadProgress || e.type === HttpEventType.Response),
          tap(event => this.backgroundTaskService.updateProgress(progress, event)),
          last(),
          mergeMap(event => {
            if (event.type === HttpEventType.Response && event.body) {
              return of(event.body);
            } else {
              return of();
            }
          }),
          tap(() => progress.next({index: 2, value: 0, description: 'Importing last backup'})),
          mergeMap(dbDownloadResponse => {
            return from(db.import(dbDownloadResponse, {clearTablesBeforeImport: true}));
          }),
          tap(() => progress.next({index: 2, value: 100})),
          map(() => void 0));
    } else {
      return of();
    }
  }

  private findExistingDbFile() {
    let files = this.filesCacheService.getAll();
    // TODO: ensure there cannot be any conflicts with user files
    return files.filter(f => isFileElement(f))
      .map(f => f as FileElement)
      .find(file => file.name === DatabaseBackupAndRestoreService.DB_NAME)
  }
}
