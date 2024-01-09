import {ComponentFixture} from '@angular/core/testing';
import {FileUploadComponent} from './file-upload.component';
import {MatIconModule} from "@angular/material/icon";
import {MockBuilder, MockInstance, MockRender, ngMocks} from "ng-mocks";
import {AppModule} from "../app.module";
import {toFileOrBlob} from "./file-upload.service";
import {mock, when} from "strong-mock";
import {Observable, of} from "rxjs";
import {FileUploadElementComponent} from "./file-upload-element/file-upload-element.component";
import {HttpEventType, HttpResponse} from "@angular/common/http";
import {TestbedHarnessEnvironment} from "@angular/cdk/testing/testbed";
import {HarnessLoader} from "@angular/cdk/testing";
import {MatButtonHarness} from "@angular/material/button/testing";
import {GooglePickerService} from "./google-picker.service";
import {mockFileUploadService} from "./file-upload.service.spec";
import {BreakpointObserver} from "@angular/cdk/layout";
import {UserRootComponent} from "../user-root/user-root.component";

describe('FileUploadComponent', () => {
  beforeEach(() => {
    return MockBuilder(FileUploadComponent, AppModule)
      .keep(MatIconModule)
      .keep(BreakpointObserver)
      // For some reason, we need to explicitly add a provider for UserRootComponent
      .provide({
        provide: UserRootComponent,
        useValue: mock<UserRootComponent>()
      })
  });

  it('should create', () => {
    // Arrange
    const fixture = MockRender(FileUploadComponent);
    const component = fixture.point.componentInstance;

    // Assert
    expect(component).toBeTruthy();
  });

  describe('When selecting a file to upload', () => {
    it('Should shows the file as being uploaded', () => {
      // Arrange
      let fileUploadService = mockFileUploadService();
      let file = new File([''], 'TestFile.txt');
      when(() => fileUploadService.upload(toFileOrBlob(file))).thenReturn(new Observable())

      const fixture = MockRender(FileUploadComponent);
      const page = new Page(fixture);

      // Act
      page.uploadFile(file);

      // Assert
      expect(page.uploadedFiles.map(v => v.fileProgress.fileName))
        .toEqual(['TestFile.txt']);
    });

    it('Should update upload progress', () => {
      // Arrange
      let fileUploadService = mockFileUploadService();
      let file = new File([''], 'TestFile.txt');
      when(() => fileUploadService.upload(toFileOrBlob(file))).thenReturn(of({
        loaded: 50,
        total: 100,
        type: HttpEventType.UploadProgress
      }))

      const fixture = MockRender(FileUploadComponent);
      const page = new Page(fixture);

      // Act
      page.uploadFile(file);

      // Assert
      expect(fixture.point.componentInstance.files).toEqual([{
        fileName: 'TestFile.txt',
        loaded: 50,
        total: 100
      }])
    });

    it('Should trigger upload finish event', () => {
      // Arrange
      let fileUploadService = mockFileUploadService();
      let file = new File([''], 'TestFile.txt');
      when(() => fileUploadService.upload(toFileOrBlob(file))).thenReturn(of({
        type: HttpEventType.Response
      } as HttpResponse<any>))

      let userRootComponent = ngMocks.get(UserRootComponent);
      // A page refresh is expected
      when(() => userRootComponent.refreshCacheAndReload()).thenReturn();

      const fixture = MockRender(FileUploadComponent);
      const page = new Page(fixture);

      // Act
      page.uploadFile(file);

      // Assert
      // No failure from mock setup
    })
  })

  describe('When selecting a file with the google picker', () => {
    it('Should refresh files', async () => {
      // Arrange
      let showMock = MockInstance(GooglePickerService, 'show', mock<GooglePickerService['show']>());
      // The user has picked a file when we show the picker
      when(() => showMock()).thenResolve(undefined);

      let userRootComponent = ngMocks.get(UserRootComponent);
      // A page refresh is expected
      when(() => userRootComponent.refreshCacheAndReload()).thenReturn();

      const fixture = MockRender(FileUploadComponent);
      const page = new Page(fixture);

      // Act
      await page.openGooglePicker();

      // Assert
      // No failure from mock setup
    });
  });
});

class Page {
  private fixture: ComponentFixture<FileUploadComponent>;
  private harnessLoader: HarnessLoader;

  constructor(fixture: ComponentFixture<FileUploadComponent>) {
    this.fixture = fixture;
    this.harnessLoader = TestbedHarnessEnvironment.loader(fixture);
  }

  get uploadedFiles(): FileUploadElementComponent[] {
    return ngMocks.findInstances(FileUploadElementComponent);
  }

  private get uploadInput(): HTMLInputElement {
    return this.query<HTMLInputElement>('input');
  }

  uploadFile(file: File) {

    const dataTransfer = new DataTransfer()
    dataTransfer.items.add(file)

    let event = new InputEvent('change', {dataTransfer: dataTransfer});

    let uploadInput = this.uploadInput;
    uploadInput.files = dataTransfer.files;
    uploadInput.dispatchEvent(event);
    this.fixture.detectChanges();
  }

  async openGooglePicker() {
    let button = await this.harnessLoader.getHarness(MatButtonHarness.with({text: 'Add file from Google Drive...'}));
    await button.click();
  }

  private query<T>(selector: string): T {
    return this.fixture.nativeElement.querySelector(selector);
  }
}
