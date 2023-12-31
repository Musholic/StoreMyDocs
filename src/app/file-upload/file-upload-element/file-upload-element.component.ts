import {Component, Input} from '@angular/core';

@Component({
    selector: 'app-file-upload-element',
    templateUrl: './file-upload-element.component.html'
})
export class FileUploadElementComponent {
    @Input({required: true}) fileProgress: FileUploadProgress = {fileName: '??', loaded: 0, total: 0};

    getLoaded() {
      return this.fileProgress.loaded;
    }

    getTotal() {
      return this.fileProgress.total;
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
