const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  hash: { type: String, required: false },
  googleId: {
    type: String,
    unique: true,
    sparse: true, // Allows null values while maintaining uniqueness
  },
  profilePicture: {
    type: String,
    required: false,
  },
  authMethod: {
    type: String,
    enum: ["local", "google", "both"],
    default: "local",
  },
  isVerified: {
    type: Boolean,
    default: false, // Google users can be auto-verified
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

const userModel = mongoose.model("User", userSchema);

module.exports = userModel;
