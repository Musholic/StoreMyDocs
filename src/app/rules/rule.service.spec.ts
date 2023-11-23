import {RuleService} from './rule.service';
import {MockBuilder, MockRender} from "ng-mocks";
import {AppModule} from "../app.module";

describe('RuleService', () => {
  beforeEach(() => MockBuilder(RuleService, AppModule));

  it('should be created', () => {
    // Act
    const service = MockRender(RuleService).point.componentInstance;

    // Assert
    expect(service).toBeTruthy();
  });
});
