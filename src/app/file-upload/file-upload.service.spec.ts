import {FileUploadService} from './file-upload.service';
import {MockBuilder, MockRender} from "ng-mocks";
import {AppModule} from "../app.module";
import {HttpClientTestingModule, HttpTestingController} from "@angular/common/http/testing";
import {HttpClientModule, HttpEventType} from "@angular/common/http";
import {fakeAsync, TestBed, tick} from "@angular/core/testing";
import {GoogleDriveAuthService} from "./google-drive-auth.service";
import {mock, when} from "strong-mock";

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

    it('should upload', fakeAsync(() => {
        // Arrange
        const service = MockRender(FileUploadService).point.componentInstance;
        let f = new File(["test_content"], "test.txt", {type: 'application/txt'});
        let httpTestingController = TestBed.inject(HttpTestingController);
        let authService = TestBed.inject(GoogleDriveAuthService);
        let accessTokenMock = mock<GoogleDriveAuthService['getApiToken']>();
        authService.getApiToken = accessTokenMock;
        when(() => accessTokenMock()).thenResolve('at87964');

        // Act
        let completedRequest = false;
        service.upload(f).subscribe(() => completedRequest = true);

        // Assert
        tick();
        const req = httpTestingController.expectOne('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable');

        expect(req.request.method).toEqual('POST');
        expect(req.request.body).toEqual({
            name: 'test.txt',
            mimeType: 'application/txt',
            'Content-Type': 'application/txt',
            'Content-Length': 12
        });
        expect(req.request.headers.get('Authorization')).toEqual('Bearer at87964');

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
