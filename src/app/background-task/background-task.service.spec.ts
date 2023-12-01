import {BackgroundTaskService} from './background-task.service';
import {mock} from "strong-mock";
import {MockBuilder, MockInstance, MockRender} from "ng-mocks";
import {AppModule} from "../app.module";
import {of} from "rxjs";
import {MatSnackBarModule} from "@angular/material/snack-bar";
import {HttpEventType} from "@angular/common/http";
import {ComponentFixture} from "@angular/core/testing";
import {BrowserAnimationsModule, NoopAnimationsModule} from "@angular/platform-browser/animations";
import {HarnessLoader} from "@angular/cdk/testing";
import {TestbedHarnessEnvironment} from "@angular/cdk/testing/testbed";
import {MatSnackBarHarness} from "@angular/material/snack-bar/testing";

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
      let result = await page.getProgressMessage();
      expect(result).toEqual("25%: Database backup in progress...");
    })
  })
});

class Page {
  private loader: HarnessLoader;

  constructor(fixture: ComponentFixture<BackgroundTaskService>) {
    this.loader = TestbedHarnessEnvironment.documentRootLoader(fixture);
  }

  async getProgressMessage() {

    let snackBar = await this.loader.getHarness(MatSnackBarHarness);
    return snackBar.getMessage();
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
