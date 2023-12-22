import {HomepageComponent} from './homepage.component';
import {MockBuilder, MockInstance, MockRender, ngMocks} from "ng-mocks";
import {AppModule} from "../app.module";
import {FileUploadComponent} from "../file-upload/file-upload.component";
import {FileListComponent} from "../file-list/file-list.component";
import {mock, when} from "strong-mock";
import {fakeAsync, tick} from "@angular/core/testing";

describe('HomepageComponent', () => {

  beforeEach(() => MockBuilder(HomepageComponent, AppModule));

  it('should create', () => {
    let component = MockRender(HomepageComponent).point.componentInstance;
    expect(component).toBeTruthy();
  });

  it('when upload is asking for a refresh, it refresh the file list', fakeAsync(() => {
    // Arrange
    let fileListComponent = mock<FileListComponent>();
    MockInstance(FileListComponent, () => {
      return {
        refresh: fileListComponent.refresh
      }
    });
    // TODO: simplify with direct page reload?
    when(() => fileListComponent.refresh()).thenReturn();

    MockRender(HomepageComponent);
    let fileUploadComponent = ngMocks.findInstance(FileUploadComponent);

    // Act
    fileUploadComponent.onRefreshRequest.emit();

    // Assert
    // No failure in mock setup
    tick();

  }));
});
