import {Rule, RuleRepository} from "./rule.repository";
import {MockBuilder, MockInstance, MockRender} from "ng-mocks";
import {AppModule} from "../app.module";
import {db} from "../database/db";
import {mock} from "strong-mock";


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

  describe('findAll', () => {
    it('should list two rules', async () => {
      // Arrange
      const ruleRepository = MockRender(RuleRepository).point.componentInstance;
      let rule1: Rule = {
        name: 'TestRule',
        category: ['Test1', 'ChildTest1'],
        script: 'return true'
      };
      ruleRepository.create(rule1)
      let rule2: Rule = {
        name: 'TestRule2',
        category: ['Test2', 'ChildTest2'],
        script: 'return false'
      };
      ruleRepository.create(rule2)

      // Act
      let result = await ruleRepository.findAll();

      // Assert
      expect(result)
        .toEqual([{
          id: 1,
          name: 'TestRule',
          category: ['Test1', 'ChildTest1'],
          script: 'return true'
        }, {
          id: 2,
          name: 'TestRule2',
          category: ['Test2', 'ChildTest2'],
          script: 'return false'
        }]);
    });
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

export function mockRuleRepository() {
  let ruleRepositoryMock = mock<RuleRepository>();
  MockInstance(RuleRepository, (instance, injector) => {
    return {
      findAll: ruleRepositoryMock.findAll
    }
  });
  return ruleRepositoryMock;
}
