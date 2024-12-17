import { chatModel } from "./chat.schema.js";

export default class chatRepository {
  async createMessage(data) {
    try {
      const newMessage = new chatModel(data);
      await newMessage.save();

      return {
        success: true,
        statusCode: 200,
        message: newMessage,
      };
    } catch (err) {
      throw err;
    }
  }

  async getUserMessage(reciever, sender) {
    try {
      const message = await chatModel
        .find({
          $or: [
            { sender: sender, reciever: reciever },
            { sender: reciever, reciever: sender },
          ],
        })
        .sort({ createdAt: 1 });

      if (!message) {
        throw {
          statusCode: 404,
          message: "Message not found from user",
        };
      }

      return {
        success: true,
        statusCode: 200,
        message,
      };
    } catch (err) {
      throw err;
    }
  }

  async getUnreadMessageCount(senderId, recipientId) {
    try {
      const unreadMessageCount = await chatModel.countDocuments({
        reciever: recipientId,
        sender: senderId,
        read: false,
      });

      return {
        success: true,
        statusCode: 200,
        unreadMessageCount: unreadMessageCount,
      };
    } catch (err) {
      throw err;
    }
  }
}
