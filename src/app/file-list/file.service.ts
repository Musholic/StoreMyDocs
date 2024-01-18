import {Injectable} from '@angular/core';
import {FileElement, FileOrFolderElement, FolderElement} from "./file-list.component";
import {BehaviorSubject, filter, last, map, mergeMap, Observable, of, tap} from "rxjs";
import {HttpClient, HttpEvent, HttpEventType, HttpProgressEvent, HttpResponse} from "@angular/common/http";
import {BackgroundTaskService, Progress} from "../background-task/background-task.service";

@Injectable({
  providedIn: 'root'
})
export class FileService {
  static readonly BASE_FOLDER_NAME = 'storemydocs.ovh';
  static readonly DRIVE_API_FILES_BASE_URL = 'https://www.googleapis.com/drive/v3/files';

  constructor(private http: HttpClient, private backgroundTaskService: BackgroundTaskService) {
  }

  findOrCreateBaseFolder() {
    return this.findOrCreateFolder(FileService.BASE_FOLDER_NAME);
  }

  /**
   * Return all files managed by the app, except for the base folder
   */
  findAll(): Observable<FileOrFolderElement[]> {
    const url = FileService.DRIVE_API_FILES_BASE_URL + '?q=' + encodeURI("trashed = false") + "&fields=" + encodeURI("files(id,name,createdTime,modifiedTime,size,iconLink,webContentLink,mimeType,parents)");
    return this.http.get<gapi.client.drive.FileList>(url).pipe(map(res => {
      if (res.files) {
        return res.files
          // Filter out the base folder
          .filter(f => f.name !== FileService.BASE_FOLDER_NAME)
          .map(f => {
            if (f.mimeType == 'application/vnd.google-apps.folder') {
              let folderElement: FolderElement = {
                id: f.id ?? '',
                name: f.name ?? '',
                createdTime: new Date(f.createdTime ?? '0'),
                modifiedTime: new Date(f.modifiedTime ?? '0'),
                iconLink: f.iconLink ?? '',
                parentId: f.parents?.[0] ?? ''
              };
              return folderElement;
            } else {
              let fileElement: FileElement = {
                id: f.id ?? '',
                name: f.name ?? '',
                createdTime: new Date(f.createdTime ?? '0'),
                modifiedTime: new Date(f.modifiedTime ?? '0'),
                size: Number(f.size),
                iconLink: f.iconLink ?? '',
                parentId: f.parents?.[0] ?? '',
                dlLink: f.webContentLink ?? '',
                mimeType: f.mimeType ?? ''
              };
              return fileElement;
            }
          })
      } else {
        return []
      }
    }));
  }

  trash(id: string) {
    const url = FileService.DRIVE_API_FILES_BASE_URL + '/' + id
    return this.http.patch<void>(url, {trashed: true});
  }

  setCategory(fileId: string, categoryId: string): Observable<void> {
    const url = FileService.DRIVE_API_FILES_BASE_URL + '/' + fileId + "?addParents=" + categoryId;
    return this.http.patch<void>(url, {});
  }

  findOrCreateFolder(folderName: string, parentId: string | null = null) {
    return this.findFolder(folderName, parentId).pipe(mergeMap(baseId => {
      if (baseId) {
        return of(baseId);
      } else {
        return this.createFolder(folderName, parentId);
      }
    }))
  }

  downloadFile(fileElement: FileElement, progress: BehaviorSubject<Progress>): Observable<Blob> {
    let dlLink = FileService.DRIVE_API_FILES_BASE_URL + '/' + fileElement.id + '?alt=media';
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
        }));
  }

  private findFolder(folderName: string, parentId: string | null) {
    let query = "trashed=false and mimeType='application/vnd.google-apps.folder' and name='" + folderName + "'";
    if (parentId) {
      query += " and '" + parentId + "' in parents";
    }
    const url = FileService.DRIVE_API_FILES_BASE_URL + '?q=' + encodeURI(query);
    return this.http.get<gapi.client.drive.FileList>(url).pipe(map(res => {
      if (res.files && res.files.length > 0) {
        return res.files[0].id;
      }
      return undefined;
    }));
  }

  private createFolder(folderName: string, parentId: string | null) {
    let metadata: any = {
      'name': folderName,
      'mimeType': 'application/vnd.google-apps.folder'
    };
    if (parentId) {
      metadata['parents'] = [parentId];
    }
    const url = FileService.DRIVE_API_FILES_BASE_URL;

    return this.http.post<gapi.client.drive.File>(url, metadata)
      .pipe(map(res => {
        if (!res.id) {
          throw new Error('Error creating base folder');
        }
        return res.id;
      }))
  }

}
