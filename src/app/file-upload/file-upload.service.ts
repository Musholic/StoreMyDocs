import {Injectable} from '@angular/core';
import {GoogleDriveAuthService} from "./google-drive-auth.service";

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {

  constructor(private authService: GoogleDriveAuthService) {
  }

  upload(file: File) {
    console.log('Uploading ' + file.name)
    this.authService.auth().then(() => {
      console.log('TODO')
    }).catch(error => {
      console.log(error);
    })
  }
}
