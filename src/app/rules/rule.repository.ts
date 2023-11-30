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

  create(rule: Rule): Promise<void> {
    return db.rules.add(rule).then();
  }

  findAll(): Promise<Rule[]> {
    return db.rules.toArray();
  }
}
