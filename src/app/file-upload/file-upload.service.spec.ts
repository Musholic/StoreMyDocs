import {FileUploadService} from './file-upload.service';
import {MockBuilder, MockInstance, MockRender} from "ng-mocks";
import {AppModule} from "../app.module";
import {HttpClientTestingModule, HttpTestingController} from "@angular/common/http/testing";
import {HttpClientModule, HttpEventType} from "@angular/common/http";
import {fakeAsync, TestBed, tick} from "@angular/core/testing";
import {mockFindOrCreateBaseFolder} from "../../testing/common-testing-function.spec";

describe('FileUploadService', () => {
  MockInstance.scope();

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

  it('should upload', fakeAsync(() => {
    // Arrange
    let f = new File(["test_content"], "test.txt", {type: 'application/txt'});
    mockFindOrCreateBaseFolder();
    const service = MockRender(FileUploadService).point.componentInstance;
    let httpTestingController = TestBed.inject(HttpTestingController);

    // Act
    let completedRequest = false;
    service.upload(f).subscribe(() => completedRequest = true);

    // Assert
    tick();
    // The following 4 requests are expected: find existing base folder, create it, create upload, upload

    const req = httpTestingController.expectOne('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable');
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual({
      name: 'test.txt',
      parents: ['parentId7854'],
      mimeType: 'application/txt',
      'Content-Type': 'application/txt',
      'Content-Length': 12
    });
    req.flush('', {headers: {'Location': 'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&upload_id=ADPycdtRB5_hUde03FI0b'}});

    const req2 = httpTestingController.expectOne('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&upload_id=ADPycdtRB5_hUde03FI0b');
    expect(req2.request.method).toEqual('PUT');
    expect(req2.request.body).toEqual(f);
    req2.event({total: 100, loaded: 100, type: HttpEventType.UploadProgress})
    req2.flush('');

    expect(completedRequest).toBeTrue();

    // Finally, assert that there are no outstanding requests.
    httpTestingController.verify();
  }))

});
