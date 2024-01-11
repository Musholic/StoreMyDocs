import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {HomepageComponent} from "./homepage/homepage.component";
import {authGuard} from "./auth/auth.guard";
import {LoginComponent} from "./login/login.component";
import {RulesComponent} from "./rules/rules.component";
import {filesResolver} from "./files-cache/files.resolver";
import {UserRootComponent} from "./user-root/user-root.component";
import {FilesCacheService} from "./files-cache/files-cache.service";

const routes: Routes = [
  {
    path: '',
    component: UserRootComponent,
    canActivate: [authGuard],
    resolve: {files: filesResolver},
    runGuardsAndResolvers: () => {
      return FilesCacheService.shouldReloadRouteData();
    },
    children: [
      {
        path: 'rules',
        component: RulesComponent
      },
      {
        path: '',
        component: HomepageComponent,
      }
    ]
  },
  {
    path: 'login',
    component: LoginComponent
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
