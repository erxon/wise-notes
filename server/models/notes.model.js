const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  notebookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Notebook",
    default: null,
  },
  title: String,
  content: String,
  type: {
    type: String,
    enum: ["text", "list"],
    default: "text",
    validate: {
      validator: function (value) {
        return value === "text" || value === "list";
      },
      message: "type must be either 'text' or 'list'",
    },
  },
  items: [
    {
      label: String,
      checked: {
        type: Boolean,
        default: false,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  deletedAt: { type: Date, default: null },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Note", noteSchema);
