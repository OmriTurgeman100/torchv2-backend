import { Request, Response, NextFunction } from "express";
import pool from "../database/database";
import AppError from "../utils/AppError";
import { CatchAsync } from "../utils/CatchAsync";

export const test = CatchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    res.status(200).json("test route");
  }
);
