import {Component, OnInit} from '@angular/core';
import {GoogleDriveAuthService} from "../file-upload/google-drive-auth.service";
import {Router} from "@angular/router";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  constructor(private authService: GoogleDriveAuthService, private router: Router) {
  }

  ngOnInit() {
    // Automatically ask for authorization if already authenticated
    if(this.authService.isAuthenticated()) {
      this.authorize();
    }
  }

  isAuthenticated() {
    return this.authService.isAuthenticated();
  }

  async authorize() {
    await this.authService.getApiToken();
    return this.router.navigateByUrl('/');
  }
}
