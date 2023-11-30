import {Component} from '@angular/core';
import {RuleService} from "./rule.service";
import {ENTER} from "@angular/cdk/keycodes";
import {MatChipInputEvent} from "@angular/material/chips";
import {Rule} from "./rule.repository";


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
  readonly separatorKeysCodes = [ENTER] as const;

  rules = SAMPLE_RULES;
  showCreate: boolean = false;
  ruleToCreate: Rule = {
    name: '',
    category: [],
    script: ''
  };

  constructor(private ruleService: RuleService) {
  }

  runAll() {
    this.ruleService.runAll().subscribe();
  }

  add(event: MatChipInputEvent) {
    this.ruleToCreate.category.push(event.value);
    event.chipInput.clear();
  }

  createNewRule() {
    this.ruleService.create(this.ruleToCreate);
  }
}
