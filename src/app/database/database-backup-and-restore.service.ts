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
  private static readonly BACKUP_DELAY = 5_000;
  private static backupScheduled = false;

  constructor(private fileUploadService: FileUploadService, private fileService: FileService,
              private backgroundTaskService: BackgroundTaskService, private filesCacheService: FilesCacheService) {
  }

  backup() {
    let progress = this.backgroundTaskService.showProgress('Backup', 3, "Creating backup");
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
          let dbFile = this.findExistingDbFile();
          return this.fileUploadService.upload({name: DatabaseBackupAndRestoreService.DB_NAME, blob}, dbFile?.id);
        }),
        tap(httpEvent => this.backgroundTaskService.updateProgress(progress, httpEvent)),
        finalize(() => this.updateLastDbBackupTime()));
  }

  scheduleBackup() {
    if (!DatabaseBackupAndRestoreService.backupScheduled) {
      DatabaseBackupAndRestoreService.backupScheduled = true;

      setTimeout(() => {
        DatabaseBackupAndRestoreService.backupScheduled = false;
        this.backup().subscribe();
      }, DatabaseBackupAndRestoreService.BACKUP_DELAY);
    }
  }

  restore(): Observable<void> {
    let dbFile = this.findExistingDbFile();
    let lastDbBackupTime = this.getLastDbBackupTime();
    let modifiedTime = dbFile?.modifiedTime ?? Date.now();
    if (dbFile && modifiedTime > lastDbBackupTime) {
      let progress = this.backgroundTaskService.showProgress('Automatic restore', 3, "Downloading last backup");
      return this.fileService.downloadFile(dbFile, progress)
        .pipe(
          tap(() => progress.next({index: 2, value: 0, description: 'Extracting last backup'})),
          mergeMap(dbDownloadResponse => {
            let zip = new JSZip();
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
