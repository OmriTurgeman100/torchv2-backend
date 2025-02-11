import express from "express";
import * as userController from "../controller/userController"
import * as authController from "../controller/authController";

const router = express.Router();

router
  .route("/me")
  .get(authController.authenticate_jwt_token, userController.user_details);

router
  .route("/profile-photo")
  .get(authController.authenticate_jwt_token, userController.profile_photo,);

router
  .route("/update-me")
  .patch(authController.authenticate_jwt_token, userController.uploadUserPhoto, userController.resizeUserPhoto, userController.update_profile_data);

router
  .route("/view-permissions")
  .get(authController.authenticate_jwt_token, userController.display_user_permissions);

router
  .route("/set-permissions")
  .patch(authController.authenticate_jwt_token, userController.set_permissions)

export default router;