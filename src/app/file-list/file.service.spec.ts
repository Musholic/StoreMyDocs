import {FileService} from './file.service';
import {MockBuilder, MockInstance, MockRender} from "ng-mocks";
import {AppModule} from "../app.module";
import {HttpClientModule} from "@angular/common/http";
import {HttpClientTestingModule, HttpTestingController} from "@angular/common/http/testing";
import {fakeAsync, TestBed, tick} from "@angular/core/testing";
import {FileElement, FileOrFolderElement, FolderElement} from "./file-list.component";
import {mock, when} from "strong-mock";
import {of} from "rxjs";

describe('FileService', () => {
  beforeEach(() => MockBuilder(FileService, AppModule)
    .replace(HttpClientModule, HttpClientTestingModule)
  );

  it('should be created', () => {
    const service = MockRender(FileService).point.componentInstance;
    expect(service).toBeTruthy();
  });

  it('should list files and folders', fakeAsync(() => {
    // Arrange
    const service = MockRender(FileService).point.componentInstance;
    let httpTestingController = TestBed.inject(HttpTestingController);

    // Act
    let result: FileOrFolderElement[] = [];
    service.findAll()
      .subscribe(value => result = value)

    // Assert
    tick();

    const req = httpTestingController.expectOne("https://www.googleapis.com/drive/v3/files?" +
      "q=trashed%20=%20false" +
      "&fields=files(id,name,createdTime,size,iconLink,webContentLink,mimeType)");
    expect(req.request.method).toEqual('GET');
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
        },
        {
          "id": "id4",
          "mimeType": "application/vnd.google-apps.folder",
          "name": "image",
          iconLink: "link",
          "createdTime": "2023-10-13T08:47:32.059Z"
        },
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
      } as FileElement,
      {
        id: "id2",
        "size": 215142,
        "name": "document.pdf",
        "date": "2023-08-14T12:28:46.935Z",
        iconLink: "link",
        dlLink: "dlLink"
      } as FileElement,
      {
        id: "id3",
        "size": 23207,
        "name": "test-render.png",
        "date": "2023-08-03T14:54:55.556Z",
        iconLink: "link",
        dlLink: "dlLink"
      } as FileElement,
      {
        "id": "id4",
        "name": "image",
        "date": "2023-10-13T08:47:32.059Z",
        iconLink: "link"
      } as FolderElement
    ] as FileOrFolderElement[]);

    // Finally, assert that there are no outstanding requests.
    httpTestingController.verify();
  }))

  it('should trash file', fakeAsync(() => {
    // Arrange
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
        service.findOrCreateFolder('folder78', 'parentFolder98')
          .subscribe(value => result = value)

        // Assert
        tick();

        const req = httpTestingController.expectOne("https://www.googleapis.com/drive/v3/files?" +
          "q=mimeType='application/vnd.google-apps.folder'%20and%20name='folder78'%20and%20'parentFolder98'%20in%20parents");
        expect(req.request.method).toEqual('GET');
        req.flush({
          "kind": "drive#fileList",
          "incompleteSearch": false,
          "files": []
        });

        const req2 = httpTestingController.expectOne("https://www.googleapis.com/drive/v3/files");
        expect(req2.request.method).toEqual('POST');
        expect(req2.request.body).toEqual({
          mimeType: "application/vnd.google-apps.folder",
          name: 'folder78',
          parents: ['parentFolder98']
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
      it('should return existing id', fakeAsync(() => {
        // Arrange
        const service = MockRender(FileService).point.componentInstance;
        let httpTestingController = TestBed.inject(HttpTestingController);

        // Act
        let result = '';
        service.findOrCreateFolder('folder979')
          .subscribe(value => result = value)

        // Assert
        tick();

        const req = httpTestingController.expectOne("https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.folder'%20and%20name='folder979'");
        expect(req.request.method).toEqual('GET');
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

  describe('setCategory', () => {
    describe('when category does not exist', () => {
      it('should create a new category and assign it to the file', fakeAsync(() => {
        // Arrange
        const service = MockRender(FileService).point.componentInstance;

        let httpTestingController = TestBed.inject(HttpTestingController);

        // Act
        let result = false;
        service.setCategory('fId4895', 'fId54848')
          .subscribe(_ => result = true);

        // Assert
        tick();

        // We expect a call to the drive API to move the file
        const req = httpTestingController.expectOne("https://www.googleapis.com/drive/v3/files/fId4895?addParents=fId54848");
        expect(req.request.method).toEqual('PATCH');
        req.flush({
          "kind": "drive#file",
          "id": "fId4895",
          "name": "test.txt",
          "mimeType": "text/plain"
        });

        // Finally, assert that there are no outstanding requests.
        httpTestingController.verify();

        expect(result).toBeTruthy();
      }))
    });
  })
});
