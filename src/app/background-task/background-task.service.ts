import {Component, Inject, Injectable} from '@angular/core';
import {Observable} from "rxjs";
import {HttpEventType, HttpProgressEvent, HttpResponse} from "@angular/common/http";
import {MAT_SNACK_BAR_DATA, MatSnackBar, MatSnackBarModule} from "@angular/material/snack-bar";

@Injectable({
  providedIn: 'root'
})
export class BackgroundTaskService {

  constructor(private snackBar: MatSnackBar) {
  }

  showProgress(observable: Observable<HttpProgressEvent | HttpResponse<any>>): void {
    let progressData = {progress: 0};
    this.openSnackBar(progressData);

    observable.subscribe(value => {
      if (value.type === HttpEventType.UploadProgress && value.total) {
        progressData.progress = (100 * value.loaded) / value.total
      }
    })
  }

  private openSnackBar(data: ProgressData) {
    return this.snackBar.openFromComponent(SnackBarProgressIndicatorComponent, {data: data});
  }
}

interface ProgressData {
  progress: number
}

@Component({
  selector: 'app-progress-indicator-snack-bar',
  templateUrl: 'progress-indicator.snack-bar.html',
  styleUrls: ['./progress-indicator.snack-bar.scss'],
  standalone: true,
  imports: [
    MatSnackBarModule
  ]
})
class SnackBarProgressIndicatorComponent {
  constructor(@Inject(MAT_SNACK_BAR_DATA) public data: ProgressData) {
  }
}
