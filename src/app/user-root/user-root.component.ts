import {Component} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {FilesCache} from "../resolver/files.resolver";
import {DatabaseBackupAndRestoreService} from "../database/database-backup-and-restore.service";
import {RuleRepository} from "../rules/rule.repository";

@Component({
  selector: 'app-user-root',
  templateUrl: './user-root.component.html',
  styleUrls: ['./user-root.component.scss'],
  providers: [RuleRepository, DatabaseBackupAndRestoreService]
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
