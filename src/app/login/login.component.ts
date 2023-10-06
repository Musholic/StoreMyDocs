import {Component} from '@angular/core';
import {GoogleDriveAuthService} from "../file-upload/google-drive-auth.service";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {

  constructor(private authService: GoogleDriveAuthService) {
  }

  isAuthenticated() {
    return this.authService.isAuthenticated();
  }
}
