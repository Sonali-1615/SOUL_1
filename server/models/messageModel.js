const mongoose = require("mongoose");

const MessageSchema = mongoose.Schema(
  {
    message: {
      text: { type: String, required: true },
    },
    users: Array,
    sender: {
      type: mongoose.Schema.Types.Mixed, // Allow ObjectId or String (for bot)
      required: true,
    },
    seen: {
      type: Boolean,
      default: false,
    },
    reactions: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'Users' },
        emoji: { type: String },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Messages", MessageSchema);
