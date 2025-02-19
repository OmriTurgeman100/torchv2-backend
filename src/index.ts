import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRouter from "./routes/authRouter";
import userRouter from "./routes/userRouter";
import reports_nodes_Router from "./routes/reports_nodes_Router";
import { Request, Response, NextFunction } from "express";
import AppError from "./utils/AppError";
import path from "path";
import { GlobalError } from "./utils/GlobalError";

const app = express();
const port: number = 3000;

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(express.json());
app.use(helmet());
app.use(cors());
app.use(cookieParser());

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/reports/nodes", reports_nodes_Router);

app.listen(port, () => {
  console.log(
    `🚀 Server is up and running! Access it at: http://localhost:${port}/`
  );
});

app.use("*", (req: Request, res: Response, next: NextFunction): void => {
  next(new AppError(`Cant find ${req.originalUrl} on the server`, 401));
});

app.use(GlobalError);

// ! taskkill /F /IM node.exe /T
