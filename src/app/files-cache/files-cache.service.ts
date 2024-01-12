import {Injectable} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {FilesCache} from "./files.resolver";

@Injectable()
export class FilesCacheService {
  static reloadRouteData = false;

  constructor(private activatedRoute: ActivatedRoute, private router: Router) {
  }

  static shouldReloadRouteData() {
    if (FilesCacheService.reloadRouteData) {
      FilesCacheService.reloadRouteData = false;
      return true;
    }
    return false;
  }

  getBaseFolder() {
    return this.getFilesCache().baseFolder;
  }

  getAll() {
    return this.getFilesCache().all;
  }

  refreshCacheAndReload() {
    FilesCacheService.reloadRouteData = true;
    this.router.navigate([this.router.url], {
      onSameUrlNavigation: "reload"
    })
  }

  private getFilesCache(): FilesCache {
    return this.activatedRoute.snapshot.data["files"];
  }
}
