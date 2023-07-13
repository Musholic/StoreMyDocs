import {FileUploadService} from './file-upload.service';
import {MockBuilder, MockRender} from "ng-mocks";
import {AppModule} from "../app.module";
import {HttpClientTestingModule} from "@angular/common/http/testing";
import {HttpClientModule} from "@angular/common/http";

describe('FileUploadService', () => {
  beforeEach(() =>
    MockBuilder(FileUploadService, AppModule)
      .replace(HttpClientModule, HttpClientTestingModule)
  );

  it('should be created', () => {
    // Arrange
    const service = MockRender(FileUploadService).point.componentInstance;

    // Assert
    expect(service).toBeTruthy();
  });
});
