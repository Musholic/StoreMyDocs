import {Component, EventEmitter, Output} from '@angular/core';
import {FileUploadService} from "./file-upload.service";
import {FileUploadProgress} from "./file-upload-element/file-upload-element.component";
import {HttpEventType} from "@angular/common/http";

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss']
})
export class FileUploadComponent {
  files: FileUploadProgress[] = []

  @Output() onUploadFinish = new EventEmitter<void>()


  constructor(private fileUploadService: FileUploadService) {
  }

  onFileSelected(event: Event) {
    if (event.target) {
      const target = event.target as HTMLInputElement;
      if (target.files) {
        for (const file of target.files) {
          this.upload(file);
        }
      }
    }
  }

  private upload(file: File) {
    let fileProgress: FileUploadProgress = {fileName: file.name, loaded: 0, total: file.size};
    this.files.push(fileProgress);
    this.fileUploadService.upload(file)
      .subscribe(e => {
        if (e.type === HttpEventType.Response) {
          this.onUploadFinish.emit();
        } else {
          fileProgress.loaded = e.loaded;
          if (e.total != null) {
            fileProgress.total = e.total;
          }
        }
      })
  }
}
