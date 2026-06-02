const Course = require("../models/Course")
const Category = require("../models/Category")
const Section = require("../models/Section")
const SubSection = require("../models/SubSection")
const User = require("../models/User")
const { uploadImageToCloudinary } = require("../utils/imageUploader")
const CourseProgress = require("../models/CourseProgress")
const { convertSecondsToDuration } = require("../utils/secToDuration")

// =============================
// Create Course
// =============================
exports.createCourse = async (req, res) => {
  try {
    const userId = req.user.id

    let {
      courseName,
      courseDescription,
      whatYouWillLearn,
      price,
      tag: _tag,
      category,
      status,
      instructions: _instructions,
    } = req.body

    const thumbnail = req.files?.thumbnailImage

    const tag = JSON.parse(_tag || "[]")
    const instructions = JSON.parse(_instructions || "[]")

    if (
      !courseName ||
      !courseDescription ||
      !whatYouWillLearn ||
      !price ||
      !tag.length ||
      !thumbnail ||
      !category ||
      !instructions.length
    ) {
      return res.status(400).json({
        success: false,
        message: "All Fields are Mandatory",
      })
    }

    if (!status) status = "Draft"

    const instructorDetails = await User.findById(userId)
    if (!instructorDetails || instructorDetails.accountType !== "Instructor") {
      return res.status(404).json({
        success: false,
        message: "Instructor Details Not Found",
      })
    }

    const categoryDetails = await Category.findById(category)
    if (!categoryDetails) {
      return res.status(404).json({
        success: false,
        message: "Category Details Not Found",
      })
    }

    const thumbnailImage = await uploadImageToCloudinary(
      thumbnail,
      process.env.FOLDER_NAME
    )

    const newCourse = await Course.create({
      courseName,
      courseDescription,
      instructor: instructorDetails._id,
      whatYouWillLearn,
      price,
      tag,
      category: categoryDetails._id,
      thumbnail: thumbnailImage.secure_url,
      status,
      instructions,
      studentsEnrolled: [], // ✅ ensure field exists
    })

    await User.findByIdAndUpdate(
      instructorDetails._id,
      { $push: { courses: newCourse._id } },
      { new: true }
    )

    await Category.findByIdAndUpdate(
      category,
      { $push: { courses: newCourse._id } },
      { new: true }
    )

    return res.status(200).json({
      success: true,
      data: newCourse,
      message: "Course Created Successfully",
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      success: false,
      message: "Failed to create course",
      error: error.message,
    })
  }
}

// =============================
// Edit Course
// =============================
exports.editCourse = async (req, res) => {
  try {
    const { courseId } = req.body
    const updates = req.body

    const course = await Course.findById(courseId)
    if (!course) {
      return res.status(404).json({ error: "Course not found" })
    }

    if (req.files?.thumbnailImage) {
      const thumbnailImage = await uploadImageToCloudinary(
        req.files.thumbnailImage,
        process.env.FOLDER_NAME
      )
      course.thumbnail = thumbnailImage.secure_url
    }

    for (const key in updates) {
      if (key === "tag" || key === "instructions") {
        course[key] = JSON.parse(updates[key])
      } else {
        course[key] = updates[key]
      }
    }

    await course.save()

    const updatedCourse = await Course.findById(courseId)
      .populate("instructor")
      .populate("category")
      .populate("ratingAndReviews")
      .populate({
        path: "courseContent",
        populate: { path: "subSection" },
      })

    return res.json({
      success: true,
      message: "Course updated successfully",
      data: updatedCourse,
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    })
  }
}

// =============================
// Get All Published Courses
// =============================
exports.getAllCourses = async (req, res) => {
  try {
    const allCourses = await Course.find(
      { status: "Published" },
      {
        courseName: 1,
        price: 1,
        thumbnail: 1,
        instructor: 1,
        ratingAndReviews: 1,
        studentsEnrolled: 1,
      }
    ).populate("instructor")

    return res.status(200).json({
      success: true,
      data: allCourses,
    })
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: "Can't Fetch Course Data",
      error: error.message,
    })
  }
}

// =============================
// Get Course Details (Public)
// =============================
exports.getCourseDetails = async (req, res) => {
  try {
    const { courseId } = req.body

    const courseDetails = await Course.findById(courseId)
      .populate("instructor")
      .populate("category")
      .populate("ratingAndReviews")
      .populate({
        path: "courseContent",
        populate: { path: "subSection", select: "-videoUrl" },
      })

    if (!courseDetails) {
      return res.status(400).json({
        success: false,
        message: "Course not found",
      })
    }

    let totalDurationInSeconds = 0

    courseDetails.courseContent.forEach((content) => {
      content.subSection.forEach((sub) => {
        totalDurationInSeconds += parseInt(sub.timeDuration || 0)
      })
    })

    const totalDuration = convertSecondsToDuration(totalDurationInSeconds)

    return res.status(200).json({
      success: true,
      data: { courseDetails, totalDuration },
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

// =============================
// Get Full Course Details
// =============================
exports.getFullCourseDetails = async (req, res) => {
  try {
    const { courseId } = req.body
    const userId = req.user.id

    const courseDetails = await Course.findById(courseId)
      .populate("instructor")
      .populate("category")
      .populate("ratingAndReviews")
      .populate({
        path: "courseContent",
        populate: { path: "subSection" },
      })

    if (!courseDetails) {
      return res.status(400).json({
        success: false,
        message: "Course not found",
      })
    }

    const courseProgress = await CourseProgress.findOne({
      courseID: courseId,
      userId,
    })

    let totalDurationInSeconds = 0
    courseDetails.courseContent.forEach((content) => {
      content.subSection.forEach((sub) => {
        totalDurationInSeconds += parseInt(sub.timeDuration || 0)
      })
    })

    const totalDuration = convertSecondsToDuration(totalDurationInSeconds)

    return res.status(200).json({
      success: true,
      data: {
        courseDetails,
        totalDuration,
        completedVideos: courseProgress?.completedVideos || [],
      },
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

// =============================
// Get Instructor Courses
// =============================
exports.getInstructorCourses = async (req, res) => {
  try {
    const instructorId = req.user.id

    const instructorCourses = await Course.find({
      instructor: instructorId,
    }).sort({ createdAt: -1 })

    return res.status(200).json({
      success: true,
      data: instructorCourses,
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve instructor courses",
      error: error.message,
    })
  }
}

// =============================
// Delete Course
// =============================
exports.deleteCourse = async (req, res) => {
  try {
    const { courseId } = req.body

    const course = await Course.findById(courseId)
    if (!course) {
      return res.status(404).json({ message: "Course not found" })
    }

    const studentsEnrolled = course.studentsEnrolled || []

    for (const studentId of studentsEnrolled) {
      await User.findByIdAndUpdate(studentId, {
        $pull: { courses: courseId },
      })
    }

    const courseSections = course.courseContent || []

    for (const sectionId of courseSections) {
      const section = await Section.findById(sectionId)

      if (section) {
        const subSections = section.subSection || []
        for (const subSectionId of subSections) {
          await SubSection.findByIdAndDelete(subSectionId)
        }
      }

      await Section.findByIdAndDelete(sectionId)
    }

    await Course.findByIdAndDelete(courseId)

    return res.status(200).json({
      success: true,
      message: "Course deleted successfully",
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}