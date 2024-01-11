import {UserRootComponent} from './user-root.component';
import {MockBuilder, MockRender} from "ng-mocks";
import {AppModule} from "../app.module";

describe('UserRootComponent', () => {
  beforeEach(() => MockBuilder(UserRootComponent, AppModule))

  it('should create', () => {
    let component = MockRender(UserRootComponent).point.componentInstance;
    expect(component).toBeTruthy();
  });
});
