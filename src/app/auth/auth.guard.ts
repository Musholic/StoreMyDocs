import {CanActivateFn, Router} from '@angular/router';
import {inject} from "@angular/core";
import {GoogleDriveAuthService} from "../file-upload/google-drive-auth.service";

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  let googleDriveAuthService = inject(GoogleDriveAuthService);
  if (!googleDriveAuthService.isAuthenticatedAndHasValidApiToken()) {
    return router.parseUrl('/login')
  }
  return true;
};
