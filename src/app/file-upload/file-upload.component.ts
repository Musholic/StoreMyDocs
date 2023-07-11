import {Component} from '@angular/core';

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss']
})
export class FileUploadComponent {
  fileName = '';

  onFileSelected(event: Event) {
    let file: File;
    if(event.target) {
      const target = event.target as HTMLInputElement;
      if(target.files) {
        file = target.files[0];
        this.fileName = file.name;
      }
    }
  }
}
