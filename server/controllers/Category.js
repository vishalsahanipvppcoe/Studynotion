const Category = require("../models/Category");
const Course = require("../models/Course");
const User = require("../models/User"); // ✅ IMPORTANT (Fixes MissingSchemaError)

// =============================
// Helper Function
// =============================
function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

// =============================
// Create Category
// =============================
exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    const categoryDetails = await Category.create({
      name,
      description,
    });

    return res.status(200).json({
      success: true,
      message: "Category Created Successfully",
      data: categoryDetails,
    });
  } catch (error) {
    console.error("CREATE CATEGORY ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =============================
// Show All Categories
// =============================
exports.showAllCategories = async (req, res) => {
  try {
    console.log("INSIDE SHOW ALL CATEGORIES");

    const allCategories = await Category.find({});

    return res.status(200).json({
      success: true,
      data: allCategories,
    });
  } catch (error) {
    console.error("SHOW CATEGORY ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =============================
// Category Page Details
// =============================
exports.categoryPageDetails = async (req, res) => {
  try {
    const { categoryId } = req.body;

    console.log("PRINTING CATEGORY ID:", categoryId);

    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: "CategoryId is required",
      });
    }

    // 1️⃣ Get Selected Category
    const selectedCategory = await Category.findById(categoryId)
      .populate({
        path: "courses",
        match: { status: "Published" },
        populate: [
          { path: "ratingAndReviews" },
          { path: "instructor" }, // ✅ Now works because User model is imported
        ],
      })
      .exec();

    if (!selectedCategory) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    const selectedCourses = selectedCategory.courses || [];

    // 2️⃣ Get Different Category (Safe)
    const categoriesExceptSelected = await Category.find({
      _id: { $ne: categoryId },
    });

    let differentCategory = null;

    if (categoriesExceptSelected.length > 0) {
      const randomIndex = getRandomInt(categoriesExceptSelected.length);

      differentCategory = await Category.findById(
        categoriesExceptSelected[randomIndex]._id
      )
        .populate({
          path: "courses",
          match: { status: "Published" },
          populate: { path: "instructor" },
        })
        .exec();
    }

    // 3️⃣ Get Top Selling Courses (Based on studentsEnrolled count)
    const allCategories = await Category.find()
      .populate({
        path: "courses",
        match: { status: "Published" },
        populate: { path: "instructor" },
      })
      .exec();

    const allCourses = allCategories.flatMap(
      (category) => category.courses || []
    );

    const mostSellingCourses = allCourses
      .sort(
        (a, b) =>
          (b.studentsEnrolled?.length || 0) -
          (a.studentsEnrolled?.length || 0)
      )
      .slice(0, 10);

    // 4️⃣ Final Response
    return res.status(200).json({
      success: true,
      data: {
        selectedCategory: {
          ...selectedCategory.toObject(),
          courses: selectedCourses,
        },
        differentCategory,
        mostSellingCourses,
      },
    });
  } catch (error) {
    console.error("CATEGORY PAGE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};