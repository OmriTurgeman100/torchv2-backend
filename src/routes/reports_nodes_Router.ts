import express from "express";
import * as report_nodes_controller from "../controller/report_nodes_controller";
import * as authController from "../controller/authController";

const router = express.Router();

router
  .route("/")
  .get(authController.authenticate_jwt_token, report_nodes_controller.get_root_nodes)
  .post(authController.authenticate_jwt_token, report_nodes_controller.post_nodes);

router
  .route("/BlackBox")
  .post(authController.authenticate_jwt_token, report_nodes_controller.BlackBox_Scripts);

  router
  .route("/Data")
  .get(authController.authenticate_jwt_token, report_nodes_controller.distinct_reports);

  router
  .route("/templates")
  .get(authController.authenticate_jwt_token, report_nodes_controller.display_node_templates)
  .post(authController.authenticate_jwt_token, report_nodes_controller.create_node_templates)

router
  .route("/:id")
  .get(authController.authenticate_jwt_token, report_nodes_controller.navigate_tree_data)
  .delete(authController.authenticate_jwt_token, report_nodes_controller.delete_node);

router
  .route("/Rules/:id")
  .get(authController.authenticate_jwt_token, report_nodes_controller.get_rules)
  .post(authController.authenticate_jwt_token, report_nodes_controller.post_rules)
  .delete(authController.authenticate_jwt_token, report_nodes_controller.delete_rule);

router
  .route("/Exclude/:id/:status")
  .patch(authController.authenticate_jwt_token, report_nodes_controller.set_node_excluded);

router
  .route("/detach/:id")
  .patch(authController.authenticate_jwt_token, report_nodes_controller.detach_report);

router
  .route("/description/:id")
  .get(authController.authenticate_jwt_token, report_nodes_controller.display_nodes_description)
  .post(authController.authenticate_jwt_token, report_nodes_controller.insert_nodes_description)
  .patch(authController.authenticate_jwt_token, report_nodes_controller.update_nodes_description)
  .delete(authController.authenticate_jwt_token, report_nodes_controller.delete_node_description);

export default router;
