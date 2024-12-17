import dotenv from "dotenv";
dotenv.config();
import userRepository from "./user.repository.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export default class userController {
  constructor() {
    this.userRepository = new userRepository();
  }

  async signUp(req, res, next) {
    try {
      const { name, email, password } = req.body;
      const avatar = req.file && req.file.filename;

      const hashPassword = await bcrypt.hash(password, 12);

      const response = await this.userRepository.signUp({
        name,
        email,
        avatar,
        password: hashPassword,
      });

      if (response.success) {
        res.status(response.statusCode).json(response);
      }
    } catch (err) {
      next(err);
    }
  }

  async signIn(req, res, next) {
    try {
      const response = await this.userRepository.signIn(req.body);

      if (response.success) {
        const token = jwt.sign(
          {
            userId: response.user._id,
            userEmail: response.user.email,
          },
          process.env.JWTSECRET,
          {
            expiresIn: "30d",
          }
        );

        res.cookie("token", token).status(response.statusCode).json(response);
      }
    } catch (err) {
      next(err);
    }
  }

  async getAllUserDeatails(req, res, next) {
    try {
      const response = await this.userRepository.getAllUserDeatails();

      if (response.success) {
        res.status(response.statusCode).json(response);
      }
    } catch (err) {
      next(err);
    }
  }

  async logout(req, res, next) {
    try {
      res
        .clearCookie("token")
        .status(200)
        .json({ success: true, message: "logout successful" });
    } catch (err) {
      next(err);
    }
  }
}
