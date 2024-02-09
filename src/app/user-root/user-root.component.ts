import {Component, HostListener} from '@angular/core';
import {DatabaseBackupAndRestoreService} from "../database/database-backup-and-restore.service";
import {RuleRepository} from "../rules/rule.repository";
import {FileUploadService} from "../file-upload/file-upload.service";
import {FilesCacheService} from "../files-cache/files-cache.service";
import {RuleService} from "../rules/rule.service";
import {BackgroundTaskService} from "../background-task/background-task.service";

@Component({
  selector: 'app-user-root',
  templateUrl: './user-root.component.html',
  styleUrls: ['./user-root.component.scss'],
  providers: [RuleRepository, RuleService, DatabaseBackupAndRestoreService, FileUploadService, FilesCacheService]
})
export class UserRootComponent {
  constructor(databaseBackupAndRestoreService: DatabaseBackupAndRestoreService, ruleService: RuleService,
              private backgroundTaskService: BackgroundTaskService) {
    databaseBackupAndRestoreService.restore()
      .subscribe(() => {
        ruleService.runAll().subscribe();
        // TODO: refresh after if there was any update to one of the file categories
      });
  }

  @HostListener('window:beforeunload')
  beforeUnload(): boolean {
    // Warn the user about running tasks before leaving the page
    return this.backgroundTaskService.isEmpty();
  }
}
