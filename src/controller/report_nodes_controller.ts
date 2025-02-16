import { Request, Response, NextFunction } from "express";
import pool from "../database/database";
import AppError from "../utils/AppError";
import { CatchAsync } from "../utils/CatchAsync";

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
