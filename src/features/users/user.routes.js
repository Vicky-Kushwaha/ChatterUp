import express from "express";
const router = express.Router();
import usercontroller from "./user.controller.js";
import { auth } from "../../middlewares/auth.js";
import { upload } from "../../middlewares/file-upload.js";

const userController = new usercontroller();

router.post("/signup", upload.single("avatar"), (req, res, next) => {
  userController.signUp(req, res, next);
});
router.post("/signin", (req, res, next) => {
  userController.signIn(req, res, next);
});
router.post("/logout", auth, (req, res, next) => {
  userController.logout(req, res, next);
});
router.get("/get-details/:userId", auth, (req, res, next) => {
  userController.getUserDetails(req, res, next);
});
router.get("/get-all-details", auth, (req, res, next) => {
  userController.getAllUserDeatails(req, res, next);
});

export default router;
