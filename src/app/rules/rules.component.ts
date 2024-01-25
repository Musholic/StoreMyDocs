import {Component} from '@angular/core';
import {RuleService} from "./rule.service";
import {ENTER} from "@angular/cdk/keycodes";
import {MatChipInputEvent} from "@angular/material/chips";
import {Rule} from "./rule.repository";


@Component({
  selector: 'app-rules',
  templateUrl: './rules.component.html',
  styleUrls: ['./rules.component.scss'],
  providers: [RuleService]
})
export class RulesComponent {
  readonly separatorKeysCodes = [ENTER] as const;

  rules: Rule[] = [];
  ruleToCreateOrUpdate?: Rule = undefined;

  constructor(private ruleService: RuleService) {
    this.refresh();
  }

  createOrUpdateRule() {
    if (this.ruleToCreateOrUpdate) {
      if (!this.ruleToCreateOrUpdate.id) {
        this.ruleService.create(this.ruleToCreateOrUpdate)
          .then(() => {
            this.cancelCreateOrUpdate();
            this.refresh();
          })
      } else {
        this.ruleService.update(this.ruleToCreateOrUpdate)
          .then(() => {
            this.cancelCreateOrUpdate();
            this.refresh();
          })
      }
    }
  }

  runAll() {
    this.ruleService.runAll().subscribe();
  }

  add(event: MatChipInputEvent) {
    this.ruleToCreateOrUpdate?.category.push(event.value);
    event.chipInput.clear();
  }

  delete(rule: Rule) {
    this.ruleService.delete(rule)
      .then(() => {
        this.refresh();
      })
  }

  update(rule: Rule) {
    this.ruleToCreateOrUpdate = rule;
  }

  cancelCreateOrUpdate() {
    this.ruleToCreateOrUpdate = undefined;
  }

  showCreate() {
    this.ruleToCreateOrUpdate = {
      name: '',
      category: [],
      script: ''
    };
  }

  private refresh() {
    this.ruleService.findAll()
      .then(rules => {
        this.rules = rules;
      })
  }
}
