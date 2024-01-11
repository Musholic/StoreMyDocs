import {Component} from '@angular/core';
import {DatabaseBackupAndRestoreService} from "../database/database-backup-and-restore.service";
import {RuleRepository} from "../rules/rule.repository";
import {FileUploadService} from "../file-upload/file-upload.service";
import {FilesCacheService} from "../files-cache/files-cache.service";

@Component({
  selector: 'app-user-root',
  templateUrl: './user-root.component.html',
  styleUrls: ['./user-root.component.scss'],
  providers: [RuleRepository, DatabaseBackupAndRestoreService, FileUploadService, FilesCacheService]
})
export class UserRootComponent {
  constructor() {
  }
}
