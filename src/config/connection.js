import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
const url = `${process.env.MONGODBURL}`;
// "mongodb://localhost:27017/chatterUp"

export const connectToDatabase = async () => {
  try {
    await mongoose.connect(url);
    console.log("Successfully connected to database");
  } catch (err) {
    console.log("Error while connecting to database , Error: ", err);
  }
};
