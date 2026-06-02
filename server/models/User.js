// Import mongoose
const mongoose = require("mongoose");

// Define schema
const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
    },

    accountType: {
      type: String,
      enum: ["Admin", "Student", "Instructor"],
      required: true,
    },

    active: {
      type: Boolean,
      default: true,
    },

    approved: {
      type: Boolean,
      default: true,
    },

    additionalDetails: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
      required: true,
    },

    courses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
    ],

    token: {
      type: String,
    },

    resetPasswordExpires: {
      type: Date,
    },

    image: {
      type: String,
      default: "https://api.dicebear.com/5.x/initials/svg?seed=User",
    },

    courseProgress: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CourseProgress", // ✅ fixed case
      },
    ],
  },
  { timestamps: true }
);

// ✅ VERY IMPORTANT — Model name must match ref
module.exports = mongoose.model("User", userSchema);