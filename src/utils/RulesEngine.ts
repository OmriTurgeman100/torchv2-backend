import pool from "../database/database";

class RulesEngine {
  parent: number | null;

  constructor(parent: number) {
    this.parent = parent;
  }

  async StartRulesEngine(): Promise<void> {
    try {
      while (this.parent != null) {
        const rule = await pool.query(
          "select * from rules where parent_node_id = $1;",
          [this.parent]
        );

        let rules_data = rule.rows[0].conditions[0];

        if (rules_data.report_id) {
          await this.Evaluate_Report_Rules();
        } else if (rules_data.node_id) {
          await this.Evaluate_Node_Rules();
        }
      }
    } catch (error) {
      console.error(error);
    }
  }

  async Evaluate_Report_Rules(): Promise<void> {
    try {
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
        const operator: string = rule.operator;
        const action: string = rule.action;

        let case_matched: boolean = false;

        for (const condition of rule.conditions) {
          switch (operator) {
            case ">":
              if (report_value > condition.threshold) {
                case_matched = true;
              }
              break;
            case "<":
              if (report_value < condition.threshold) {
                case_matched = true;
              }
              break;
            case "==":
              if (report_value == condition.threshold) {
                case_matched = true;
              }
              break;
            default:
              null;
          }
        }

        if (case_matched === true) {
          await this.Apply_Rules(action);
        }
      }

      const recursion = await pool.query(
        "select * from nodes where node_id = $1;",
        [this.parent]
      );

      this.parent = recursion.rows[0].parent;
    } catch (error) {
      console.error(error);
    }
  }

  async Evaluate_Node_Rules(): Promise<void> {
    try {
      const node_rules = await pool.query(
        "select * from rules where parent_node_id = $1;",
        [this.parent]
      );

      const nodes = await pool.query("select * from nodes where parent = $1", [
        this.parent,
      ]);

      for (const node_rule of node_rules.rows) {
        const operator: string = node_rule.operator;
        const action: string = node_rule.action;

        if (operator === "and") {
          let case_matched: boolean = true;
          for (const condition of node_rule.conditions) {
            const condition_node_id = condition.node_id;
            const condition_node_value = condition.value;

            for (const node of nodes.rows) {
              if (node.node_id === condition_node_id) {
                if (node.status !== condition_node_value) {
                  case_matched = false;
                  break;
                }
              }
            }

            if (case_matched) {
              this.Apply_Rules(action);
            }
          }
        } else if (operator === "or") {
          let case_matched: boolean = false;

          for (const condition of node_rule.conditions) {
            const condition_node_id = condition.node_id;
            const condition_node_value = condition.value;

            for (const node of nodes.rows) {
              if (node.node_id === condition_node_id) {
                if (node.status === condition_node_value) {
                  case_matched = true;
                }
              }
            }
          }

          if (case_matched) {
            this.Apply_Rules(action);
          }
        }
      }

      const recursion = await pool.query(
        "select * from nodes where node_id = $1;",
        [this.parent]
      );

      this.parent = recursion.rows[0].parent;
    } catch (error) {
      console.error(error);
    }
  }

  async Apply_Rules(action: string): Promise<void> {
    try {
      const rule_statement = await pool.query(
        "update nodes set status = $1 where node_id = $2",
        [action, this.parent]
      );
    } catch (error) {
      console.error(error);
    }
  }
}

export default RulesEngine;
