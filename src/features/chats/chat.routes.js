import express from "express";
const router = express.Router();
import chatcontroller from "./chat.controller.js";
import { auth } from "../../middlewares/auth.js";

const chatController = new chatcontroller();

router.post("/newMessage", auth, (req, res, next) => {
  chatController.createMessage(req, res, next);
});

router.get("/getUserMessage/:senderId/:recipientId", auth, (req, res, next) => {
  chatController.getUserMessage(req, res, next);
});

router.get(
  "/getUnreadMessageCount/:senderId/:recipientId",
  auth,
  (req, res, next) => {
    chatController.getUnreadMessageCount(req, res, next);
  }
);

export default router;
