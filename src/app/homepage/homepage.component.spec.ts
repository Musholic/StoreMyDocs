import {HomepageComponent} from './homepage.component';
import {MockBuilder, MockRender} from "ng-mocks";
import {AppModule} from "../app.module";

describe('HomepageComponent', () => {

  beforeEach(() => MockBuilder(HomepageComponent, AppModule));

  it('should create', () => {
    const component = MockRender(HomepageComponent).point.componentInstance;
    expect(component).toBeTruthy();
  });
});
