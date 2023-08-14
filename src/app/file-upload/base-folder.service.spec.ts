import {BaseFolderService} from './base-folder.service';
import {MockBuilder, MockRender} from "ng-mocks";
import {AppModule} from "../app.module";
import {HttpClientModule} from "@angular/common/http";
import {HttpClientTestingModule, HttpTestingController} from "@angular/common/http/testing";
import {fakeAsync, TestBed, tick} from "@angular/core/testing";

describe('BaseFolderService', () => {

  beforeEach(() => MockBuilder(BaseFolderService, AppModule)
    .replace(HttpClientModule, HttpClientTestingModule)
  );

  it('should be created', () => {
    // Act
    const service = MockRender(BaseFolderService).point.componentInstance;

    // Assert
    expect(service).toBeTruthy();
  });

  describe('when folder does not exist', () => {
    it('should create and return a new id', fakeAsync(() => {
      // Arrange
      const service = MockRender(BaseFolderService).point.componentInstance;
      let httpTestingController = TestBed.inject(HttpTestingController);

      // Act
      let result = '';
      service.findOrCreateBaseFolder('at545')
        .subscribe(value => result = value)

      // Assert
      tick();

      const req = httpTestingController.expectOne("https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.folder'%20and%20name='storemydocs.ovh'");
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
        name: 'storemydocs.ovh'
      });
      req2.flush({
        "kind": "drive#file",
        "id": "folderId548545",
        "name": "storemydocs.ovh",
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
      const service = MockRender(BaseFolderService).point.componentInstance;
      let httpTestingController = TestBed.inject(HttpTestingController);

      // Act
      let result = '';
      service.findOrCreateBaseFolder('at545')
        .subscribe(value => result = value)

      // Assert
      tick();

      const req = httpTestingController.expectOne("https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.folder'%20and%20name='storemydocs.ovh'");
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
            "name": "storemydocs.ovh"
          }
        ]
      });

      expect(result).toEqual('folderId879')

      // Finally, assert that there are no outstanding requests.
      httpTestingController.verify();
    }))
  })
});
