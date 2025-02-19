import { Request, Response, NextFunction } from "express";
import pool from "../database/database";
import AppError from "../utils/AppError";
import { CatchAsync } from "../utils/CatchAsync";
import RulesEngine from "../utils/RulesEngine";
import { expired_tree_evaluation } from "../utils/UpdateTreeTime";

export const post_nodes = CatchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const parent: number | undefined = req.body.parent;

    const title: string = req.body.title;

    const description: string = req.body.description;

    const report = await pool.query(
      "select * from reports where parent = $1;",
      [parent]
    );

    if (report.rows.length > 0) {
      return next(
        new AppError("Report is already attached under this node", 400)
      );
    }

    const nodes = await pool.query(
      "insert into nodes (parent, title, description) values ($1, $2, $3) returning *;",
      [parent, title, description]
    );
    res.status(201).json({
      message: "Node created successfully",
      data: nodes.rows[0],
    });
  }
);

export const get_root_nodes = CatchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const root_nodes = await pool.query(
      "select * from nodes where parent is null;"
    );

    res.status(200).json({
      data: root_nodes.rows,
    });
  }
);

export const delete_node = CatchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const node_id = req.params.id;

    const has_rules = await pool.query(
      "select * from rules where parent_node_id = $1",
      [node_id]
    );

    if (has_rules.rows.length > 0) {
      return next(
        new AppError(
          "Cannot delete this node. Please remove its associated rules first.",
          400
        )
      );
    }

    const delete_query = await pool.query(
      "delete from nodes where node_id = $1",
      [node_id]
    );

    res.status(200).json({
      data: "test",
    });
  }
);

export const navigate_tree_data = CatchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const parent = req.params.id;

    const reports = await pool.query(
      "select distinct on (report_id) report_id, parent, title, description, value, excluded, time from reports where parent = $1 order by report_id, time desc;",
      [parent]
    );

    const nodes = await pool.query("select * from nodes where parent = $1;", [
      parent,
    ]);

    res.status(200).json({
      nodes: nodes.rows,
      reports: reports.rows,
    });
  }
);

export const BlackBox_Scripts = CatchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const report_id: string = req.body.report_id;

    let parent: any = req.body.parent;

    const title: string = req.body.title;

    const description: string = req.body.description;

    const value: number = req.body.value;

    const nodes_under_parent = await pool.query(
      "select * from nodes where parent = $1",
      [parent]
    );

    if (nodes_under_parent.rows.length > 0) {
      return next(
        new AppError(
          "Reports and nodes cannot be placed under the same parent.",
          400
        )
      );
    }

    const check_another_report_same_parent = await pool.query(
      "select distinct(report_id), parent from reports where parent = $1;",
      [parent]
    );

    if (check_another_report_same_parent.rows.length > 0) {
      for (const report of check_another_report_same_parent.rows) {
        if (report.report_id != report_id) {
          return next(
            new AppError("Report with the same parent already exists", 400)
          );
        }
      }
    }

    if (parent) {
      const report_from_database = await pool.query(
        "select distinct(report_id), parent, time from reports where report_id = $1 order by time desc limit 1;",
        [report_id]
      );

      if (report_from_database.rows[0].parent != null) {
        if (report_from_database.rows[0].parent !== parent) {
          return next(
            new AppError(
              "This report is already associated with a different parent.",
              400
            )
          );
        }
      }
    }

    const existing_report = await pool.query(
      "select * from reports where report_id = $1 order by time desc limit 1;",
      [report_id]
    );

    if (existing_report.rows.length > 0) {
      if (existing_report.rows[0].parent != null) {
        parent = existing_report.rows[0].parent;
      }
    }

    const inserted_report = await pool.query(
      "insert into reports (report_id, parent, title, description, value) values ($1, $2, $3, $4, $5);",
      [report_id, parent, title, description, value]
    );

    const rule = new RulesEngine(parent);

    await rule.StartRulesEngine();

    await expired_tree_evaluation(parent);
    //TODO 1, make is automatic node which checks for expired, and recursively updates the parent if finfs one,

    // TODO 2, when new report arrive, make them check if any entity is expird

    //! must implement both so they won't overrride each other

    res.status(201).json({
      message: "Report inserted successfully.",
    });
  }
);

export const get_rules = CatchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const parent_node_id: string = req.params.id;

    const related_rules = await pool.query(
      "select * from rules where parent_node_id = $1;",
      [parent_node_id]
    );

    res.status(200).json({
      data: related_rules.rows,
    });
  }
);

export const post_rules = CatchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const parent_id: string = req.params.id;
    const { action, conditions, operator } = req.body;

    if (!parent_id || !conditions || !action || !operator) {
      return next(
        new AppError(
          "Conditions, action, operator and parent Id are required",
          400
        )
      );
    }

    const rules = await pool.query(
      "insert into rules (parent_node_id, conditions, action, operator) values ($1, $2, $3, $4);",
      [parent_id, JSON.stringify(conditions), action, operator] // * must jsonify the data, postgres accept values as bson
    );

    res.status(201).json({ message: "Rule created successfully" });
  }
);

export const distinct_reports = CatchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const distinct_reports_list = await pool.query(
      "select distinct(report_id), title, description from reports;"
    );

    res.status(200).json({
      reports: distinct_reports_list.rows,
    });
  }
);
