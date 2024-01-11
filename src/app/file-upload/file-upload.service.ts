import {Injectable} from '@angular/core';
import {
  HttpClient,
  HttpEvent,
  HttpEventType,
  HttpHeaders,
  HttpProgressEvent,
  HttpRequest,
  HttpResponse
} from "@angular/common/http";
import {catchError, filter, mergeMap, Observable, of} from "rxjs";
import {FilesCacheService} from "../files-cache/files-cache.service";

export interface FileOrBlob {
  name: string;
  blob: Blob;
}

export function toFileOrBlob(file: File) {
  return {
    name: file.name,
    blob: file
  }
}

@Injectable()
export class FileUploadService {

  private readonly DRIVE_API_UPLOAD_FILES_BASE_URL = 'https://www.googleapis.com/upload/drive/v3/files';

  constructor(private http: HttpClient, private filesCacheService: FilesCacheService) {
  }

  upload(file: FileOrBlob, fileId?: string): Observable<HttpProgressEvent | HttpResponse<any>> {
    const contentType = file.blob.type || 'application/octet-stream';

    let baseFolderId = this.filesCacheService.getBaseFolder();
    return this.createUploadFileRequest(file, contentType, baseFolderId, fileId).pipe(
      mergeMap(metadataRes => {
        const locationUrl = metadataRes.headers.get('Location') ?? '';
        return this.uploadFileToUrl(locationUrl, contentType, file);
      }),
      filter((e: HttpEvent<any>): e is HttpProgressEvent | HttpResponse<any> => e.type === HttpEventType.UploadProgress || e.type === HttpEventType.Response),
      catchError(err => {
        console.log(err)
        return of();
      }))
  }

  private uploadFileToUrl(url: string, contentType: string, file: FileOrBlob) {

    const uploadHeaders = {
      'Content-Type': contentType,
      'X-Upload-Content-Type': contentType
    };
    return this.http.request(new HttpRequest('PUT', url, file.blob, {
      headers: new HttpHeaders(uploadHeaders),
      reportProgress: true
    }))
  }

  private createUploadFileRequest(file: FileOrBlob, contentType: string, baseFolderId: string, fileId?: string) {

    const metadataHeaders = {
      'X-Upload-Content-Length': file.blob.size,
      'X-Upload-Content-Type': contentType
    };
    let url = this.DRIVE_API_UPLOAD_FILES_BASE_URL;
    if (fileId) {
      url += '/' + fileId;
    }
    url += '?uploadType=resumable';

    let metadata: any = {
      'Content-Type': contentType,
      'Content-Length': file.blob.size,
    };

    if (fileId) {
      return this.http.patch<any>(url, metadata, {
        headers: new HttpHeaders(metadataHeaders),
        observe: 'response'
      });
    } else {
      metadata.name = file.name;
      metadata.parents = [baseFolderId];
      metadata.mimeType = contentType;

      return this.http.post<any>(url, metadata, {
        headers: new HttpHeaders(metadataHeaders),
        observe: 'response'
      });
    }
  }
}
