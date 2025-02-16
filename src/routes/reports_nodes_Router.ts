import express from "express";
import * as report_nodes_controller from "../controller/report_nodes_controller";
import * as authController from "../controller/authController";

const router = express.Router();

router
  .route("/")
  .get(report_nodes_controller.get_root_nodes)
  .post(report_nodes_controller.post_nodes);


router
  .route("/BlackBox")
  .post(report_nodes_controller.BlackBox_Scripts);

router
  .route("/:id")
  .get(report_nodes_controller.navigate_tree_data)
  .delete(report_nodes_controller.delete_node);

router
  .route("/Rules/:id")
  .get(report_nodes_controller.get_rules)
  .post(report_nodes_controller.post_rules);


export default router;
