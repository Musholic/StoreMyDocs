import {Component, Injectable} from '@angular/core';
import {BehaviorSubject, mergeMap, Observable, of, share} from "rxjs";
import {MatSnackBar, MatSnackBarModule, MatSnackBarRef} from "@angular/material/snack-bar";
import {NgForOf, NgIf} from "@angular/common";
import {HttpEventType, HttpProgressEvent, HttpResponse} from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class BackgroundTaskService {

  private snackBarRef?: MatSnackBarRef<SnackBarProgressIndicatorComponent>;
  private readonly scheduledTasks = new Set<string>();
  private readonly runningTasks = new Map<string, Observable<void>>();

  constructor(private snackBar: MatSnackBar) {
  }

  showProgress(globalDescription: string, stepAmount: number, stepDescription?: string): BehaviorSubject<Progress> {
    const progress = new BehaviorSubject<Progress>({
      index: 1,
      value: 0,
      description: stepDescription,
    });

    const progressData: ProgressData = {
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
    const lastProgress = progress.getValue();
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

  isEmpty() {
    if (this.snackBarRef) {
      // A message is shown, but we must check if the task are already finished
      return this.snackBarRef.instance.isAllTaskFinished();
    }
    return true;
  }

  schedule(taskName: string, task: () => Observable<void>): void {
    const alreadyScheduledTask = this.scheduledTasks.has(taskName);
    if (alreadyScheduledTask) {
      return;
    }

    let alreadyRunningTask = this.runningTasks.get(taskName);
    if (!alreadyRunningTask) {
      // Initialize the running task with an already finished one for simplicity
      alreadyRunningTask = of(undefined);
    }
    const scheduledTask = alreadyRunningTask.pipe(mergeMap(() => {
      const runningTask = task()
        // Multicast the result to all future subscribers since we don't want to rerun the task once for each subscriber
        .pipe(share());
      this.runningTasks.set(taskName, runningTask);
      this.scheduledTasks.delete(taskName);
      return runningTask;
    }));
    this.scheduledTasks.add(taskName);
    scheduledTask.subscribe();
  }

  private showSnackBar() {
    if (!this.snackBarRef) {
      this.snackBarRef = this.snackBar.openFromComponent(SnackBarProgressIndicatorComponent);
      this.snackBarRef.afterDismissed()
        .subscribe(() => {
          this.snackBarRef = undefined;
        });
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

  constructor(private snackBarRef: MatSnackBarRef<SnackBarProgressIndicatorComponent>) {
  }

  getTotalProgress(data: ProgressData) {
    const totalProgress = Math.floor(((data.progress.value.index - 1) * 100 + data.progress.value.value) / data.stepAmount);
    return totalProgress + '%';
  }

  isFinished(data: ProgressData) {
    return data.progress.value.index === data.stepAmount && data.progress.value.value === 100;
  }

  public addProgressData(progressData: ProgressData) {
    const initialProgress = progressData.progress.value;
    this.dataList.push(progressData);
    let isEmpty = !initialProgress.description;

    progressData.progress.subscribe(progress => {
      if (this.isFinished(progressData)) {
        if (isEmpty) {
          this.removeProgressData(progressData);
        } else {
          setTimeout(() => {
            this.removeProgressData(progressData);
          }, 3000);
        }
      } else if (progress.description) {
        isEmpty = false;
      }
    })
  }


  isAllTaskFinished() {
    return this.dataList.every(this.isFinished);
  }

  private dismissIfEmpty() {
    if (this.dataList.length === 0) {
      this.snackBarRef.dismiss();
    }
  }

  private removeProgressData(progressData: ProgressData) {
    const index = this.dataList.indexOf(progressData);
    if (index > -1) {
      this.dataList.splice(index, 1)
    }
    this.dismissIfEmpty();
  }
}
