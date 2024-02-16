import {BackgroundTaskService, Progress} from './background-task.service';
import {mock} from "strong-mock";
import {MockBuilder, MockInstance, MockRender} from "ng-mocks";
import {AppModule} from "../app.module";
import {MatSnackBarModule} from "@angular/material/snack-bar";
import {fakeAsync, flush, tick} from "@angular/core/testing";
import {BrowserAnimationsModule, NoopAnimationsModule} from "@angular/platform-browser/animations";
import {BehaviorSubject, delay, map, of} from "rxjs";
import {HttpDownloadProgressEvent, HttpEventType, HttpResponse, HttpUploadProgressEvent} from "@angular/common/http";
import {mustBeConsumedAsyncObservable} from "../../testing/common-testing-function.spec";

describe('BackgroundTaskService', () => {
  beforeEach(() => MockBuilder(BackgroundTaskService, AppModule)
    .keep(MatSnackBarModule)
    .replace(BrowserAnimationsModule, NoopAnimationsModule)
  );

  it('should be created', () => {
    // Act
    const backgroundTaskService = MockRender(BackgroundTaskService).point.componentInstance;

    // Assert
    expect(backgroundTaskService).toBeTruthy();
  });

  describe('showProgress', () => {
    it('Should show initial 0 progress', async () => {
      // Arrange
      const fixture = MockRender(BackgroundTaskService);
      const backgroundTaskService = fixture.point.componentInstance;

      // Act
      backgroundTaskService.showProgress("Test", 2, "Doing first test");

      // Assert
      fixture.detectChanges();
      const result = await Page.getProgressMessage();
      expect(result).toEqual("1/2 0% Test: Doing first test...");
    })

    it('Should show in progress', async () => {
      // Arrange
      const fixture = MockRender(BackgroundTaskService);
      const backgroundTaskService = fixture.point.componentInstance;
      const progress = backgroundTaskService.showProgress("Test", 4, "Doing first test");

      // Act
      progress.next({
        index: 2,
        value: 50,
        description: "Doing more test"
      })

      // Assert
      fixture.detectChanges();
      const result = await Page.getProgressMessage();
      expect(result).toEqual("2/4 37% Test: Doing more test...");
    })

    it('Should show as completed and should dismiss after 3s', fakeAsync(async () => {
      // Arrange
      const fixture = MockRender(BackgroundTaskService);
      const page = new Page();
      const backgroundTaskService = fixture.point.componentInstance;
      const progress = backgroundTaskService.showProgress("Test", 2, "Doing first test");

      // Act
      progress.next({
        index: 2,
        value: 100
      })

      // Assert
      fixture.detectChanges();
      tick();
      let resultMessage = await Page.getProgressMessage();
      expect(resultMessage).toEqual("2/2 100% Test finished!");
      tick(3000);
      // The message should be gone after 3 seconds
      resultMessage = await Page.getProgressMessage();
      expect(resultMessage).toEqual(undefined);
    }))

    it('Should dismiss immediately if it finished with no actual step', fakeAsync(async () => {
      // Arrange
      const fixture = MockRender(BackgroundTaskService);
      const page = new Page();
      const backgroundTaskService = fixture.point.componentInstance;
      const progress = backgroundTaskService.showProgress("Test", 2);

      // Act
      progress.next({
        index: 2,
        value: 100
      })

      // Assert
      fixture.detectChanges();
      tick();
      const resultMessage = await Page.getProgressMessage();
      expect(resultMessage).toEqual(undefined);
    }))

    it('Should support showing a second ongoing task', async () => {
      // Arrange
      const fixture = MockRender(BackgroundTaskService);
      const backgroundTaskService = fixture.point.componentInstance;
      const progress1 = backgroundTaskService.showProgress("Test", 4, "Doing first test");
      fixture.detectChanges();

      // Act
      const progress2 = backgroundTaskService.showProgress("Second test", 2, "Starting second test");
      progress1.next({
        index: 2,
        value: 50,
        description: "Doing more test"
      })
      progress2.next({
        index: 1,
        value: 50,
        description: "Doing second test"
      })

      // Assert
      fixture.detectChanges();
      const result = await Page.getProgressMessage();
      expect(result).toEqual("2/4 37% Test: Doing more test...1/2 25% Second test: Doing second test...");
    })

    it('Should support hiding the first ongoing task and still showing the second ongoing task', fakeAsync(async () => {
      // Arrange
      const fixture = MockRender(BackgroundTaskService);
      const backgroundTaskService = fixture.point.componentInstance;
      const progress1 = backgroundTaskService.showProgress("Test", 4, "Doing first test");
      fixture.detectChanges();

      // Act
      backgroundTaskService.showProgress("Second test", 2, "Starting second test");
      progress1.next({
        index: 4,
        value: 100
      })

      // Assert
      fixture.detectChanges();
      tick(3000);
      fixture.detectChanges();
      const result = await Page.getProgressMessage();
      expect(result).toEqual("1/2 0% Second test: Starting second test...");
    }))

    it('Should start showing a second task progress after the first task finished', fakeAsync(async () => {
      // Arrange
      const fixture = MockRender(BackgroundTaskService);
      const backgroundTaskService = fixture.point.componentInstance;
      // Task with no actual step to show which is dismissed immediately
      const progress1 = backgroundTaskService.showProgress("Test", 4);
      progress1.next({
        index: 4,
        value: 100
      });
      tick();

      // Act
      backgroundTaskService.showProgress("Second test", 2, "Starting second test");

      // Assert
      tick();
      fixture.detectChanges();
      const result = await Page.getProgressMessage();
      expect(result).toEqual("1/2 0% Second test: Starting second test...");
      flush();
    }))

    it('Should not show message for a second task finishing before the first and with no actual step', fakeAsync(async () => {
      // Arrange
      const fixture = MockRender(BackgroundTaskService);
      const backgroundTaskService = fixture.point.componentInstance;
      backgroundTaskService.showProgress("Test", 4, "Doing first test");
      fixture.detectChanges();
      const progress2 = backgroundTaskService.showProgress("Second test", 2);

      // Act
      // Finish the second task with no actual step
      progress2.next({
        index: 2,
        value: 100
      })

      // Assert
      fixture.detectChanges();
      const result = await Page.getProgressMessage();
      expect(result).toEqual("1/4 0% Test: Doing first test...");
      flush();
    }))
  })
  describe('updateProgress', () => {
    it('Should update progress with intermediate download progress event', () => {
      // Arrange
      const backgroundTaskService = MockRender(BackgroundTaskService).point.componentInstance;
      const progress = new BehaviorSubject<Progress>({
        index: 2,
        value: 0,
        description: "Testing download"
      });

      const httpEvent: HttpDownloadProgressEvent = {
        type: HttpEventType.DownloadProgress,
        loaded: 50,
        total: 200
      };

      // Act
      backgroundTaskService.updateProgress(progress, httpEvent)

      // Assert
      expect(progress.getValue()).toEqual({
        index: 2,
        value: 25,
        description: "Testing download"
      });
    });

    it('Should update progress with intermediate upload progress event', () => {
      // Arrange
      const backgroundTaskService = MockRender(BackgroundTaskService).point.componentInstance;
      const progress = new BehaviorSubject<Progress>({
        index: 2,
        value: 0,
        description: "Testing download"
      });

      const httpEvent: HttpUploadProgressEvent = {
        type: HttpEventType.UploadProgress,
        loaded: 50,
        total: 200
      };

      // Act
      backgroundTaskService.updateProgress(progress, httpEvent)

      // Assert
      expect(progress.getValue()).toEqual({
        index: 2,
        value: 25,
        description: "Testing download"
      });
    });

    it('Should update progress with response event', () => {
      // Arrange
      const backgroundTaskService = MockRender(BackgroundTaskService).point.componentInstance;
      const progress = new BehaviorSubject<Progress>({
        index: 2,
        value: 0,
        description: "Testing download"
      });

      const httpEvent: HttpResponse<any> = {
        type: HttpEventType.Response,
      } as HttpResponse<any>;

      // Act
      backgroundTaskService.updateProgress(progress, httpEvent)

      // Assert
      expect(progress.getValue()).toEqual({
        index: 2,
        value: 100,
        description: "Testing download"
      });
    });

  })

  describe('isEmpty', () => {
    it('Should return false when there is a task in progress', async () => {
      // Arrange
      const fixture = MockRender(BackgroundTaskService);
      const backgroundTaskService = fixture.point.componentInstance;
      backgroundTaskService.showProgress("Test", 2, "Doing first test");

      // Act
      const result = backgroundTaskService.isEmpty();

      // Assert
      expect(result).toBeFalsy();
    });

    it('Should return true when there is no more task in progress (even if there is still a message)', async () => {
      // Arrange
      const fixture = MockRender(BackgroundTaskService);
      const backgroundTaskService = fixture.point.componentInstance;
      const progress = backgroundTaskService.showProgress("Test", 2, "Doing first test");
      // Finish the task, a message should be shown for 3 seconds
      progress.next({
        index: 2,
        value: 100
      });
      fixture.detectChanges();

      // Act
      const result = backgroundTaskService.isEmpty();

      // Assert
      fixture.detectChanges();
      expect(result).toBeTruthy();
    });
  })
  describe('schedule', () => {
    it('prevent duplicates of the same task when they are not run yet', fakeAsync(() => {
      // Arrange
      const fixture = MockRender(BackgroundTaskService);
      const backgroundTaskService = fixture.point.componentInstance;

      // Act
      let result1 = 0;
      let result2 = 0;
      const task1 = () => {
        result1++;
        return mustBeConsumedAsyncObservable(undefined);
      };
      // First instance will be running now
      backgroundTaskService.schedule("task1", task1);
      // Second instance will be scheduled for later
      backgroundTaskService.schedule("task1", task1);
      // Third instance will be dropped since it's already scheduled for later
      backgroundTaskService.schedule("task1", task1);

      backgroundTaskService.schedule("task2", () => {
        result2++;
        return mustBeConsumedAsyncObservable(undefined);
      });

      // Assert
      tick(1000);
      expect(result1).toEqual(2);
      expect(result2).toEqual(1);
    }));

    it('allows duplicates of the same task if the first task already completed', fakeAsync(() => {
      // Arrange
      const fixture = MockRender(BackgroundTaskService);
      const backgroundTaskService = fixture.point.componentInstance;
      // Schedule a first instance of task1
      let result1 = 0;
      const task1 = () => {
        result1++;
        return mustBeConsumedAsyncObservable(undefined);
      };
      backgroundTaskService.schedule("task1", task1);
      tick(500);

      // Act
      backgroundTaskService.schedule("task1", task1);

      // Assert
      tick(500);
      expect(result1).toEqual(2);
    }));

    it('allows duplicates of the same task if the first task already completed two times', fakeAsync(() => {
      // Arrange
      const fixture = MockRender(BackgroundTaskService);
      const backgroundTaskService = fixture.point.componentInstance;
      // Schedule a first instance of task1
      let result1a = 0;
      let result1b = 0;
      let result1c = 0;
      backgroundTaskService.schedule("task1", () => {
        result1a++;
        return mustBeConsumedAsyncObservable(undefined);
      });
      tick(500);
      backgroundTaskService.schedule("task1", () => {
        result1b++;
        return mustBeConsumedAsyncObservable(undefined);
      });
      tick(500);

      // Act
      backgroundTaskService.schedule("task1", () => {
        result1c++;
        return mustBeConsumedAsyncObservable(undefined);
      });

      // Assert
      tick(500);
      expect(result1a).toEqual(1);
      expect(result1b).toEqual(1);
      expect(result1c).toEqual(1);
    }));

    it('delay duplicate task if the first task is currently running', fakeAsync(() => {
      // Arrange
      const fixture = MockRender(BackgroundTaskService);
      const backgroundTaskService = fixture.point.componentInstance;
      // Schedule a first instance of task1 with a 5 seconds delay
      let result1 = 0;
      backgroundTaskService.schedule("task1", () => {
        return of(undefined).pipe(
          delay(5000),
          map(() => {
            result1++;
          }));
      });
      tick(500);

      // Act
      backgroundTaskService.schedule("task1", () => {
        result1++;
        return mustBeConsumedAsyncObservable(undefined);
      });

      // Assert
      tick(500);
      expect(result1).toEqual(0);
      tick(5000);
      expect(result1).toEqual(2);
    }));
  })
});

class Page {
  static async getProgressMessage() {
    const element = document.body.querySelector('mat-snack-bar-container');
    if (element) {
      const textContent = element.textContent;
      return textContent || undefined;
    }
    return undefined
  }
}

export function mockBackgroundTaskService() {
  const backgroundTaskService = mock<BackgroundTaskService>();
  MockInstance(BackgroundTaskService, () => {
    return {
      showProgress: backgroundTaskService.showProgress,
      updateProgress: backgroundTaskService.updateProgress,
      schedule: backgroundTaskService.schedule
    }
  });
  return backgroundTaskService;
}
