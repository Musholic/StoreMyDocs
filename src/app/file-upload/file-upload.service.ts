import {Injectable} from '@angular/core';
import {GoogleDriveAuthService} from "./google-drive-auth.service";
import {HttpClient, HttpEvent, HttpEventType, HttpHeaders, HttpProgressEvent, HttpRequest} from "@angular/common/http";
import {catchError, filter, from, mergeMap, Observable, of} from "rxjs";
import {BaseFolderService} from "./base-folder.service";

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {

  private readonly DRIVE_API_UPLOAD_FILES_BASE_URL = 'https://www.googleapis.com/upload/drive/v3/files';

  constructor(private authService: GoogleDriveAuthService, private http: HttpClient, private baseFolderService: BaseFolderService) {
  }

  upload(file: File): Observable<HttpProgressEvent> {
    const contentType = file.type || 'application/octet-stream';
    let unknownFolder = true;

    return from(this.authService.getApiToken()).pipe(
      mergeMap(accessToken => {
        if (accessToken == null) {
          throw new Error('no api access token!')
        }

        return this.baseFolderService.findOrCreateBaseFolder(accessToken)
          .pipe(mergeMap(baseFolderId => {
            return this.createUploadFileRequest(accessToken, file, contentType, baseFolderId);
          }))
      }),
      mergeMap(metadataRes => {
        const locationUrl = metadataRes.headers.get('Location') ?? '';
        return this.uploadFileToUrl(locationUrl, contentType, file);
      }),
      filter((e: HttpEvent<any>): e is HttpProgressEvent => e.type === HttpEventType.UploadProgress),
      catchError(err => {
        console.log(err)
        return of();
      }))
  }

  private uploadFileToUrl(url: string, contentType: string, file: File) {

    const uploadHeaders = {
      'Content-Type': contentType,
      'X-Upload-Content-Type': contentType
    };
    return this.http.request(new HttpRequest('PUT', url, file, {
      headers: new HttpHeaders(uploadHeaders),
      reportProgress: true
    }))
  }

  private createUploadFileRequest(accessToken: string, file: File, contentType: string, baseFolderId: string) {
    const authHeader = `Bearer ${accessToken}`;

    const metadataHeaders = {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
      'X-Upload-Content-Length': file.size,
      'X-Upload-Content-Type': contentType
    };
    const url = this.DRIVE_API_UPLOAD_FILES_BASE_URL + '?uploadType=resumable';

    const metadata = {
      'name': file.name,
      'parents': [baseFolderId],
      'mimeType': contentType,
      'Content-Type': contentType,
      'Content-Length': file.size,
    };

    return this.http.post<any>(url, metadata, {
      headers: new HttpHeaders(metadataHeaders),
      observe: 'response'
    });
  }
}
