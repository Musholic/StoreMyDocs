import {FooterComponent} from './footer.component';
import {MockBuilder, MockRender} from "ng-mocks";
import {AppModule} from "../app.module";

describe('FooterComponent', () => {

  beforeEach(() => MockBuilder(FooterComponent, AppModule))

  it('should create', () => {
    const component = MockRender(FooterComponent).point.componentInstance;
    expect(component).toBeTruthy();
  });
});
