import {Injectable} from '@angular/core';
import {GoogleDriveAuthService} from "./google-drive-auth.service";
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {catchError, from, mergeMap, of} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {

  constructor(private authService: GoogleDriveAuthService, private http: HttpClient) {
  }

  upload(file: File) {
    console.log('Uploading ' + file.name)
    const contentType = file.type || 'application/octet-stream';

    return from(this.authService.getAccessToken()).pipe(
      mergeMap(accessToken => {
        const authHeader = `Bearer ${accessToken}`;

        const metadataHeaders = {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
          'X-Upload-Content-Length': file.size,
          'X-Upload-Content-Type': contentType
        };
        const url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable';

        const metadata = {
          'name': file.name,
          'mimeType': contentType,
          'Content-Type': contentType,
          'Content-Length': file.size,
        };

        return this.http.post<any>(url, metadata, {
          headers: new HttpHeaders(metadataHeaders),
          observe: 'response'
        });
      }),
      mergeMap(metadataRes => {
        const locationUrl = metadataRes.headers.get('Location') || '';

        const uploadHeaders = {
          'Content-Type': contentType,
          'X-Upload-Content-Type': contentType
        };
        const uploadOptions = {headers: new HttpHeaders(uploadHeaders)};

        return this.http.put(locationUrl, file, uploadOptions)
      }),
      catchError(err => {
        console.log(err)
        return of();
      }))
  }
}
