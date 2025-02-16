import express from "express";
import * as report_nodes_controller from "../controller/report_nodes_controller";

const router = express.Router();

router
  .route("/")
  .get(report_nodes_controller.get_root_nodes)
  .post(report_nodes_controller.post_nodes);


router
  .route("/:id")
  .get(report_nodes_controller.navigate_tree_data);


export default router;
