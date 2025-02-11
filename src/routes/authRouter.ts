import express from "express";
import * as authController from "../controller/authController";

const router = express.Router();

router
 .route("/refresh_token")
 .get(authController.refresh_user_token)
router
.route("/register")
.post(authController.register_users);

router
.route("/login")
.post(authController.login_users);


export default router;

// ! taskkill /F /IM node.exe /T
