import {RulesComponent} from './rules.component';
import {MockBuilder, MockRender} from "ng-mocks";
import {AppModule} from "../app.module";

describe('RulesComponent', () => {
  beforeEach(() => MockBuilder(RulesComponent, AppModule));

  it('should create', () => {
    let component = MockRender(RulesComponent).point.componentInstance;
    expect(component).toBeTruthy();
  });
});
