import {RuleRepository} from "./rule.repository";
import {MockBuilder, MockRender} from "ng-mocks";
import {AppModule} from "../app.module";


describe('RuleRepository', () => {
  beforeEach(() => MockBuilder(RuleRepository, AppModule));

  it('should be created', () => {
    // Act
    const ruleRepository = MockRender(RuleRepository).point.componentInstance;

    // Assert
    expect(ruleRepository).toBeTruthy();
  });
});
