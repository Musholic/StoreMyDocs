import {AuthInterceptor} from './auth.interceptor';
import {MockBuilder, MockInstance, MockRender, NG_MOCKS_INTERCEPTORS, ngMocks} from "ng-mocks";
import {HTTP_INTERCEPTORS, HttpClient, HttpClientModule} from "@angular/common/http";
import {HttpClientTestingModule, HttpTestingController} from "@angular/common/http/testing";
import {AppModule} from "../app.module";
import {GoogleDriveAuthService} from "../file-upload/google-drive-auth.service";
import {mock, when} from "strong-mock";

describe('AuthInterceptor', () => {
  beforeEach(() => {
    return MockBuilder(AuthInterceptor, AppModule)
      .exclude(NG_MOCKS_INTERCEPTORS)
      .keep(HTTP_INTERCEPTORS)
      .replace(HttpClientModule, HttpClientTestingModule);
  });

  it('triggers interceptor', () => {
    //Arrange
    let getApiTokenMock = MockInstance(GoogleDriveAuthService, 'getApiToken', mock<GoogleDriveAuthService['getApiToken']>());
    when(() => getApiTokenMock()).thenReturn('apiToken548');
    MockRender();
    const client = ngMocks.findInstance(HttpClient);
    const httpMock = ngMocks.findInstance(HttpTestingController);

    // Act
    client.get('/target').subscribe();

    // Assert
    const req = httpMock.expectOne('/target');
    req.flush('');
    httpMock.verify();

    expect(req.request.headers.get('Authorization')).toEqual('Bearer apiToken548');
    expect(req.request.headers.get('Content-Type')).toEqual('application/json');
  })
});
