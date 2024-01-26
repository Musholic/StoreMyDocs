import {Injectable} from '@angular/core';
import {db} from "../database/db";
import {DatabaseBackupAndRestoreService} from "../database/database-backup-and-restore.service";

interface FileRun {
  id: string;
  value: boolean;
}

export interface Rule {
  id?: number;
  name: string;
  category: string[];
  script: string;
  // List of all file ids the rule was already run on to avoid running the rule twice in the same condition
  fileRuns?: FileRun[];
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

  async update(rule: Rule) {
    if (rule.id) {
      await db.rules.update(rule.id, rule);
      // TODO: Postpone backup until the end of running all rules? Or don't show backup progress?
      //  Or don't upload it to google drive after each local backup? (and then only show message when uploading to google drive)
      this.databaseBackupAndRestoreService.backup().subscribe();
    }
  }
}
