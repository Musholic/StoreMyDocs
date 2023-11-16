import {Injectable} from '@angular/core';
import {HTTP_INTERCEPTORS, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {Observable} from 'rxjs';
import {GoogleDriveAuthService} from "../file-upload/google-drive-auth.service";

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private authService: GoogleDriveAuthService) {
  }

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Get the auth token from the service.
    const authToken = this.authService.getApiToken();

    // Clone the request and replace the original headers with
    // cloned headers, updated with the authorization.
    const authRequest = request.clone({
      headers: request.headers.set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json')
    });

    // send cloned request with header to the next handler.
    return next.handle(authRequest);
  }
}

export const httpInterceptorProviders = [
  {provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true},
];
