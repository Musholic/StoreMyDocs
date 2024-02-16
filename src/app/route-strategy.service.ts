import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, BaseRouteReuseStrategy, RouteReuseStrategy} from "@angular/router";
import {UserRootComponent} from "./user-root/user-root.component";

@Injectable()
export class MyRouteReuseStrategy extends BaseRouteReuseStrategy {

  override shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    if (future.component === UserRootComponent) {
      // The UserRootComponent may have refreshed its data, so we should not reuse the route
      return false;
    }
    return super.shouldReuseRoute(future, curr);
  }
}

export const routeReuseStrategyProvider = {provide: RouteReuseStrategy, useClass: MyRouteReuseStrategy}
