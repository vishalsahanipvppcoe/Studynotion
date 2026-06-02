const { instance } = require("../config/razorpay")
const Course = require("../models/Course")
const crypto = require("crypto")
const User = require("../models/User")
const mailSender = require("../utils/mailSender")
const {
  courseEnrollmentEmail,
} = require("../mail/templates/courseEnrollmentEmail")
const { paymentSuccessEmail } = require("../mail/templates/paymentSuccessEmail")
const CourseProgress = require("../models/CourseProgress")

// ========================================
// Capture Payment & Create Razorpay Order
// ========================================
exports.capturePayment = async (req, res) => {
  try {
    const { courses } = req.body
    const userId = req.user.id

    // Validation
    if (!courses || !Array.isArray(courses) || courses.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide Course ID(s)",
      })
    }

    let total_amount = 0

    for (const courseId of courses) {
      const course = await Course.findById(courseId)

      if (!course) {
        return res.status(404).json({
          success: false,
          message: "Course not found",
        })
      }

      // Ensure array exists
      if (!course.studentsEnrolled) {
        course.studentsEnrolled = []
      }

      // ✅ SAFE ObjectId comparison
      const alreadyEnrolled = course.studentsEnrolled.some(
        (studentId) => studentId.toString() === userId.toString()
      )

      if (alreadyEnrolled) {
        return res.status(400).json({
          success: false,
          message: "Student already enrolled",
        })
      }

      total_amount += course.price
    }

    const options = {
      amount: total_amount * 100,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    }

    const paymentResponse = await instance.orders.create(options)

    return res.status(200).json({
      success: true,
      data: paymentResponse,
    })
  } catch (error) {
    console.log("Capture Payment Error:", error)
    return res.status(500).json({
      success: false,
      message: "Could not initiate order",
    })
  }
}

// ========================================
// Verify Payment
// ========================================
exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      courses,
    } = req.body

    const userId = req.user.id

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !courses ||
      !userId
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment Failed",
      })
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(body.toString())
      .digest("hex")

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment Verification Failed",
      })
    }

    await enrollStudents(courses, userId)

    return res.status(200).json({
      success: true,
      message: "Payment Verified & Student Enrolled",
    })
  } catch (error) {
    console.log("Verify Payment Error:", error)
    return res.status(500).json({
      success: false,
      message: "Payment verification failed",
    })
  }
}

// ========================================
// Send Payment Success Email
// ========================================
exports.sendPaymentSuccessEmail = async (req, res) => {
  try {
    const { orderId, paymentId, amount } = req.body
    const userId = req.user.id

    if (!orderId || !paymentId || !amount || !userId) {
      return res.status(400).json({
        success: false,
        message: "Please provide all details",
      })
    }

    const enrolledStudent = await User.findById(userId)

    if (!enrolledStudent) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    await mailSender(
      enrolledStudent.email,
      `Payment Received`,
      paymentSuccessEmail(
        `${enrolledStudent.firstName} ${enrolledStudent.lastName}`,
        amount / 100,
        orderId,
        paymentId
      )
    )

    return res.status(200).json({
      success: true,
      message: "Email sent successfully",
    })
  } catch (error) {
    console.log("Email Error:", error)
    return res.status(500).json({
      success: false,
      message: "Could not send email",
    })
  }
}

// ========================================
// Enroll Student in Courses
// ========================================
const enrollStudents = async (courses, userId) => {
  if (!courses || !userId) {
    throw new Error("Course ID and User ID required")
  }

  for (const courseId of courses) {
    const enrolledCourse = await Course.findByIdAndUpdate(
      courseId,
      { $addToSet: { studentsEnrolled: userId } }, // prevents duplicates
      { new: true }
    )

    if (!enrolledCourse) {
      throw new Error("Course not found")
    }

    const courseProgress = await CourseProgress.create({
      courseID: courseId,
      userId: userId,
      completedVideos: [],
    })

    const enrolledStudent = await User.findByIdAndUpdate(
      userId,
      {
        $addToSet: {
          courses: courseId,
          courseProgress: courseProgress._id,
        },
      },
      { new: true }
    )

    if (!enrolledStudent) {
      throw new Error("User not found")
    }

    await mailSender(
      enrolledStudent.email,
      `Successfully Enrolled into ${enrolledCourse.courseName}`,
      courseEnrollmentEmail(
        enrolledCourse.courseName,
        `${enrolledStudent.firstName} ${enrolledStudent.lastName}`
      )
    )
  }
}