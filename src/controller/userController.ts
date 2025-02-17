import { Request, Response, NextFunction } from "express";
import AppError from "../utils/AppError";
import pool from "../database/database";
import { CatchAsync } from "../utils/CatchAsync";
import sharp from "sharp";
import multer from "multer";

interface auth_request extends Request {
  user?: any;
}

const multerStorage = multer.memoryStorage();

const multerFilter = (req: Request, file: Express.Multer.File, cb: any) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("Not an image, please upload only images", 400));
  }
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

export const uploadUserPhoto = upload.single("photo"); // *  // Multer handles the file upload and attaches the file to req.file

export const resizeUserPhoto = (
  req: auth_request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.file) {
    return next();
  }

  req.file.path = `user-${req.user.user_id}-${Date.now()}.jpeg`;

  sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat("jpeg")
    .jpeg({ quality: 100 })
    .toFile(`src/uploads/${req.file.path}`);

  next();
};

export const update_profile_data = CatchAsync(
  async (
    req: auth_request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    if (req.file) {
      const imageUrl = req.file.path;

      const modified_path: string = imageUrl.replace("src", "");

      const user_id = req.user.user_id;

      await pool.query(
        "insert into user_images (user_id, image_url) VALUES ($1, $2);",
        [user_id, modified_path]
      );
    }

    res.status(200).json({
      message: "Profile updated successfully!",
    });
  }
);

export const user_details = CatchAsync(
  async (
    req: auth_request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const user_id: number = req.user.user_id;

    const user_data = await pool.query(
      "select id, username, role from users where id = $1",
      [user_id]
    );

    const acount_created_at = await pool.query(
      "select uploaded_at from user_images where user_id = $1 order by uploaded_at asc;",
      [user_id]
    );

    res.status(200).json({
      user: user_data.rows,
      user_created_at: acount_created_at.rows,
    });
  }
);

export const display_user_permissions = CatchAsync(
  async (
    req: auth_request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const users = await pool.query("select id, username, role from users;");

    if (req.user.user_role !== "admin") {
      return next(
        new AppError(
          "Access denied: You do not have the necessary permissions to view this route.",
          401
        )
      );
    }

    const users_data = users.rows;

    res.status(200).json({
      data: users_data,
    });
  }
);

export const set_permissions = CatchAsync(
  async (
    req: auth_request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const requested_role: string = req.body.role;

    const requested_user_id: number = req.body.user_id;

    if (req.user.user_role !== "admin") {
      return next(
        new AppError(
          "Access denied: You do not have the necessary permissions to perform this request.",
          401
        )
      );
    }

    const data = await pool.query("update users set role = $1 where id = $2;", [
      requested_role,
      requested_user_id,
    ]);
    // // const data = await pool.query("update users set role = $1 where id = $2", [])

    res.status(200).json({
      data: "successfully applied changes.",
    });
  }
);

export const profile_photo = CatchAsync(
  async (
    req: auth_request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const requested_user_id: number = req.user.user_id;

    const photo = await pool.query(
      "select image_url  from user_images where user_id = $1 order by uploaded_at desc limit 1;",
      [requested_user_id]
    );

    const imageUrl = `/uploads/${photo.rows[0].image_url}`;

    res.status(200).json({
      path: imageUrl,
    });
  }
);

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "src/uploads");
//   },
//   filename: (req: auth_request, file, cb) => {
//     const fileExtension = file.mimetype.split("/")[1];
//     cb(null, `user-${req.user.user_id}-${Date.now()}.${fileExtension}`);
//   },
// });
