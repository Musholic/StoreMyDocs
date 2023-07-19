import {Component} from '@angular/core';
import {FileUploadService} from "./file-upload.service";
import {FileUploadProgress} from "./file-upload-element/file-upload-element.component";

@Component({
    selector: 'app-file-upload',
    templateUrl: './file-upload.component.html',
    styleUrls: ['./file-upload.component.scss']
})
export class FileUploadComponent {
    files: FileUploadProgress[] = []


    constructor(private fileUploadService: FileUploadService) {
    }

    onFileSelected(event: Event) {
        if (event.target) {
            const target = event.target as HTMLInputElement;
            if (target.files) {
                for (const file of target.files) {
                    let fileProgress: FileUploadProgress = {fileName: file.name, loaded: 0, total: file.size};
                    this.files.push(fileProgress);
                    this.fileUploadService.upload(file)
                        .subscribe(e => {
                            fileProgress.loaded = e.loaded;
                            if (e.total != null) {
                                fileProgress.total = e.total;
                            }
                        })
                }
            }
        }
    }
}
