import chatRepository from "./chat.repository.js";

export default class chatController {
  constructor() {
    this.chatRepository = new chatRepository();
  }

  async createMessage(req, res, next) {
    try {
      const messageData = req.body;

      const response = await this.chatRepository.createMessage(messageData);

      if (response.success) {
        res.status(response.statusCode).json(response);
      }
    } catch (err) {
      next(err);
    }
  }

  async getUserMessage(req, res, next) {
    try {
      const reciever = req.params.recipientId;
      const sender = req.params.senderId;

      const response = await this.chatRepository.getUserMessage(
        reciever,
        sender
      );

      if (response.success) {
        res.status(response.statusCode).json(response);
      }
    } catch (err) {
      next(err);
    }
  }

  async getUnreadMessageCount(req, res, next) {
    try {
      const senderId = req.params.senderId;
      const recipientId = req.params.recipientId;

      const response = await this.chatRepository.getUnreadMessageCount(
        senderId,
        recipientId
      );

      if (response.success) {
        res.status(response.statusCode).json(response);
      }
    } catch (err) {
      next(err);
    }
  }
}
