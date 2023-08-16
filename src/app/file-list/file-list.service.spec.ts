import {FileListService} from './file-list.service';
import {MockBuilder, MockRender} from "ng-mocks";
import {AppModule} from "../app.module";
import {HttpClientModule} from "@angular/common/http";
import {HttpClientTestingModule, HttpTestingController} from "@angular/common/http/testing";
import {fakeAsync, TestBed, tick} from "@angular/core/testing";
import {FileElement} from "./file-list.component";
import {mockFindOrCreateBaseFolder, mockGetApiToken} from "../../testing/common-testing-function.spec";

describe('FileListService', () => {

  beforeEach(() => MockBuilder(FileListService, AppModule)
    .replace(HttpClientModule, HttpClientTestingModule)
  );

  it('should be created', () => {
    const service = MockRender(FileListService).point.componentInstance;
    expect(service).toBeTruthy();
  });

  it('should list files', fakeAsync(() => {
    // Arrange
    const service = MockRender(FileListService).point.componentInstance;
    let httpTestingController = TestBed.inject(HttpTestingController);
    mockGetApiToken();
    mockFindOrCreateBaseFolder();

    // Act
    let result: FileElement[] = [];
    service.list()
      .subscribe(value => result = value)

    // Assert
    tick();

    const req = httpTestingController.expectOne("https://www.googleapis.com/drive/v3/files?q='parentId7854'%20in%20parents&fields=files(name,createdTime,size)");
    expect(req.request.method).toEqual('GET');
    expect(req.request.headers.get('Authorization')).toEqual('Bearer at87964');
    req.flush({
      "files": [
        {
          "size": "1811088",
          "name": "data.bin",
          "createdTime": "2023-08-14T14:48:44.928Z"
        },
        {
          "size": "215142",
          "name": "document.pdf",
          "createdTime": "2023-08-14T12:28:46.935Z"
        },
        {
          "size": "23207",
          "name": "test-render.png",
          "createdTime": "2023-08-03T14:54:55.556Z"
        }
      ]
    });

    expect(result).toEqual([
      {
        "size": 1811088,
        "name": "data.bin",
        "date": "2023-08-14T14:48:44.928Z"
      },
      {
        "size": 215142,
        "name": "document.pdf",
        "date": "2023-08-14T12:28:46.935Z"
      },
      {
        "size": 23207,
        "name": "test-render.png",
        "date": "2023-08-03T14:54:55.556Z"
      }
    ]);

    // Finally, assert that there are no outstanding requests.
    httpTestingController.verify();
  }))
});
