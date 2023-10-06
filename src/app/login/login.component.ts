import {Component} from '@angular/core';
import {GoogleDriveAuthService} from "../file-upload/google-drive-auth.service";
import {Router} from "@angular/router";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {

  constructor(private authService: GoogleDriveAuthService, private router: Router) {
  }

  isAuthenticated() {
    return this.authService.isAuthenticated();
  }

  async authorize() {
    await this.authService.getApiToken();
    return this.router.navigateByUrl('/');
  }
}
