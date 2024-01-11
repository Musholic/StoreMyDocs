import {Component} from '@angular/core';
import {FileUploadService, toFileOrBlob} from "./file-upload.service";
import {FileUploadProgress} from "./file-upload-element/file-upload-element.component";
import {HttpEventType} from "@angular/common/http";
import {GooglePickerService} from "./google-picker.service";
import {FilesCacheService} from "../files-cache/files-cache.service";

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss']
})
export class FileUploadComponent {

  files: FileUploadProgress[] = []

  constructor(private fileUploadService: FileUploadService, private googlePickerService: GooglePickerService, private filesCacheService: FilesCacheService) {
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

  async showGooglePicker() {
    this.googlePickerService.show()
      .then(() => this.filesCacheService.refreshCacheAndReload());
  }

  private upload(file: File) {
    let fileProgress: FileUploadProgress = {fileName: file.name, loaded: 0, total: file.size};
    this.files.push(fileProgress);
    this.fileUploadService.upload(toFileOrBlob(file))
      .subscribe(e => {
        if (e.type === HttpEventType.Response) {
          this.filesCacheService.refreshCacheAndReload();
        } else {
          fileProgress.loaded = e.loaded;
          if (e.total != null) {
            fileProgress.total = e.total;
          }
        }
      })
  }
}
