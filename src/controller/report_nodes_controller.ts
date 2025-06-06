import { Request, Response, NextFunction } from "express";
import pool from "../database/database";
import AppError from "../utils/AppError";
import { CatchAsync } from "../utils/CatchAsync";
import RulesEngine from "../utils/RulesEngine";
import { expired_tree_evaluation } from "../utils/UpdateTreeTime";
import { UpdateTreeTimeRecursion } from "../utils/ExpiredDataTree";
import moment from "moment-timezone";

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

interface RootNode {
  node_id: number;
  parent: null;
  title: string;
  description: string;
  status: string;
  excluded: string;
  time: Date;
}

export const get_root_nodes = CatchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const root_nodes = await pool.query<RootNode>(
      "select * from nodes where parent is null;"
    );

    const root_nodes_data: RootNode[] = root_nodes.rows;

    res.status(200).json({
      data: root_nodes_data,
    });
  }
);

export const delete_node = CatchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const node_id: string = req.params.id;

    const nodes_recursive_nodes_hierarchy_cte_query: string = `
    with recursive node_hierarchy as (
        select node_id, parent, title, description, status, excluded, time from nodes where node_id = $1
        union all
        select nodes.node_id, nodes.parent, nodes.title, nodes.description, nodes.status, nodes.excluded, nodes.time 
        from nodes inner join node_hierarchy on nodes.parent = node_hierarchy.node_id
    ) 
    select node_id from node_hierarchy;
    `;

    const nodes_hierarchy = await pool.query(
      nodes_recursive_nodes_hierarchy_cte_query,
      [node_id]
    );

    for (const node of nodes_hierarchy.rows) {
      const has_rules = await pool.query(
        "select * from rules where parent_node_id = $1",
        [node.node_id]
      );

      if (has_rules.rows.length > 0) {
        return next(
          new AppError(
            "Cannot delete this node. Please remove its associated rules first.",
            400
          )
        );
      }

      const has_report = await pool.query(
        "select * from reports where parent = $1",
        [node.node_id]
      );

      if (has_report.rows.length > 0) {
        return next(
          new AppError(
            "Please delete the report associated with this node.",
            400
          )
        );
      }

      const has_description = await pool.query(
        "select * from nodes_description where parent = $1",
        [node.node_id]
      );

      if (has_description.rows.length > 0) {
        return next(
          new AppError(
            "Please delete the description associated under this node.",
            400
          )
        );
      }
    }

    for (const node of nodes_hierarchy.rows) {
      await pool.query("delete from nodes where node_id = $1", [node.node_id]);
    }

    res.status(204).json({
      message: "Node has been successfully deleted.",
    });
  }
);

export const navigate_tree_data = CatchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const parent: string = req.params.id;

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

    let parent: number = req.body.parent;

    const title: string = req.body.title;

    const description: string = req.body.description;

    let value: number | boolean = req.body.value;

    if (value === true) {
      value = 1;
    } else if (value === false) {
      value = 0;
    }

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

    await UpdateTreeTimeRecursion(parent);

    await expired_tree_evaluation(); // * requires more testing, not optimal for production yet.
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
      "select distinct on (report_id) report_id, title, description from reports;"
    );

    res.status(200).json({
      reports: distinct_reports_list.rows,
    });
  }
);

export const set_node_excluded = CatchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const excluded_node = await pool.query(
      "update nodes set excluded = $1 where node_id = $2 returning *",
      [req.params.status, req.params.id]
    );

    res.json({
      message: "Node successfully excluded",
      node: excluded_node.rows[0],
    });
  }
);

export const display_node_templates = CatchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const node_templates = await pool.query("select * from node_templates;");

    res.status(200).json({
      node_templates: node_templates.rows,
    });
  }
);

export const create_node_templates = CatchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const template = req.body.template;

    const node_templates = await pool.query(
      "insert into node_templates (name) values ($1) returning *;",
      [template]
    );

    res.status(201).json({
      node_templates: node_templates.rows,
    });
  }
);

export const detach_report = CatchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const report_id: string = req.params.id;

    const selected_report = await pool.query(
      "select * from reports where report_id = $1 order by time desc limit 1;",
      [report_id]
    );

    const report_parent: number = selected_report.rows[0].parent;

    const has_rules = await pool.query(
      "select * from rules where parent_node_id = $1",
      [report_parent]
    );

    if (has_rules.rows.length > 0) {
      return next(new AppError("Please remove rules first", 400));
    }

    const detach_report_query = await pool.query(
      "update reports set parent = null where report_id = $1;",
      [report_id]
    );

    res.status(204).json({
      message: "report has been updated",
    });
  }
);

export const display_nodes_description = CatchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const parent: string = req.params.id;

    const specified_node_description = await pool.query(
      "select a.id, a.parent, nodes.title , a.team, a.contact, a.description from nodes_description a inner join nodes on a.parent = nodes.node_id where a.parent = $1;",
      [parent]
    );

    res.status(200).json({
      data: specified_node_description.rows,
    });
  }
);

export const insert_nodes_description = CatchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const parent: string = req.params.id;

    const team: string = req.body.team;

    const contact: string = req.body.contact;

    const description: string = req.body.description;

    const inserted_description = await pool.query(
      "insert into nodes_description (parent, team, contact, description) values ($1, $2, $3, $4) returning *;",
      [parent, team, contact, description]
    );

    res.status(201).json({
      data: inserted_description.rows,
    });
  }
);

export const update_nodes_description = CatchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const node_description_id: string = req.params.id;

    const team: string = req.body.team;

    const contact: string = req.body.contact;

    const description: string = req.body.description;

    if (!team && !contact && !description) {
      return next(new AppError("No data specified", 400));
    }

    if (team) {
      await pool.query("update nodes_description set team = $1 where id = $2", [
        team,
        node_description_id,
      ]);
    }

    if (contact) {
      await pool.query(
        "update nodes_description set contact = $1 where id = $2",
        [contact, node_description_id]
      );
    }

    if (description) {
      await pool.query(
        "update nodes_description set description = $1 where id = $2",
        [description, node_description_id]
      );
    }

    const modified_data = await pool.query(
      "select * from nodes_description where id = $1",
      [node_description_id]
    );

    res.status(200).json({
      data: modified_data.rows,
    });
  }
);

export const delete_node_description = CatchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const node_description_id: string = req.params.id;
    await pool.query("DELETE FROM nodes_description WHERE id = $1", [
      node_description_id,
    ]);

    res.status(200).json({
      message: `Node description with ID ${node_description_id} has been successfully deleted.`,
    });
  }
);

export const delete_rule = CatchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const rule_id: string = req.params.id;

    await pool.query("delete from rules where rule_id = $1;", [rule_id]);

    res.status(204).json({
      data: rule_id,
    });
  }
);

export const display_node_comments = CatchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const node_id: string = req.params.id;
    const filter: any = req.query.filter;

    const node_comments = await pool.query(
      `select * from node_comments where parent = $1 order by time ${filter}`,
      [node_id]
    );

    res.status(200).json({ data: node_comments.rows });
  }
);

export const insert_node_comments = CatchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const node_id: string = req.params.id;
    const comment: string = req.body.comment;

    const node_comments = await pool.query(
      "insert into node_comments (parent, comment) values ($1, $2) returning *;",
      [node_id, comment]
    );

    res.status(200).json({ data: node_comments.rows });
  }
);

export const delete_comment = CatchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const comment_id: string = req.params.id;

    const deleted_comment = await pool.query(
      "delete from node_comments where id = $1;",
      [comment_id]
    );

    res.status(204).json({
      message: deleted_comment.rows,
    });
  }
);

export const report_graph = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const report_id: string = req.params.id;
    const filter: string = req.params.filter;

    const report_time = await pool.query(
      `select value, time from reports where report_id = $1 and time >= now() - interval '${filter}' order by time asc;`,
      [report_id]
    );

    const israelTimeZone: string = "Asia/Jerusalem";

    const convertedRows = report_time.rows.map((row) => ({
      ...row,
      time: moment.utc(row.time).tz(israelTimeZone).format("YYYY-MM-DD HH:mm"),
    }));

    res.status(200).json({
      rows: report_time.rowCount,
      time_series_data: convertedRows,
    });
  }
);

export const path_hierarchy = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const node_id: string = req.params.id;

    const nodes_recursive_nodes_hierarchy_cte_query: string = `
    with recursive node_hierarchy as (
        select node_id, parent, title, description, status, excluded, time from nodes where node_id = $1
        union all
        select nodes.node_id, nodes.parent, nodes.title, nodes.description, nodes.status, nodes.excluded, nodes.time 
        from nodes inner join node_hierarchy on nodes.parent = node_hierarchy.node_id
    ) 
    select node_id as id, parent, title, status, 'node' as type from node_hierarchy;
    `;

    const report_recursive_nodes_hierarchy_cte_query: string = `
    with report_related_to_node AS (
      select distinct on (reports.report_id) reports.report_id, reports.title, reports.id, reports.value, reports.parent 
      FROM reports where parent = $1
    ) 
    select id, parent, title, value as status, 'report' as type from report_related_to_node;
  `;

    const nodes_hierarchy = await pool.query(
      nodes_recursive_nodes_hierarchy_cte_query,
      [node_id]
    );

    const node_hierarchy = [];

    for (const node of nodes_hierarchy.rows) {
      node_hierarchy.push(node);
      const node_id: number = node.id;

      const has_report = await pool.query(
        report_recursive_nodes_hierarchy_cte_query,
        [node_id]
      );

      if (has_report.rows.length > 0) {
        node_hierarchy.push(has_report.rows[0]);
      }
    }

    let has_null_parent: boolean = false;
    for (const node of node_hierarchy) {
      if (node.parent === null) {
        has_null_parent = true;
        break;
      }
    }

    if (has_null_parent === false) {
      node_hierarchy[0].parent = null;
    }

    res.status(200).json({
      data: node_hierarchy,
    });
  }
);

export const display_active_path = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const node_id: string = req.params.id;

    const recursive_active_node_path_query = `
    with recursive node_hierarchy as (
        select node_id, parent, title, status 
        from nodes 
        where node_id = $1
        union all
        select nodes.node_id, nodes.parent, nodes.title, nodes.status
        from nodes 
        inner join node_hierarchy on nodes.node_id = node_hierarchy.parent
    ) 
    select * from node_hierarchy order by node_id asc;
`;

    const active_node_path = await pool.query(
      recursive_active_node_path_query,
      [node_id]
    );

    res.status(200).json({
      data: active_node_path.rows,
    });
  }
);
