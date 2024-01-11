import {Rule, RuleRepository} from "./rule.repository";
import {MockBuilder, MockInstance, MockRender, ngMocks} from "ng-mocks";
import {AppModule} from "../app.module";
import {db} from "../database/db";
import {mock, when} from "strong-mock";
import {dbCleanUp, mustBeConsumedAsyncObservable} from "../../testing/common-testing-function.spec";
import {HttpEventType, HttpResponse} from "@angular/common/http";
import {DatabaseBackupAndRestoreService} from "../database/database-backup-and-restore.service";


function mockBackupCall() {
  let databaseBackupAndRestoreService = ngMocks.get(DatabaseBackupAndRestoreService);
  return when(() => databaseBackupAndRestoreService.backup())
    .thenReturn(mustBeConsumedAsyncObservable({type: HttpEventType.Response} as HttpResponse<any>));
}

describe('RuleRepository', () => {
  beforeEach(() => MockBuilder(RuleRepository, AppModule)
    .provide({
      provide: DatabaseBackupAndRestoreService,
      useValue: mock<DatabaseBackupAndRestoreService>()
    })
  );

  // Db cleanup after each test
  afterEach(async () => {
    await dbCleanUp();
  });

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
      mockBackupCall().times(2);
      let rule1: Rule = {
        name: 'TestRule',
        category: ['Test1', 'ChildTest1'],
        script: 'return true'
      };
      await ruleRepository.create(rule1)
      let rule2: Rule = {
        name: 'TestRule2',
        category: ['Test2', 'ChildTest2'],
        script: 'return false'
      };
      await ruleRepository.create(rule2)

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
      mockBackupCall();
      let rule: Rule = {
        name: 'TestRule',
        category: ['Test1', 'ChildTest1'],
        script: 'return true'
      };

      // Act
      await ruleRepository.create(rule)

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

  describe('delete', () => {
    it('should delete one rule', async () => {
      // Arrange

      const ruleRepository = MockRender(RuleRepository).point.componentInstance;
      // 2 calls to 'backup' expected, from create, and then from delete
      mockBackupCall().times(2);
      let rule: Rule = {
        name: 'TestRule',
        category: ['Test1', 'ChildTest1'],
        script: 'return true'
      };
      await ruleRepository.create(rule)

      // Act
      await ruleRepository.delete(rule);

      // Assert
      let rules = await db.rules.toArray();
      expect(rules).toEqual([]);
    });
  });
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
