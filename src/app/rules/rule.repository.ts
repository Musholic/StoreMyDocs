import {Injectable} from '@angular/core';
import {db} from "../database/db";
import {DatabaseBackupAndRestoreService} from "../database/database-backup-and-restore.service";

export interface Rule {
  id?: number;
  name: string;
  category: string[];
  script: string;
}

@Injectable()
export class RuleRepository {

  constructor(private databaseBackupAndRestoreService: DatabaseBackupAndRestoreService) {
  }

  async create(rule: Rule) {
    await db.rules.add(rule);
    this.databaseBackupAndRestoreService.backup().subscribe();
  }

  findAll(): Promise<Rule[]> {
    return db.rules.toArray();
  }

  async delete(rule: Rule) {
    if (rule.id) {
      await db.rules.delete(rule.id);
      this.databaseBackupAndRestoreService.backup().subscribe();
    }
  }
}
