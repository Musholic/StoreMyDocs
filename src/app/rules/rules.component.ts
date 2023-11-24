import {Component} from '@angular/core';
import {RuleService} from "./rule.service";

export interface Rule {
  name: string;
  category: string[];
  script: string;
}

export const SAMPLE_RULES: Rule[] = [{
  name: 'Electric bill',
  category: ['Electricity', 'Bills'],
  script: 'return fileName === "electricity_bill.pdf"'
}, {
  name: 'Bank account statement',
  category: ['Bank', 'Account statement'],
  script: 'return false'
}];

@Component({
  selector: 'app-rules',
  templateUrl: './rules.component.html',
  styleUrls: ['./rules.component.scss']
})
export class RulesComponent {
  rules = SAMPLE_RULES;

  constructor(private ruleService: RuleService) {
  }

  runAll() {
    this.ruleService.runAll().subscribe();
  }
}
