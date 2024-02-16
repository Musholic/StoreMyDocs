import {Rule, RuleRepository} from "./rule.repository";
import {MockBuilder, MockInstance, MockRender, ngMocks} from "ng-mocks";
import {AppModule} from "../app.module";
import {db} from "../database/db";
import {mock, when} from "strong-mock";
import {dbCleanUp} from "../../testing/common-testing-function.spec";
import {DatabaseBackupAndRestoreService} from "../database/database-backup-and-restore.service";


function mockBackupCall() {
  const databaseBackupAndRestoreService = ngMocks.get(DatabaseBackupAndRestoreService);
  return when(() => databaseBackupAndRestoreService.scheduleBackup())
    .thenReturn();
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
      const rule1: Rule = {
        name: 'TestRule',
        category: ['Test1', 'ChildTest1'],
        script: 'return true'
      };
      await ruleRepository.create(rule1)
      const rule2: Rule = {
        name: 'TestRule2',
        category: ['Test2', 'ChildTest2'],
        script: 'return false'
      };
      await ruleRepository.create(rule2)

      // Act
      const result = await ruleRepository.findAll();

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
      const rule: Rule = {
        name: 'TestRule',
        category: ['Test1', 'ChildTest1'],
        script: 'return true'
      };

      // Act
      await ruleRepository.create(rule)

      // Assert
      const rules = await db.rules.toArray();
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
      const rule: Rule = {
        name: 'TestRule',
        category: ['Test1', 'ChildTest1'],
        script: 'return true'
      };
      await ruleRepository.create(rule)

      // Act
      await ruleRepository.delete(rule);

      // Assert
      const rules = await db.rules.toArray();
      expect(rules).toEqual([]);
    });
  });

  describe('update', () => {
    it('should update an existing rule', async () => {
      // Arrange
      const ruleRepository = MockRender(RuleRepository).point.componentInstance;
      // 2 calls to 'backup' then 'scheduleBackup' expected, from create, and then from update
      const databaseBackupAndRestoreService = ngMocks.get(DatabaseBackupAndRestoreService);
      mockBackupCall();
      when(() => databaseBackupAndRestoreService.scheduleBackup()).thenReturn();

      const rule: Rule = {
        name: 'TestRule',
        category: ['Test1', 'ChildTest1'],
        script: 'return true'
      };
      await ruleRepository.create(rule)
      rule.name = 'TestRule edited';

      // Act
      await ruleRepository.update(rule)

      // Assert
      const rules = await db.rules.toArray();
      expect(rules)
        .toEqual([{
          id: 1,
          name: 'TestRule edited',
          category: ['Test1', 'ChildTest1'],
          script: 'return true'
        }]);
    })
  })
});

export function mockRuleRepository() {
  const ruleRepositoryMock = mock<RuleRepository>();
  MockInstance(RuleRepository, (instance, injector) => {
    return {
      findAll: ruleRepositoryMock.findAll
    }
  });
  return ruleRepositoryMock;
}
