import Dexie, {Table} from 'dexie';
import {Rule} from "../rules/rule.repository";

export class AppDB extends Dexie {
  rules!: Table<Rule, number>;

  constructor() {
    super('ngdexieliveQuery');
    this.createSchema();
  }

  // Public for testing
  createSchema() {
    this.version(3).stores({
      rules: '++id',
    });
  }
}

export const db = new AppDB();
