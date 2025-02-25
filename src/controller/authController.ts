import { Request, Response, NextFunction } from "express";
import pool from "../database/database";
import bcrypt from "bcryptjs";
import AppError from "../utils/AppError";
import jwt from "jsonwebtoken";
import { CatchAsync } from "../utils/CatchAsync";
import dotenv from "dotenv";

dotenv.config();

interface auth_request extends Request {
  user?: any;
}

export const register_users = CatchAsync(
  // todo NUMBER 1
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const name = req.body.username;

    const hashed_password = await bcrypt.hash(req.body.password, 10);

    const inserted_user = await pool.query(
      "insert into users (username, password) values ($1, $2) returning username,id;",
      [name, hashed_password]
    );

    const created_username: string = inserted_user.rows[0].username;

    const created_user_id: number = inserted_user.rows[0].id;

    const insert_default_image = await pool.query(
      "insert into user_images (user_id) values ($1)",
      [created_user_id]
    );

    res.status(201).json({
      status: "success",
      message: `User ${created_username} has been created successfully`,
    });
  }
);

export const login_users = CatchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const username: string = req.body.username;
    const request_password: string = req.body.password;

    const valid_user = await pool.query(
      "select * from users where username = $1",
      [username]
    );

    if (valid_user.rows.length === 0) {
      return next(new AppError("username or password is incorrect", 401));
    }

    const user_password: string = valid_user.rows[0].password;

    const user_name: string = valid_user.rows[0].username;

    const user_id: number = valid_user.rows[0].id;

    const user_role: string = valid_user.rows[0].role;

    const valid_password = await bcrypt.compare(
      request_password,
      user_password
    );

    if (!valid_password) {
      return next(new AppError("username or password is incorrect", 401));
    }

    const user = { user_name, user_id, user_role };

    const access_token = jwt.sign(
      user,
      process.env.JWT_SECRET_TOKEN as string,
      {
        expiresIn: "80d",
      }
    );

    // const refresh_token = jwt.sign(
    //   user,
    //   process.env.JWT_REFRESH_TOKEN as string,
    //   {
    //     expiresIn: "80d",
    //   }
    // );

    // res.cookie("refresh_token", refresh_token, { httpOnly: true });

    res.status(200).json({
      message: "login sucess",
      token: access_token,
    });
  }
);

export const authenticate_jwt_token = (
  req: auth_request,
  res: Response,
  next: NextFunction
): void => {
  let token: string | undefined;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(new AppError("No token provided", 401));
  }

  jwt.verify(token, process.env.JWT_SECRET_TOKEN as string, (error, user) => {
    if (error) {
      return next(new AppError("token has failed", 403));
    }

    req.user = user;

    next();
  });
};

export const refresh_user_token = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const refresh_token: string = req.cookies.refresh_token;

  if (refresh_token === null) {
    return next(new AppError("Unexcpected error", 401));
  }

  jwt.verify(
    refresh_token,
    process.env.JWT_REFRESH_TOKEN as string,
    (error, user) => {
      if (error) {
        return next(new AppError("token has failed", 403));
      }

      const { user_name, user_id, user_role } = user as {
        user_name: string;
        user_id: string;
        user_role: string;
      };

      const user_data = { user_name, user_id, user_role };

      const access_token = jwt.sign(
        user_data,
        process.env.JWT_SECRET_TOKEN as string,
        {
          expiresIn: "10d",
        }
      );

      const refresh_token = jwt.sign(
        user_data,
        process.env.JWT_REFRESH_TOKEN as string,
        {
          expiresIn: "7d",
        }
      );

      res.cookie("refresh_token", refresh_token, { httpOnly: true });

      res.status(200).json({
        message: "login sucess",
        token: access_token,
      });
    }
  );
};
