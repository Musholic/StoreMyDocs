import {Injectable} from '@angular/core';
import {exportDB} from "dexie-export-import";
import {db} from "./db";
import {FileUploadService} from "../file-upload/file-upload.service";
import {finalize, from, map, mergeMap, Observable, of, tap} from "rxjs";
import {FileService} from "../file-list/file.service";
import {FileElement, isFileElement} from "../file-list/file-list.component";
import {BackgroundTaskService} from "../background-task/background-task.service";
import {FilesCacheService} from "../files-cache/files-cache.service";

@Injectable()
export class DatabaseBackupAndRestoreService {


  private static readonly LAST_DB_BACKUP_TIME = 'last_db_backup_time';
  private static readonly DB_NAME = 'db.backup';

  constructor(private fileUploadService: FileUploadService, private fileService: FileService,
              private backgroundTaskService: BackgroundTaskService, private filesCacheService: FilesCacheService) {
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
        tap(httpEvent => this.backgroundTaskService.updateProgress(progress, httpEvent)),
        finalize(() => this.updateLastDbBackupTime()));
  }

  restore(): Observable<void> {
    let dbFile = this.findExistingDbFile();
    let lastDbBackupTime = this.getLastDbBackupTime();
    let modifiedTime = dbFile?.modifiedTime ?? Date.now();
    if (dbFile && modifiedTime > lastDbBackupTime) {
      let progress = this.backgroundTaskService.showProgress('Automatic restore',
        "Downloading last backup", 2);
      return this.fileService.downloadFile(dbFile, progress)
        .pipe(
          tap(() => progress.next({index: 2, value: 0, description: 'Importing last backup'})),
          mergeMap(dbDownloadResponse => {
            return from(db.import(dbDownloadResponse, {clearTablesBeforeImport: true}));
          }),
          tap(() => progress.next({index: 2, value: 100})),
          map(() => void 0),
          finalize(() => this.updateLastDbBackupTime())
        );
    } else {
      return of();
    }
  }

  private getLastDbBackupTime() {
    let lastDbBackupTime = localStorage.getItem(DatabaseBackupAndRestoreService.LAST_DB_BACKUP_TIME);
    if (lastDbBackupTime) {
      return new Date(lastDbBackupTime);
    } else {
      // No backup so we return an arbitrary old value
      return new Date(0);
    }
  }

  private updateLastDbBackupTime() {
    localStorage.setItem(DatabaseBackupAndRestoreService.LAST_DB_BACKUP_TIME, new Date().toISOString());
  }

  private findExistingDbFile() {
    let files = this.filesCacheService.getAll();
    // TODO: ensure there cannot be any conflicts with user files
    return files.filter(f => isFileElement(f))
      .map(f => f as FileElement)
      .find(file => file.name === DatabaseBackupAndRestoreService.DB_NAME)
  }
}
