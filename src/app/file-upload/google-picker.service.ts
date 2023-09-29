import {Injectable} from '@angular/core';
import {GoogleDriveAuthService} from "./google-drive-auth.service";

@Injectable({
  providedIn: 'root'
})
export class GooglePickerService {
  private readonly APP_ID = "99873064994";
  private readonly PICKER_DEV_KEY = 'AIzaSyBz1JtsBRO6zl01yU-yXAkIAcbn38N7TOw';

  constructor(private authService: GoogleDriveAuthService) {
  }

  async show(): Promise<void> {
    await new Promise<void>(resolve => {
      // Get the api token and load the picket before showing it
      this.authService.getApiToken().then(apiToken => {
        gapi.load('picker', () => {
          const view = new google.picker.DocsView(google.picker.ViewId.DOCS);
          // Allow folder selection, and start from the root to simplify file selection
          view.setIncludeFolders(true);
          view.setParent('root');

          const picker = new google.picker.PickerBuilder()
            .addView(view)
            .setOAuthToken(apiToken)
            .setAppId(this.APP_ID)
            .setDeveloperKey(this.PICKER_DEV_KEY)
            .setCallback(result => {
              // Only resolve when the user picked a file
              if (result["action"] === 'picked') {
                resolve();
              }
            })
            .build();

          // Show the picker
          picker.setVisible(true);
        })
      })
    });
  }
}
