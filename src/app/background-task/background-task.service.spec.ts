import {BackgroundTaskService} from './background-task.service';
import {mock} from "strong-mock";
import {MockBuilder, MockInstance, MockRender} from "ng-mocks";
import {AppModule} from "../app.module";
import {of} from "rxjs";
import {MatSnackBarModule} from "@angular/material/snack-bar";
import {HttpEventType} from "@angular/common/http";
import {ComponentFixture, fakeAsync, tick} from "@angular/core/testing";
import {BrowserAnimationsModule, NoopAnimationsModule} from "@angular/platform-browser/animations";
import {HarnessLoader} from "@angular/cdk/testing";
import {TestbedHarnessEnvironment} from "@angular/cdk/testing/testbed";

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
      let page = new Page(fixture);
      const backgroundTaskService = fixture.point.componentInstance;

      // Act
      backgroundTaskService.showProgress(of());

      // Assert
      let result = await page.getProgressMessage();
      expect(result).toEqual("0%: Database backup in progress...");
    })

    it('Should show in progress', async () => {
      // Arrange
      let fixture = MockRender(BackgroundTaskService);
      let page = new Page(fixture);
      const backgroundTaskService = fixture.point.componentInstance;

      // Act
      backgroundTaskService.showProgress(of({
        type: HttpEventType.UploadProgress,
        loaded: 50,
        total: 200
      }));

      // Assert
      fixture.detectChanges();
      let result = await page.getProgressMessage();
      expect(result).toEqual("25%: Database backup in progress...");
    })

    it('Should show as completed and should dismiss after 3s', fakeAsync(async () => {
      // Arrange
      let fixture = MockRender(BackgroundTaskService);
      let page = new Page(fixture);
      const backgroundTaskService = fixture.point.componentInstance;

      // Act
      backgroundTaskService.showProgress(of({
        type: HttpEventType.UploadProgress,
        loaded: 200,
        total: 200
      }));

      // Assert
      fixture.detectChanges();
      let resultMessage = await page.getProgressMessage();
      expect(resultMessage).toEqual("100%: Database backup finished!");
      tick(3000);
      // The message should be gone after 5 seconds at least
      resultMessage = await page.getProgressMessage();
      expect(resultMessage).toEqual(undefined);

    }))
  })
});

class Page {
  private loader: HarnessLoader;

  constructor(fixture: ComponentFixture<BackgroundTaskService>) {
    this.loader = TestbedHarnessEnvironment.documentRootLoader(fixture);
  }

  async getProgressMessage() {
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
      showProgress: backgroundTaskService.showProgress
    }
  });
  return backgroundTaskService;
}
