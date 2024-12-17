import dotenv from "dotenv";
dotenv.config();
import jwt from "jsonwebtoken";
import { userModel } from "../features/users/user.schema.js";

export const auth = async (req, res, next) => {
  const { token } = req.cookies;

  if (!token) {
    return res.status(400).send("unauthorized! login to continue!");
  }

  const payload = jwt.verify(token, process.env.JWTSECRET);

  const user = await userModel.findById(payload.userId);

  if (!user) {
    res.status(400).send("unauthorized! login to continue!");
  } else {
    req.userId = payload.userId;
    req.userEmail = payload.userEmail;
    next();
  }
};
