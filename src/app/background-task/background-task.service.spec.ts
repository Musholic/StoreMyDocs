import {BackgroundTaskService} from './background-task.service';
import {mock} from "strong-mock";
import {MockBuilder, MockInstance, MockRender} from "ng-mocks";
import {AppModule} from "../app.module";
import {MatSnackBarModule} from "@angular/material/snack-bar";
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
      backgroundTaskService.showProgress("Test", "Doing first test", 2);

      // Assert
      let result = await page.getProgressMessage();
      expect(result).toEqual("1/2 0% Test: Doing first test...");
    })

    it('Should show in progress', async () => {
      // Arrange
      let fixture = MockRender(BackgroundTaskService);
      let page = new Page(fixture);
      const backgroundTaskService = fixture.point.componentInstance;
      let progress = backgroundTaskService.showProgress("Test", "Doing first test", 3);

      // Act
      progress.next({
        index: 2,
        value: 25,
        description: "Doing more test"
      })

      // Assert
      fixture.detectChanges();
      let result = await page.getProgressMessage();
      expect(result).toEqual("2/3 25% Test: Doing more test...");
    })

    it('Should show as completed and should dismiss after 3s', fakeAsync(async () => {
      // Arrange
      let fixture = MockRender(BackgroundTaskService);
      let page = new Page(fixture);
      const backgroundTaskService = fixture.point.componentInstance;
      let progress = backgroundTaskService.showProgress("Test", "Doing first test", 2);

      // Act
      progress.next({
        index: 2,
        value: 100
      })

      // Assert
      fixture.detectChanges();
      let resultMessage = await page.getProgressMessage();
      expect(resultMessage).toEqual("2/2 100% Test finished!");
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
      showProgress: backgroundTaskService.showProgress,
      updateProgress: backgroundTaskService.updateProgress
    }
  });
  return backgroundTaskService;
}
