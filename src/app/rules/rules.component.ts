import {Component} from '@angular/core';
import {RuleService} from "./rule.service";
import {ENTER} from "@angular/cdk/keycodes";
import {MatChipInputEvent} from "@angular/material/chips";
import {Rule} from "./rule.repository";
import {Router} from "@angular/router";


@Component({
  selector: 'app-rules',
  templateUrl: './rules.component.html',
  styleUrls: ['./rules.component.scss']
})
export class RulesComponent {
  readonly separatorKeysCodes = [ENTER] as const;

  rules: Rule[] = [];
  ruleToCreateOrUpdate?: Rule = undefined;

  constructor(private ruleService: RuleService, private router: Router) {
    this.ruleService.findAll()
      .then(rules => {
        this.rules = rules;
      })
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
        // Reset fileRuns to ensure we will automatically re-run the rule
        this.ruleToCreateOrUpdate.fileRuns = [];
        this.ruleService.update(this.ruleToCreateOrUpdate)
          .then(() => {
            this.cancelCreateOrUpdate();
            this.refresh();
          })
      }
    }
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
    // Reload page
    this.router.navigate([this.router.url], {onSameUrlNavigation: "reload"});
  }
}
