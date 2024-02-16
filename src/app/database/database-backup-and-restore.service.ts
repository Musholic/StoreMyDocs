import {Injectable} from '@angular/core';
import {exportDB} from "dexie-export-import";
import {db} from "./db";
import {FileUploadService} from "../file-upload/file-upload.service";
import {finalize, from, map, mergeMap, Observable, of, tap} from "rxjs";
import {FileService} from "../file-list/file.service";
import {FileElement, isFileElement} from "../file-list/file-list.component";
import {BackgroundTaskService} from "../background-task/background-task.service";
import {FilesCacheService} from "../files-cache/files-cache.service";
import JSZip from "jszip";
import {fromPromise} from "rxjs/internal/observable/innerFrom";

@Injectable()
export class DatabaseBackupAndRestoreService {


  private static readonly LAST_DB_BACKUP_TIME = 'last_db_backup_time';
  private static readonly DB_NAME = 'db.backup';

  constructor(private fileUploadService: FileUploadService, private fileService: FileService,
              private backgroundTaskService: BackgroundTaskService, private filesCacheService: FilesCacheService) {
  }

  backup() {
    const progress = this.backgroundTaskService.showProgress('Backup', 3, "Creating backup");
    return from(exportDB(db))
      .pipe(
        tap(() => progress.next({index: 2, value: 0, description: "Compressing backup"})),
        mergeMap(blob => {
          const zip = new JSZip();
          zip.file("db.backup", blob);
          return fromPromise(zip.generateAsync({
            type: "blob",
            compression: "DEFLATE"
          }));
        }),
        tap(() => progress.next({index: 3, value: 0, description: "Uploading backup"})),
        mergeMap(blob => {
          const dbFile = this.findExistingDbFile();
          return this.fileUploadService.upload({name: DatabaseBackupAndRestoreService.DB_NAME, blob}, dbFile?.id);
        }),
        tap(httpEvent => this.backgroundTaskService.updateProgress(progress, httpEvent)),
        finalize(() => this.updateLastDbBackupTime()),
        map(() => {
        }));
  }

  scheduleBackup() {
    this.backgroundTaskService.schedule("backupDatabase", () => this.backup());
  }

  restore(): Observable<void> {
    const dbFile = this.findExistingDbFile();
    const lastDbBackupTime = this.getLastDbBackupTime();
    const modifiedTime = dbFile?.modifiedTime ?? Date.now();
    if (dbFile && modifiedTime > lastDbBackupTime) {
      const progress = this.backgroundTaskService.showProgress('Automatic restore', 3, "Downloading last backup");
      return this.fileService.downloadFile(dbFile, progress)
        .pipe(
          tap(() => progress.next({index: 2, value: 0, description: 'Extracting last backup'})),
          mergeMap(dbDownloadResponse => {
            const zip = new JSZip();
            return fromPromise(zip.loadAsync(dbDownloadResponse).then(value => {
              return value.file("db.backup")?.async("blob");
            }));
          }),
          tap(() => progress.next({index: 3, value: 0, description: 'Importing last backup'})),
          mergeMap(dbBlob => {
            if (!dbBlob) {
              return of();
            }
            return from(db.import(dbBlob, {clearTablesBeforeImport: true}));
          }),
          tap(() => progress.next({index: 3, value: 100})),
          map(() => void 0),
          finalize(() => this.updateLastDbBackupTime())
        );
    } else {
      return of(undefined);
    }
  }

  private getLastDbBackupTime() {
    const lastDbBackupTime = localStorage.getItem(DatabaseBackupAndRestoreService.LAST_DB_BACKUP_TIME);
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
    const files = this.filesCacheService.getAll();
    // TODO: ensure there cannot be any conflicts with user files
    return files.filter(f => isFileElement(f))
      .map(f => f as FileElement)
      .find(file => file.name === DatabaseBackupAndRestoreService.DB_NAME)
  }
}
