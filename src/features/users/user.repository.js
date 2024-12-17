import { userModel } from "./user.schema.js";
import bcrypt from "bcrypt";

export default class userRepository {
  async signUp(userData) {
    try {
      const newUser = new userModel(userData);
      await newUser.save();

      return {
        success: true,
        statusCode: 201,
        message: "User joined chatterUp successfully",
        user: newUser,
      };
    } catch (err) {
      throw {
        statusCode: 400,
        message: err.message || "An error occurred during joining chatterUp",
      };
    }
  }

  async signIn(userData) {
    try {
      const { email, password } = userData;

      const user = await userModel.findOne({ email }).select("+password");

      if (!user) {
        throw {
          statusCode: 400,
          message: "User not found",
        };
      }

      const hashPassword = await bcrypt.compare(password, user.password);

      if (hashPassword) {
        return {
          success: true,
          statusCode: 200,
          message: "User login successful",
          user,
        };
      } else {
        throw {
          statusCode: 400,
          message: "Invalid credentials",
        };
      }
    } catch (err) {
      throw err;
    }
  }

  async getAllUserDeatails() {
    try {
      const users = await userModel.find();

      if (!users) {
        throw {
          statusCode: 404,
          message: "Users not found",
        };
      }

      return {
        success: true,
        statusCode: 200,
        users,
      };
    } catch (err) {
      throw err;
    }
  }
}
