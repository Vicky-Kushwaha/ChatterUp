import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
  sender: {
    type: String,
    required: [true, "Sender is required"],
  },
  reciever: {
    type: String,
    required: [true, "reciever is required"],
  },
  content: {
    type: String,
    required: [true, "Content is required"],
  },
  read: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const chatModel = mongoose.model("Chat", chatSchema);
