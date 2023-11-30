import {Injectable} from '@angular/core';
import {db} from "../database/db";

export interface Rule {
  id?: number;
  name: string;
  category: string[];
  script: string;
}

@Injectable({
  providedIn: 'root'
})
export class RuleRepository {

  constructor() {
  }

  create(rule: Rule) {
    db.rules.add(rule);
  }
}
