import pool from "../database/database";
import AppError from "./AppError";
import { CatchAsync } from "./CatchAsync";

class RulesEngine {
  parent: number | null;

  constructor(parnet: number) {
    this.parent = parnet;
  }

  async StartRulesEngine(): Promise<void> {

    while (this.parent != null ) {
        const rule = await pool.query("select * from rules where parent_node_id = $1;", [this.parent])
        

        let rules_data = rule.rows[0].conditions[0]

        // console.log(rules_data)

        console.log(`parent is ${this.parent}`)

        if (rules_data.report_id) {
            // console.log('eval report rules')

            await this.Evaluate_Report_Rules()

        } else if (rules_data.node_id) {
            console.log('eval node rules')
            await this.Evaluate_Node_Rules()

        }

    }

    if (this.parent == null) {
        console.log(`loop ended, parent is ${this.parent}, ${typeof this.parent}`)
       
    }
  }


  async Evaluate_Report_Rules(): Promise<void> {

    console.log(`hey from eval report rules parent is ${this.parent}`)

    const report_rule = await pool.query("select * from rules where parent_node_id = $1;", [this.parent])

    console.log(`report rules are`)

    console.log(report_rule.rows)

    const recursion = await pool.query("select * from nodes where node_id = $1;", [this.parent])

    console.log(recursion.rows[0].parent)


    this.parent = recursion.rows[0].parent

  }

  async Evaluate_Node_Rules(): Promise<void> {
    // console.log('hey from eval nodes')
    
    const node_rule = await pool.query("select * from rules where parent_node_id = $1;", [this.parent])

    const recursion = await pool.query("select * from nodes where node_id = $1;", [this.parent])

    this.parent = recursion.rows[0].parent

  }
}


export default RulesEngine;