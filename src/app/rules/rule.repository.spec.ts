import {Rule, RuleRepository} from "./rule.repository";
import {MockBuilder, MockRender} from "ng-mocks";
import {AppModule} from "../app.module";
import {db} from "../database/db";


describe('RuleRepository', () => {
  beforeEach(() => MockBuilder(RuleRepository, AppModule));

  // Db cleanup after each test
  afterEach(() => db.delete());

  it('should be created', () => {
    // Act
    const ruleRepository = MockRender(RuleRepository).point.componentInstance;

    // Assert
    expect(ruleRepository).toBeTruthy();
  });

  describe('create', () => {
    it('should persist a new rule', async () => {
      // Arrange
      const ruleRepository = MockRender(RuleRepository).point.componentInstance;
      let rule: Rule = {
        name: 'TestRule',
        category: ['Test1', 'ChildTest1'],
        script: 'return true'
      };

      // Act
      ruleRepository.create(rule)

      // Assert
      let rules = await db.rules.toArray();
      expect(rules)
        .toEqual([{
          id: 1,
          name: 'TestRule',
          category: ['Test1', 'ChildTest1'],
          script: 'return true'
        }]);
    })
  })
});
