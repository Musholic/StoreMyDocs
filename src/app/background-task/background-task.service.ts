import {Component, Injectable} from '@angular/core';
import {BehaviorSubject} from "rxjs";
import {MatSnackBar, MatSnackBarModule, MatSnackBarRef} from "@angular/material/snack-bar";
import {NgForOf, NgIf} from "@angular/common";
import {HttpEventType, HttpProgressEvent, HttpResponse} from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class BackgroundTaskService {

  private snackBarRef?: MatSnackBarRef<SnackBarProgressIndicatorComponent>;

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

    this.showSnackBar();

    if (this.snackBarRef) {
      this.snackBarRef.instance.addProgressData(progressData)
    }

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

  private showSnackBar() {
    if (!this.snackBarRef) {
      this.snackBarRef = this.snackBar.openFromComponent(SnackBarProgressIndicatorComponent);
    }
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
    NgIf,
    NgForOf
  ]
})
class SnackBarProgressIndicatorComponent {
  public dataList: ProgressData[] = [];
  private isEmpty = true;

  constructor(private snackBarRef: MatSnackBarRef<SnackBarProgressIndicatorComponent>) {
  }

  getTotalProgress(data: ProgressData) {
    return Math.floor(((data.progress.value.index - 1) * 100 + data.progress.value.value) / data.stepAmount);
  }

  isFinished(data: ProgressData) {
    return data.progress.value.index === data.stepAmount && data.progress.value.value === 100;
  }

  public addProgressData(progressData: ProgressData) {
    let initialProgress = progressData.progress.value;
    this.dataList.push(progressData);
    if (initialProgress.description) {
      this.isEmpty = false;
    }
    progressData.progress.subscribe(progress => {
      if (this.isFinished(progressData)) {
        if (this.isEmpty) {
          this.removeProgressData(progressData);
        } else {
          setTimeout(() => {
            this.removeProgressData(progressData);
          }, 3000);
        }
      } else if (progress.description) {
        this.isEmpty = false;
      }
    })
  }

  private dismissIfEmpty() {
    if (this.dataList.length === 0) {
      this.snackBarRef.dismiss();
    }
  }

  private removeProgressData(progressData: ProgressData) {
    let index = this.dataList.indexOf(progressData);
    if (index > -1) {
      this.dataList.splice(index, 1)
    }
    this.dismissIfEmpty();
  }
}
