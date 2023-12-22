import {Component} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {FilesCache} from "../resolver/files.resolver";

@Component({
  selector: 'app-user-root',
  templateUrl: './user-root.component.html',
  styleUrls: ['./user-root.component.scss']
})
export class UserRootComponent {
  static reloadRouteData = false;

  constructor(private activatedRoute: ActivatedRoute, private router: Router) {
  }

  static shouldReloadRouteData() {
    if (UserRootComponent.reloadRouteData) {
      UserRootComponent.reloadRouteData = false;
      return true;
    }
    return false;
  }

  getFilesCache(): FilesCache {
    return this.activatedRoute.snapshot.data["files"];
  }

  refreshCacheAndReload() {
    UserRootComponent.reloadRouteData = true;
    this.router.navigate([this.router.url], {
      onSameUrlNavigation: "reload"
    })
  }
}
