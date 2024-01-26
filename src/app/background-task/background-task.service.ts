import {Component, Inject, Injectable} from '@angular/core';
import {BehaviorSubject} from "rxjs";
import {MAT_SNACK_BAR_DATA, MatSnackBar, MatSnackBarModule, MatSnackBarRef} from "@angular/material/snack-bar";
import {NgIf} from "@angular/common";
import {HttpEventType, HttpProgressEvent, HttpResponse} from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class BackgroundTaskService {

  constructor(private snackBar: MatSnackBar) {
  }

  showProgress(globalDescription: string, stepAmount: number, stepDescription?: string): BehaviorSubject<Progress> {
    let progress = new BehaviorSubject<Progress>({
      index: 1,
      value: 0,
      description: stepDescription,
    });

    let progressData: ProgressData = {
      globalDescription: globalDescription,
      stepAmount: stepAmount,
      progress: progress
    };
    this.openSnackBar(progressData);

    return progress;
  }

  updateProgress(progress: BehaviorSubject<Progress>, httpEvent: HttpProgressEvent | HttpResponse<any>) {
    let lastProgress = progress.getValue();
    if ((httpEvent.type === HttpEventType.DownloadProgress || httpEvent.type === HttpEventType.UploadProgress) && httpEvent.total) {
      progress.next({
        index: lastProgress.index,
        value: (httpEvent.loaded * 100) / httpEvent.total,
        description: lastProgress.description
      })
    } else if (httpEvent.type === HttpEventType.Response) {
      progress.next({
        index: lastProgress.index,
        value: 100,
        description: lastProgress.description
      })
    }
  }

  private openSnackBar(data: ProgressData) {
    return this.snackBar.openFromComponent(SnackBarProgressIndicatorComponent, {data: data});
  }
}

interface ProgressData {
  globalDescription: string;
  stepAmount: number;
  progress: BehaviorSubject<Progress>
}

export interface Progress {
  index: number;
  /**
   * Percentage progress in percent, when it reaches 100, the associated message will be dismissed automatically
   */
  value: number
  /**
   * No description when the tasks are finished
   */
  description?: string,
}

@Component({
  selector: 'app-progress-indicator-snack-bar',
  templateUrl: 'progress-indicator.snack-bar.html',
  styleUrls: ['./progress-indicator.snack-bar.scss'],
  standalone: true,
  imports: [
    MatSnackBarModule,
    NgIf
  ]
})
class SnackBarProgressIndicatorComponent {
  progress: Progress;

  constructor(@Inject(MAT_SNACK_BAR_DATA) public data: ProgressData, snackBarRef: MatSnackBarRef<SnackBarProgressIndicatorComponent>) {
    this.progress = data.progress.getValue();

    data.progress.subscribe(progress => {
      let noStepYet = !this.progress.description;
      this.progress = progress;
      if (this.isFinished()) {
        if (noStepYet) {
          // There was no step, and it's already finished,
          // we can simply dismiss the message since there is actually nothing to inform the users about
          snackBarRef.dismiss();
        } else {
          // The user must see that something happened
          snackBarRef._dismissAfter(3000);
        }
      }
    })
  }

  getTotalProgress() {
    return Math.floor(((this.progress.index - 1) * 100 + this.progress.value) / this.data.stepAmount);
  }

  isFinished() {
    return this.progress.index === this.data.stepAmount && this.progress.value === 100;
  }
}
