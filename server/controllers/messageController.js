/**
 * Delete a message by its ID
 * @param {Request} req
 * @param {Response} res
 * @param {Function} next
 */
module.exports.deleteMessage = async (req, res, next) => {
  try {
    const { messageId, userId } = req.body;
    const message = await Messages.findById(messageId);
    if (!message) return res.status(404).json({ msg: "Message not found" });
    // Only allow sender to delete
    if (message.sender.toString() !== userId) {
      return res.status(403).json({ msg: "Not authorized to delete this message" });
    }
    await Messages.findByIdAndDelete(messageId);
    res.json({ msg: "Message deleted successfully" });
  } catch (ex) {
    next(ex);
  }
};

/**
 * Add or remove a reaction (emoji) to a message
 * @param {Request} req
 * @param {Response} res
 * @param {Function} next
 */
module.exports.reactToMessage = async (req, res, next) => {
  try {
    const { messageId, userId, emoji } = req.body;
    const message = await Messages.findById(messageId);
    if (!message) return res.status(404).json({ msg: "Message not found" });
    // Remove existing reaction by this user (if any)
    message.reactions = message.reactions.filter(r => r.user.toString() !== userId);
    // If emoji is not empty, add new reaction
    if (emoji) {
      message.reactions.push({ user: userId, emoji });
    }
    await message.save();
    res.json({ msg: "Reaction updated", reactions: message.reactions });
  } catch (ex) {
    next(ex);
  }
};


/**
 * Message controller for chat app
 * Handles message CRUD and AI bot integration
 */
const Messages = require("../models/messageModel");
const crypto = require("crypto");

console.log("DEBUG: OPENAI_API_KEY loaded?", !!process.env.OPENAI_API_KEY);
const { CohereClient } = require("cohere-ai");
const BOT_USER_ID = "SOUL_BOT"; // Use this as the bot's user id
const cohere = new CohereClient({ token: process.env.CO_API_KEY });

/**
 * Get all messages between two users
 * @param {Request} req
 * @param {Response} res
 * @param {Function} next
 */
module.exports.getMessages = async (req, res, next) => {
  try {
    const { from, to } = req.body;
    const messages = await Messages.find({
      users: {
        $all: [from, to],
      },
    }).sort({ updatedAt: 1 });
    const projectedMessages = messages.map((msg) => {
      return {
        fromSelf: msg.sender.toString() === from,
        message: msg.message.text,
        seen: msg.seen,
        createdAt: msg.createdAt,
        _id: msg._id,
      };
    });
    res.json(projectedMessages);
  } catch (ex) {
    next(ex);
  }
};

/**
 * Mark all messages as seen from 'to' to 'from'
 * @param {Request} req
 * @param {Response} res
 * @param {Function} next
 */
module.exports.markMessagesAsSeen = async (req, res, next) => {
  try {
    const { from, to } = req.body;
    await Messages.updateMany(
      {
        users: { $all: [from, to] },
        sender: to,
        seen: false,
      },
      { $set: { seen: true } }
    );
    res.json({ msg: "Messages marked as seen" });
  } catch (ex) {
    next(ex);
  }
};

/**
 * Add a message to the database. If recipient is the bot, get AI reply.
 * @param {Request} req
 * @param {Response} res
 * @param {Function} next
 */
module.exports.addMessage = async (req, res, next) => {
  try {
    const { from, to, message } = req.body;

    // If the recipient is the bot, call Cohere API
    if (to === BOT_USER_ID) {
      // Save user's message
      await Messages.create({
        message: { text: message },
        users: [from, to],
        sender: from,
      });

      // Call Cohere API for bot reply
      let botReply = "Sorry, I couldn't process that.";
      try {
        console.log("[BOT] Calling Cohere API with message:", message);
        const response = await cohere.generate({
          model: "command", // or "command-light" for faster/cheaper
          prompt: `You are SOUL, a helpful AI chat assistant. User: ${message}\nAI:`,
          max_tokens: 80,
          temperature: 0.7,
          stop_sequences: ["User:"],
        });
        botReply = response.generations[0].text.trim();
        console.log("[BOT] Cohere API reply:", botReply);
      } catch (err) {
        console.error("[BOT] Cohere API error:", err);
      }

      // Save bot's reply as a message
      await Messages.create({
        message: { text: botReply },
        users: [from, to],
        sender: BOT_USER_ID,
      });

      return res.json({ msg: "Message added successfully.", botReply });
    }

    // Normal user-to-user message
    const data = await Messages.create({
      message: { text: message },
      users: [from, to],
      sender: from,
    });

    if (data) return res.json({ msg: "Message added successfully." });
    else return res.json({ msg: "Failed to add message to the database" });
  } catch (ex) {
    next(ex);
  }
};