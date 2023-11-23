import {Component} from '@angular/core';
import {RuleService} from "./rule.service";

interface Rule {
  name: string;
  description: string;
  script: string;
}

@Component({
  selector: 'app-rules',
  templateUrl: './rules.component.html',
  styleUrls: ['./rules.component.scss']
})
export class RulesComponent {
  rules: Rule[] = [{
    name: 'Electric bill',
    description: 'Detect electric bills',
    script: 'return fileName === "electric_bill.pdf"'
  }, {
    name: 'Bank account statement',
    description: '...',
    script: 'return fileName === "bank_account_statement.pdf"'
  }];

  constructor(private ruleService: RuleService) {
  }

  runAll() {
    this.ruleService.runAll();
  }
}
