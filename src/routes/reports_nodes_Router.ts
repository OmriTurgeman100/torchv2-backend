import express from "express";
import * as report_nodes_controller from "../controller/report_nodes_controller";

const router = express.Router();

router
  .route("/")
  .get(report_nodes_controller.test)

export default router;
