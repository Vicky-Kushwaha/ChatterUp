import mongoose from "mongoose";

const userSchema = mongoose.Schema({
  name: {
    type: String,
    trim: true,
    minLength: [3, "Name must be of atleast 3 charecters"],
    required: [true, "Name is required"],
  },
  email: {
    type: String,
    unique: true,
    required: [true, "Email is required"],
    match: [/.+\@.+\../, "Please enter a valid email"],
  },
  avatar: {
    type: String,
    required: [true, "avatar is required"],
  },
  password: {
    type: String,
    required: [true, "password is required"],
    select: false,
  },
});

export const userModel = mongoose.model("User", userSchema);
