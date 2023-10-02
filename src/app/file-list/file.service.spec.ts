import {FileService} from './file.service';
import {MockBuilder, MockInstance, MockRender} from "ng-mocks";
import {AppModule} from "../app.module";
import {HttpClientModule} from "@angular/common/http";
import {HttpClientTestingModule, HttpTestingController} from "@angular/common/http/testing";
import {fakeAsync, TestBed, tick} from "@angular/core/testing";
import {FileElement} from "./file-list.component";
import {mockGetApiToken} from "../../testing/common-testing-function.spec";

describe('FileService', () => {
  MockInstance.scope();

  beforeEach(() => MockBuilder(FileService, AppModule)
    .replace(HttpClientModule, HttpClientTestingModule)
  );

  it('should be created', () => {
    const service = MockRender(FileService).point.componentInstance;
    expect(service).toBeTruthy();
  });

  it('should list files', fakeAsync(() => {
    // Arrange
    const service = MockRender(FileService).point.componentInstance;
    let httpTestingController = TestBed.inject(HttpTestingController);

    // Act
    let result: FileElement[] = [];
    service.findInFolder('at879', 'id8495')
      .subscribe(value => result = value)

    // Assert
    tick();

    const req = httpTestingController.expectOne("https://www.googleapis.com/drive/v3/files?" +
      "q='id8495'%20in%20parents%20and%20trashed%20=%20false" +
      "&fields=files(id,name,createdTime,size,iconLink,webContentLink)");
    expect(req.request.method).toEqual('GET');
    expect(req.request.headers.get('Authorization')).toEqual('Bearer at879');
    req.flush({
      "files": [
        {
          id: "id1",
          "size": "1811088",
          "name": "data.bin",
          "createdTime": "2023-08-14T14:48:44.928Z",
          iconLink: "link",
          webContentLink: "dlLink"
        },
        {
          id: "id2",
          "size": "215142",
          "name": "document.pdf",
          "createdTime": "2023-08-14T12:28:46.935Z",
          iconLink: "link",
          webContentLink: "dlLink"
        },
        {
          id: "id3",
          "size": "23207",
          "name": "test-render.png",
          "createdTime": "2023-08-03T14:54:55.556Z",
          iconLink: "link",
          webContentLink: "dlLink"
        }
      ]
    });

    expect(result).toEqual([
      {
        id: "id1",
        "size": 1811088,
        "name": "data.bin",
        "date": "2023-08-14T14:48:44.928Z",
        iconLink: "link",
        dlLink: "dlLink"
      },
      {
        id: "id2",
        "size": 215142,
        "name": "document.pdf",
        "date": "2023-08-14T12:28:46.935Z",
        iconLink: "link",
        dlLink: "dlLink"
      },
      {
        id: "id3",
        "size": 23207,
        "name": "test-render.png",
        "date": "2023-08-03T14:54:55.556Z",
        iconLink: "link",
        dlLink: "dlLink"
      }
    ]);

    // Finally, assert that there are no outstanding requests.
    httpTestingController.verify();
  }))

  it('should trash file', fakeAsync(() => {
    // Arrange
    mockGetApiToken();
    const service = MockRender(FileService).point.componentInstance;
    let httpTestingController = TestBed.inject(HttpTestingController);

    // Act
    service.trash('id545').subscribe();

    // Assert
    tick();

    const req = httpTestingController.expectOne("https://www.googleapis.com/drive/v3/files/id545");
    expect(req.request.method).toEqual('PATCH');
    expect(req.request.body).toEqual({
      trashed: true
    });
    expect(req.request.headers.get('Authorization')).toEqual('Bearer at87964');
    req.flush({});

    // Finally, assert that there are no outstanding requests.
    httpTestingController.verify();
  }))

  describe('findOrCreateFolder', () => {
    describe('when folder does not exist', () => {
      it('should create and return a new id', fakeAsync(() => {
        // Arrange
        const service = MockRender(FileService).point.componentInstance;
        let httpTestingController = TestBed.inject(HttpTestingController);

        // Act
        let result = '';
        service.findOrCreateFolder('at545', 'folder78')
          .subscribe(value => result = value)

        // Assert
        tick();

        const req = httpTestingController.expectOne("https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.folder'%20and%20name='folder78'");
        expect(req.request.method).toEqual('GET');
        expect(req.request.headers.get('Authorization')).toEqual('Bearer at545');
        req.flush({
          "kind": "drive#fileList",
          "incompleteSearch": false,
          "files": []
        });

        const req2 = httpTestingController.expectOne("https://www.googleapis.com/drive/v3/files");
        expect(req2.request.method).toEqual('POST');
        expect(req2.request.headers.get('Authorization')).toEqual('Bearer at545');
        expect(req2.request.body).toEqual({
          mimeType: "application/vnd.google-apps.folder",
          name: 'folder78'
        });
        req2.flush({
          "kind": "drive#file",
          "id": "folderId548545",
          "name": "folder78",
          "mimeType": "application/vnd.google-apps.folder"
        });

        expect(result).toEqual('folderId548545')

        // Finally, assert that there are no outstanding requests.
        httpTestingController.verify();
      }))
    })

    describe('when folder already exist', () => {
      it('should create and return a new id', fakeAsync(() => {
        // Arrange
        const service = MockRender(FileService).point.componentInstance;
        let httpTestingController = TestBed.inject(HttpTestingController);

        // Act
        let result = '';
        service.findOrCreateFolder('at545', 'folder979')
          .subscribe(value => result = value)

        // Assert
        tick();

        const req = httpTestingController.expectOne("https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.folder'%20and%20name='folder979'");
        expect(req.request.method).toEqual('GET');
        expect(req.request.headers.get('Authorization')).toEqual('Bearer at545');
        req.flush({
          "kind": "drive#fileList",
          "incompleteSearch": false,
          "files": [
            {
              "kind": "drive#file",
              "mimeType": "application/vnd.google-apps.folder",
              "id": "folderId879",
              "name": "folder979"
            }
          ]
        });

        expect(result).toEqual('folderId879')

        // Finally, assert that there are no outstanding requests.
        httpTestingController.verify();
      }))
    })
  })
});
