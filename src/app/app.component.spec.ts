import {AppComponent} from './app.component';
import {MockBuilder, MockRender} from "ng-mocks";
import {AppModule} from "./app.module";

describe('AppComponent', () => {
  beforeEach(() => MockBuilder(AppComponent, AppModule))

  it('should create the app', () => {
    let component = MockRender(AppComponent).point.componentInstance;
    expect(component).toBeTruthy();
  });
});
