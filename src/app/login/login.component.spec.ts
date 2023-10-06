import {LoginComponent} from './login.component';
import {MockBuilder, MockRender} from "ng-mocks";
import {AppModule} from "../app.module";

describe('LoginComponent', () => {
  beforeEach(() => MockBuilder(LoginComponent, AppModule));

  it('should create', () => {
    let component = MockRender(LoginComponent).point.componentInstance;
    expect(component).toBeTruthy();
  });
});
