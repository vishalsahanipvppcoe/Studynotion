const Profile = require("../models/Profile");
const CourseProgress = require("../models/CourseProgress");
const Course = require("../models/Course");
const User = require("../models/User");
const { uploadImageToCloudinary } = require("../utils/imageUploader");
const { convertSecondsToDuration } = require("../utils/secToDuration");


// =============================
// Update Profile
// =============================
exports.updateProfile = async (req, res) => {
  try {
    const {
      firstName = "",
      lastName = "",
      dateOfBirth = "",
      about = "",
      contactNumber = "",
      gender = "",
    } = req.body;

    const id = req.user.id;

    const userDetails = await User.findById(id);
    if (!userDetails) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update basic user fields
    await User.findByIdAndUpdate(
      id,
      { firstName, lastName },
      { new: true }
    );

    // Update profile fields
    if (userDetails.additionalDetails) {
      await Profile.findByIdAndUpdate(
        userDetails.additionalDetails,
        {
          dateOfBirth,
          about,
          contactNumber,
          gender,
        },
        { new: true }
      );
    }

    const updatedUserDetails = await User.findById(id)
      .populate("additionalDetails")
      .exec();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUserDetails,
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// =============================
// Delete Account (FIXED)
// =============================
exports.deleteAccount = async (req, res) => {
  try {
    const id = req.user.id;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Delete profile
    if (user.additionalDetails) {
      await Profile.findByIdAndDelete(user.additionalDetails);
    }

    // Remove student from enrolled courses
    if (user.courses && user.courses.length > 0) {
      const courseUnenrollPromises = user.courses.map((courseId) =>
        Course.findByIdAndUpdate(courseId, {
          $pull: { studentsEnrolled: id },
        })
      );
      await Promise.all(courseUnenrollPromises);
    }

    // Delete course progress
    await CourseProgress.deleteMany({ userId: id });

    // Delete user
    await User.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete Account Error:", error);
    return res.status(500).json({
      success: false,
      message: "User cannot be deleted successfully",
    });
  }
};


// =============================
// Get All User Details
// =============================
exports.getAllUserDetails = async (req, res) => {
  try {
    const id = req.user.id;

    const userDetails = await User.findById(id)
      .populate("additionalDetails")
      .exec();

    if (!userDetails) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User Data fetched successfully",
      data: userDetails,
    });
  } catch (error) {
    console.error("Get User Details Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// =============================
// Update Display Picture
// =============================
exports.updateDisplayPicture = async (req, res) => {
  try {
    const displayPicture = req.files?.displayPicture;
    const userId = req.user.id;

    if (!displayPicture) {
      return res.status(400).json({
        success: false,
        message: "No image provided",
      });
    }

    const image = await uploadImageToCloudinary(
      displayPicture,
      process.env.FOLDER_NAME,
      1000,
      1000
    );

    const updatedProfile = await User.findByIdAndUpdate(
      userId,
      { image: image.secure_url },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Image Updated successfully",
      data: updatedProfile,
    });
  } catch (error) {
    console.error("Update DP Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// =============================
// Get Enrolled Courses
// =============================
exports.getEnrolledCourses = async (req, res) => {
  try {
    const userId = req.user.id;

    let userDetails = await User.findById(userId)
      .populate({
        path: "courses",
        populate: {
          path: "courseContent",
          populate: { path: "subSection" },
        },
      })
      .exec();

    if (!userDetails) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    userDetails = userDetails.toObject();

    for (let course of userDetails.courses) {
      let totalDurationInSeconds = 0;
      let totalSubsections = 0;

      for (let section of course.courseContent || []) {
        const subsections = section.subSection || [];

        totalDurationInSeconds += subsections.reduce(
          (acc, curr) => acc + parseInt(curr.timeDuration || 0),
          0
        );

        totalSubsections += subsections.length;
      }

      course.totalDuration =
        convertSecondsToDuration(totalDurationInSeconds);

      const progress = await CourseProgress.findOne({
        courseID: course._id,
        userId,
      });

      const completedVideos = progress?.completedVideos?.length || 0;

      course.progressPercentage =
        totalSubsections === 0
          ? 100
          : Math.round((completedVideos / totalSubsections) * 100);
    }

    return res.status(200).json({
      success: true,
      data: userDetails.courses,
    });
  } catch (error) {
    console.error("Get Enrolled Courses Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// =============================
// Instructor Dashboard (FINAL FIXED)
// =============================
exports.instructorDashboard = async (req, res) => {
  try {
    const instructorId = req.user.id;

    const courses = await Course.find({ instructor: instructorId });

    let totalStudents = 0;
    let totalIncome = 0;

    const courseData = courses.map((course) => {
      const studentsCount = course.studentsEnrolled?.length || 0;
      const revenue = studentsCount * (course.price || 0);

      totalStudents += studentsCount;
      totalIncome += revenue;

      return {
        _id: course._id,
        courseName: course.courseName,
        price: course.price,
        totalStudentsEnrolled: studentsCount,
        totalAmountGenerated: revenue,
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        totalCourses: courses.length,
        totalStudents,
        totalIncome,
        courses: courseData,
      },
    });
  } catch (error) {
    console.error("Instructor Dashboard Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch instructor dashboard",
    });
  }
};