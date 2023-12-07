import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {HomepageComponent} from "./homepage/homepage.component";
import {authGuard} from "./auth/auth.guard";
import {LoginComponent} from "./login/login.component";
import {RulesComponent} from "./rules/rules.component";

const routes: Routes = [
  {
    path: '',
    component: HomepageComponent,
    canActivate: [authGuard]
  },
  {
    path: 'rules',
    component: RulesComponent,
    canActivate: [authGuard]
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
