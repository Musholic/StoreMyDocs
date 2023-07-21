import {AfterViewInit, Component, NgZone} from '@angular/core';
import {GoogleDriveAuthService} from "../file-upload/google-drive-auth.service";
import {accounts} from "google-one-tap";

@Component({
    selector: 'app-nav-bar',
    templateUrl: './nav-bar.component.html',
    styleUrls: ['./nav-bar.component.scss']
})
export class NavBarComponent implements AfterViewInit {
    public GOOGLE_CLIENT_ID = '99873064994-bn94ep45ugmo6u1s3fl3li84fr3olvnv.apps.googleusercontent.com';

    constructor(private authService: GoogleDriveAuthService, public zone: NgZone) {
    }

    ngAfterViewInit() {
        // @ts-ignore
        const gAccounts: accounts = google.accounts;

        gAccounts.id.initialize({
            client_id: this.GOOGLE_CLIENT_ID,
            context: "signin",
            ux_mode: 'popup',
            auto_select: true,
            callback: ({credential}) => {
                this.zone.run(() => {
                    this.authService.authenticate(credential);
                });
            },
        });

        gAccounts.id.renderButton(document.getElementById('gbtn') as HTMLElement, {
            size: 'large',
            type: "standard",
            shape: "rectangular",
            theme: "outline",
            text: "signin",
            logo_alignment: "left"
        });

        if (!this.authService.isAuthenticated()) {
            // For automatic sign in with One Tap
            gAccounts.id.prompt();
        }

    }

    isAuthenticated() {
        return this.authService.isAuthenticated();
    }

    getUserPicture() {
        return this.authService.getAuthToken()?.picture;
    }

    getUserName() {
        return this.authService.getAuthToken()?.name;
    }

    getUserMail() {
        return this.authService.getAuthToken()?.email;
    }

    logout() {
        this.authService.logout();
    }
}
