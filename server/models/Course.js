const mongoose = require("mongoose");

const coursesSchema = new mongoose.Schema({
  courseName: { type: String, required: true },

  courseDescription: { type: String, required: true },

  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",   // ✅ Capital U (recommended)
  },

  whatYouWillLearn: {
    type: String,
    required: true,
  },

  courseContent: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Section",
    },
  ],

  ratingAndReviews: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RatingAndReview",
    },
  ],

  price: {
    type: Number,
    required: true,
  },

  thumbnail: {
    type: String,
    required: true,
  },

  tag: {
    type: [String],
    required: true,
  },

  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },

  // ✅ FIXED HERE
  studentsEnrolled: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],

  instructions: {
    type: [String],
    required: true,
  },

  status: {
    type: String,
    enum: ["Draft", "Published"],
    default: "Draft",
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Course", coursesSchema);