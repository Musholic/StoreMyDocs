import {Component} from '@angular/core';
import {FileUploadService} from "./file-upload.service";

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss']
})
export class FileUploadComponent {
  fileName = '';
  constructor(private fileUploadService: FileUploadService) {
  }

  onFileSelected(event: Event) {
    let file: File;
    if(event.target) {
      const target = event.target as HTMLInputElement;
      if(target.files) {
        file = target.files[0];
        this.fileName = file.name;
        this.fileUploadService.upload(file);
        return;
      }
    }
    console.error('No file chosen.');
  }
}
