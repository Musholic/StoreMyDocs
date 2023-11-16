import {TitleHeaderComponent} from './title-header.component';
import {MockBuilder, MockRender} from "ng-mocks";
import {AppModule} from "../app.module";

describe('TitleHeaderComponent', () => {
  beforeEach(() => MockBuilder(TitleHeaderComponent, AppModule))

  it('should create', () => {
    let component = MockRender(TitleHeaderComponent).point.componentInstance;
    expect(component).toBeTruthy();
  });
});
