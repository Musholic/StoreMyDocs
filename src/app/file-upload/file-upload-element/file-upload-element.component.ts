import {Component, Input} from '@angular/core';
import {filesize} from "filesize";

@Component({
    selector: 'app-file-upload-element',
    templateUrl: './file-upload-element.component.html',
    styleUrls: ['./file-upload-element.component.scss']
})
export class FileUploadElementComponent {
    @Input() fileProgress: FileUploadProgress = {fileName: '??', loaded: 0, total: 0};

    getLoaded() {
        return filesize(this.fileProgress.loaded);
    }

    getTotal() {
        return filesize(this.fileProgress.total);
    }

    getProgress() {
        if (this.fileProgress.total === 0) {
            return 0;
        }
        return (100 * this.fileProgress.loaded) / this.fileProgress.total;
    }

    isComplete() {
        return this.fileProgress.loaded === this.fileProgress.total
    }
}

export interface FileUploadProgress {
    fileName: string;
    loaded: number;
    total: number;
}
