import {Component} from '@angular/core';
import {RuleService} from "./rule.service";
import {ENTER} from "@angular/cdk/keycodes";
import {MatChipInputEvent} from "@angular/material/chips";
import {Rule} from "./rule.repository";


@Component({
  selector: 'app-rules',
  templateUrl: './rules.component.html',
  styleUrls: ['./rules.component.scss']
})
export class RulesComponent {
  readonly separatorKeysCodes = [ENTER] as const;

  rules: Rule[] = [];
  showCreate: boolean = false;
  ruleToCreate: Rule = {
    name: '',
    category: [],
    script: ''
  };

  constructor(private ruleService: RuleService) {
    this.refresh();
  }

  createNewRule() {
    this.ruleService.create(this.ruleToCreate)
      .then(() => {
        this.showCreate = false;
        this.ruleToCreate = {
          name: '',
          category: [],
          script: ''
        };
        this.refresh();
      })
  }

  runAll() {
    this.ruleService.runAll().subscribe();
  }

  add(event: MatChipInputEvent) {
    this.ruleToCreate.category.push(event.value);
    event.chipInput.clear();
  }

  private refresh() {
    this.ruleService.findAll()
      .then(rules => {
        this.rules = rules;
      })
  }
}
