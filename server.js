import dotenv from "dotenv";
dotenv.config();
import express from "express";
import http from "http";
import cors from "cors";
const app = express();
import cookieParser from "cookie-parser";
import { Server } from "socket.io";
import userRouter from "./src/features/users/user.routes.js";
import chatRouter from "./src/features/chats/chat.routes.js";
import { connectToDatabase } from "./src/config/connection.js";
import { fileURLToPath } from "url";
import path from "path";
import { chatModel } from "./src/features/chats/chat.schema.js";
import { appLevelErrorHandlerMiddleware } from "./src/middlewares/errorHandler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = 3000;

const server = http.createServer(app);
app.use(express.static(path.join(__dirname, "public")));
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use("/api/user", userRouter);
app.use("/api/message", chatRouter);
app.use(appLevelErrorHandlerMiddleware);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "register.html"));
});

io.on("connection", (socket) => {
  console.log("connection made ");

  // listen when new user joined
  socket.on("newUserJoined", (user) => {
    // user join the room after registration
    socket.join(user._id.toString());
    // notification send to all user except you with the help of using broadcast
    socket.broadcast.emit("newJoinedUser", `${user.name} has joined chatterUp`);
  });

  // listen when user login or page reload or we revisit
  socket.on("loadUsers", ({ users, activeChatterUpUser }) => {
    // join room when user login or page reload or we revisit
    if (activeChatterUpUser) {
      let userId = activeChatterUpUser._id.toString();
      socket.join(userId);
    }
    // send all users only to you
    socket.emit("users", users);
  });

  // Listen for typing
  socket.on("typing", ({ roomId, userId }) => {
    socket.to(roomId).emit("typing", { userId });
  });

  // Listen for stop typing
  socket.on("stopTyping", ({ roomId, userId }) => {
    socket.to(roomId).emit("stopTyping", { userId });
  });

  // listen on new message
  socket.on("newMessage", async ({ message, reciever, sender, time }) => {
    // save message to database
    const newMessage = new chatModel({
      sender: sender._id,
      reciever: reciever._id,
      content: message,
    });

    await newMessage.save();

    // send message to reciever using his roomId
    socket
      .to(reciever._id.toString())
      .emit("message", { message, sender, time });

    // on every new message it will check unread message of specific sender and reciever
    const unreadCount = await chatModel.countDocuments({
      reciever: reciever._id,
      sender: sender._id,
      read: false,
    });

    // on every new message it is send to reciever
    socket
      .to(reciever._id.toString())
      .emit("update-unread-count", { count: unreadCount, sender: sender });
  });

  // update message as read
  socket.on("mark-as-read", async ({ sender, reciever }) => {
    await chatModel.updateMany(
      { sender: sender, reciever: reciever, read: false },
      { $set: { read: true } }
    );

    const unreadCount = await chatModel.countDocuments({
      receiver: reciever._id,
      read: false,
    });

    // send unread message count which will be always 0
    io.to(reciever._id.toString()).emit("update-unread-count", {
      count: unreadCount,
      sender: sender,
    });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

server.listen(port, () => {
  console.log(`Listening on port ${port}`);
  connectToDatabase();
});
