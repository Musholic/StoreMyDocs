import {BackgroundTaskService, Progress} from './background-task.service';
import {mock} from "strong-mock";
import {MockBuilder, MockInstance, MockRender} from "ng-mocks";
import {AppModule} from "../app.module";
import {MatSnackBarModule} from "@angular/material/snack-bar";
import {fakeAsync, tick} from "@angular/core/testing";
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
      backgroundTaskService.showProgress("Test", "Doing first test", 2);

      // Assert
      let result = await Page.getProgressMessage();
      expect(result).toEqual("1/2 0% Test: Doing first test...");
    })

    it('Should show in progress', async () => {
      // Arrange
      let fixture = MockRender(BackgroundTaskService);
      const backgroundTaskService = fixture.point.componentInstance;
      let progress = backgroundTaskService.showProgress("Test", "Doing first test", 4);

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
      let progress = backgroundTaskService.showProgress("Test", "Doing first test", 2);

      // Act
      progress.next({
        index: 2,
        value: 100
      })

      // Assert
      fixture.detectChanges();
      let resultMessage = await Page.getProgressMessage();
      expect(resultMessage).toEqual("2/2 100% Test finished!");
      tick(3000);
      // The message should be gone after 5 seconds at least
      resultMessage = await Page.getProgressMessage();
      expect(resultMessage).toEqual(undefined);

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
