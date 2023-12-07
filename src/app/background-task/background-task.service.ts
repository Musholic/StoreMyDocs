import {Component, Inject, Injectable} from '@angular/core';
import {BehaviorSubject} from "rxjs";
import {MAT_SNACK_BAR_DATA, MatSnackBar, MatSnackBarModule, MatSnackBarRef} from "@angular/material/snack-bar";
import {NgIf} from "@angular/common";
import {HttpProgressEvent, HttpResponse} from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class BackgroundTaskService {

  constructor(private snackBar: MatSnackBar) {
  }

  showProgress(globalDescription: string, stepDescription: string, stepAmount: number): BehaviorSubject<Progress> {
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

  constructor(@Inject(MAT_SNACK_BAR_DATA) public data: ProgressData, private snackBarRef: MatSnackBarRef<SnackBarProgressIndicatorComponent>) {
    this.progress = data.progress.getValue();

    data.progress.subscribe(progress => {
      this.progress = progress;
      if (progress.value === 100) {
        snackBarRef._dismissAfter(3000);
      }
    })
  }
}
