import {BackgroundTaskService, Progress} from './background-task.service';
import {mock} from "strong-mock";
import {MockBuilder, MockInstance, MockRender} from "ng-mocks";
import {AppModule} from "../app.module";
import {MatSnackBarModule} from "@angular/material/snack-bar";
import {fakeAsync, flush, tick} from "@angular/core/testing";
import {BrowserAnimationsModule, NoopAnimationsModule} from "@angular/platform-browser/animations";
import {BehaviorSubject} from "rxjs";
import {HttpDownloadProgressEvent, HttpEventType, HttpResponse, HttpUploadProgressEvent} from "@angular/common/http";

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
      let fixture = MockRender(BackgroundTaskService);
      const backgroundTaskService = fixture.point.componentInstance;

      // Act
      backgroundTaskService.showProgress("Test", 2, "Doing first test");

      // Assert
      fixture.detectChanges();
      let result = await Page.getProgressMessage();
      expect(result).toEqual("1/2 0% Test: Doing first test...");
    })

    it('Should show in progress', async () => {
      // Arrange
      let fixture = MockRender(BackgroundTaskService);
      const backgroundTaskService = fixture.point.componentInstance;
      let progress = backgroundTaskService.showProgress("Test", 4, "Doing first test");

      // Act
      progress.next({
        index: 2,
        value: 50,
        description: "Doing more test"
      })

      // Assert
      fixture.detectChanges();
      let result = await Page.getProgressMessage();
      expect(result).toEqual("2/4 37% Test: Doing more test...");
    })

    it('Should show as completed and should dismiss after 3s', fakeAsync(async () => {
      // Arrange
      let fixture = MockRender(BackgroundTaskService);
      let page = new Page();
      const backgroundTaskService = fixture.point.componentInstance;
      let progress = backgroundTaskService.showProgress("Test", 2, "Doing first test");

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
      let fixture = MockRender(BackgroundTaskService);
      let page = new Page();
      const backgroundTaskService = fixture.point.componentInstance;
      let progress = backgroundTaskService.showProgress("Test", 2);

      // Act
      progress.next({
        index: 2,
        value: 100
      })

      // Assert
      fixture.detectChanges();
      tick();
      let resultMessage = await Page.getProgressMessage();
      expect(resultMessage).toEqual(undefined);
    }))

    it('Should support showing a second ongoing task', async () => {
      // Arrange
      let fixture = MockRender(BackgroundTaskService);
      const backgroundTaskService = fixture.point.componentInstance;
      let progress1 = backgroundTaskService.showProgress("Test", 4, "Doing first test");
      fixture.detectChanges();

      // Act
      let progress2 = backgroundTaskService.showProgress("Second test", 2, "Starting second test");
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
      let result = await Page.getProgressMessage();
      expect(result).toEqual("2/4 37% Test: Doing more test...1/2 25% Second test: Doing second test...");
    })

    it('Should support hiding the first ongoing task and still showing the second ongoing task', fakeAsync(async () => {
      // Arrange
      let fixture = MockRender(BackgroundTaskService);
      const backgroundTaskService = fixture.point.componentInstance;
      let progress1 = backgroundTaskService.showProgress("Test", 4, "Doing first test");
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
      let result = await Page.getProgressMessage();
      expect(result).toEqual("1/2 0% Second test: Starting second test...");
    }))

    it('Should start showing a second task progress after the first task finished', fakeAsync(async () => {
      // Arrange
      let fixture = MockRender(BackgroundTaskService);
      const backgroundTaskService = fixture.point.componentInstance;
      // Task with no actual step to show which is dismissed immediately
      let progress1 = backgroundTaskService.showProgress("Test", 4);
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
      let result = await Page.getProgressMessage();
      expect(result).toEqual("1/2 0% Second test: Starting second test...");
      flush();
    }))

    it('Should not show message for a second task finishing before the first and with no actual step', fakeAsync(async () => {
      // Arrange
      let fixture = MockRender(BackgroundTaskService);
      const backgroundTaskService = fixture.point.componentInstance;
      backgroundTaskService.showProgress("Test", 4, "Doing first test");
      fixture.detectChanges();
      let progress2 = backgroundTaskService.showProgress("Second test", 2);

      // Act
      // Finish the second task with no actual step
      progress2.next({
        index: 2,
        value: 100
      })

      // Assert
      fixture.detectChanges();
      let result = await Page.getProgressMessage();
      expect(result).toEqual("1/4 0% Test: Doing first test...");
      flush();
    }))
  })
  describe('updateProgress', () => {
    it('Should update progress with intermediate download progress event', () => {
      // Arrange
      const backgroundTaskService = MockRender(BackgroundTaskService).point.componentInstance;
      let progress = new BehaviorSubject<Progress>({
        index: 2,
        value: 0,
        description: "Testing download"
      });

      let httpEvent: HttpDownloadProgressEvent = {
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
      let progress = new BehaviorSubject<Progress>({
        index: 2,
        value: 0,
        description: "Testing download"
      });

      let httpEvent: HttpUploadProgressEvent = {
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
      let progress = new BehaviorSubject<Progress>({
        index: 2,
        value: 0,
        description: "Testing download"
      });

      let httpEvent: HttpResponse<any> = {
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
      let fixture = MockRender(BackgroundTaskService);
      const backgroundTaskService = fixture.point.componentInstance;
      backgroundTaskService.showProgress("Test", 2, "Doing first test");

      // Act
      let result = backgroundTaskService.isEmpty();

      // Assert
      expect(result).toBeFalsy();
    });

    it('Should return true when there is no more task in progress (even if there is still a message)', async () => {
      // Arrange
      let fixture = MockRender(BackgroundTaskService);
      const backgroundTaskService = fixture.point.componentInstance;
      let progress = backgroundTaskService.showProgress("Test", 2, "Doing first test");
      // Finish the task, a message should be shown for 3 seconds
      progress.next({
        index: 2,
        value: 100
      });
      fixture.detectChanges();

      // Act
      let result = backgroundTaskService.isEmpty();

      // Assert
      fixture.detectChanges();
      expect(result).toBeTruthy();
    });
  })
});

class Page {
  static async getProgressMessage() {
    let element = document.body.querySelector('mat-snack-bar-container');
    if (element) {
      let textContent = element.textContent;
      return textContent || undefined;
    }
    return undefined
  }
}

export function mockBackgroundTaskService() {
  let backgroundTaskService = mock<BackgroundTaskService>();
  MockInstance(BackgroundTaskService, () => {
    return {
      showProgress: backgroundTaskService.showProgress,
      updateProgress: backgroundTaskService.updateProgress
    }
  });
  return backgroundTaskService;
}
