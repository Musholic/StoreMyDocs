import {Injectable} from '@angular/core';
import {FileElement, FileOrFolderElement, FolderElement} from "./file-list.component";
import {map, mergeMap, Observable, of} from "rxjs";
import {BaseFolderService} from "../file-upload/base-folder.service";
import {HttpClient} from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class FileService {

  constructor(private http: HttpClient) {
  }

  findAll(): Observable<FileOrFolderElement[]> {
    const url = BaseFolderService.DRIVE_API_FILES_BASE_URL + '?q=' + encodeURI("trashed = false") + "&fields=" + encodeURI("files(id,name,createdTime,size,iconLink,webContentLink,mimeType,parents)");
    return this.http.get<gapi.client.drive.FileList>(url).pipe(map(res => {
      if (res.files) {
        return res.files.map(f => {
          if (f.mimeType == 'application/vnd.google-apps.folder') {
            return {
              id: f.id,
              name: f.name,
              date: f.createdTime,
              iconLink: f.iconLink,
              parentId: f.parents?.[0]
            } as FolderElement;
          } else {
            return {
              id: f.id,
              name: f.name,
              date: f.createdTime,
              size: Number(f.size),
              iconLink: f.iconLink,
              parentId: f.parents?.[0],
              dlLink: f.webContentLink
            } as FileElement;
          }
        })
      } else {
        return []
      }
    }));
  }

  trash(id: string) {
    const url = BaseFolderService.DRIVE_API_FILES_BASE_URL + '/' + id
    return this.http.patch<void>(url, {trashed: true});
  }

  setCategory(fileId: string, categoryId: string): Observable<void> {
    const url = BaseFolderService.DRIVE_API_FILES_BASE_URL + '/' + fileId + "?addParents=" + categoryId;
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

  private findFolder(folderName: string, parentId: string | null) {
    let query = "mimeType='application/vnd.google-apps.folder' and name='" + folderName + "'";
    if (parentId) {
      query += " and '" + parentId + "' in parents";
    }
    const url = BaseFolderService.DRIVE_API_FILES_BASE_URL + '?q=' + encodeURI(query);
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
    const url = BaseFolderService.DRIVE_API_FILES_BASE_URL;

    return this.http.post<gapi.client.drive.File>(url, metadata)
      .pipe(map(res => {
        if (!res.id) {
          throw new Error('Error creating base folder');
        }
        return res.id;
      }))
  }

}
