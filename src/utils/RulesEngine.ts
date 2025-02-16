import pool from "../database/database";
import AppError from "./AppError";
import { CatchAsync } from "./CatchAsync";

class RulesEngine {
  parent: number | null;

  constructor(parnet: number) {
    this.parent = parnet;
  }

  async StartRulesEngine(): Promise<void> {
    while (this.parent != null) {
      const rule = await pool.query(
        "select * from rules where parent_node_id = $1;",
        [this.parent]
      );

      let rules_data = rule.rows[0].conditions[0];

      // console.log(rules_data)

      // console.log(`parent is ${this.parent}`)

      if (rules_data.report_id) {
        // console.log('eval report rules')

        await this.Evaluate_Report_Rules();
      } else if (rules_data.node_id) {
        // console.log('eval node rules')
        await this.Evaluate_Node_Rules();
      }
    }

    if (this.parent == null) {
      console.log(
        `loop ended, parent is ${this.parent}, ${typeof this.parent}`
      );
    }
  }

  async Evaluate_Report_Rules(): Promise<void> {
    const report = await pool.query(
      "SELECT DISTINCT ON (report_id) report_id, parent, title, description, value, excluded, time FROM reports WHERE parent = $1 ORDER BY report_id, time DESC;",
      [this.parent]
    );

    const report_value: number = report.rows[0].value;

    const report_rule = await pool.query(
      "select * from rules where parent_node_id = $1;",
      [this.parent]
    );

    for (const rule of report_rule.rows) {
      const operator = rule.operator;
      const action = rule.action;

      let case_matched: boolean = false;

      for (const condition of rule.conditions) {
        switch (operator) {
          case ">":
            if (report_value > condition.threshold) {
              case_matched = true;
              // console.log(1);
            }
            break;
          case "<":
            if (report_value < condition.threshold) {
              case_matched = true;
              // console.log(2);
            }
            break;
          case "==":
            if (report_value == condition.threshold) {
              case_matched = true;
              // console.log(3);
            }
            break;
          default:
            null;
        }
      }

      // console.log(case_matched, action);

      if (case_matched === true) {
        await this.Apply_Rules(action);
      }
    }

    const recursion = await pool.query(
      "select * from nodes where node_id = $1;",
      [this.parent]
    );

    this.parent = recursion.rows[0].parent;
  }

  async Evaluate_Node_Rules(): Promise<void> {
    const node_rules = await pool.query(
      "select * from rules where parent_node_id = $1;",
      [this.parent]
    );

    // console.log(`node rule rows`)
    // console.log(node_rules.rows)

    for (const node_rule of node_rules.rows) {

      console.log(node_rule)

      

    }




    const nodes = await pool.query("select * from nodes where parent = $1", [this.parent])

    // console.log(`nodes are `)

    // console.log(nodes.rows)

    // for (node )

    const recursion = await pool.query(
      "select * from nodes where node_id = $1;",
      [this.parent]
    );

    this.parent = recursion.rows[0].parent;
  }

  async Apply_Rules(action: boolean): Promise<void> {
    const rule_statement = await pool.query(
      "update nodes set status = $1 where node_id = $2",
      [action, this.parent]
    );
  }
}

export default RulesEngine;
