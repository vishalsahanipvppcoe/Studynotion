const bcrypt = require("bcryptjs")
const User = require("../models/User")
const OTP = require("../models/OTP")
const jwt = require("jsonwebtoken")
const otpGenerator = require("otp-generator")
const mailSender = require("../utils/mailSender")
const { passwordUpdated } = require("../mail/templates/passwordUpdate")
const Profile = require("../models/Profile")
require("dotenv").config()

// ================= SIGNUP =================
exports.signup = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      accountType,
      contactNumber,
      otp,
    } = req.body

    if (
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !confirmPassword ||
      !otp
    ) {
      return res.status(403).json({
        success: false,
        message: "All Fields are required",
      })
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Password and Confirm Password do not match",
      })
    }

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      })
    }

    const response = await OTP.find({ email })
      .sort({ createdAt: -1 })
      .limit(1)

    if (response.length === 0 || otp !== response[0].otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const profileDetails = await Profile.create({
      gender: null,
      dateOfBirth: null,
      about: null,
      contactNumber: null,
    })

    const user = await User.create({
      firstName,
      lastName,
      email,
      contactNumber,
      password: hashedPassword,
      accountType,
      approved: accountType === "Instructor" ? false : true,
      additionalDetails: profileDetails._id,
      image: "",
    })

    return res.status(200).json({
      success: true,
      user,
      message: "User registered successfully",
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      success: false,
      message: "User cannot be registered",
    })
  }
}

// ================= LOGIN =================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields",
      })
    }

    const user = await User.findOne({ email }).populate("additionalDetails")
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not registered",
      })
    }

    if (await bcrypt.compare(password, user.password)) {
      const token = jwt.sign(
        { email: user.email, id: user._id, role: user.accountType },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
      )

      user.token = token
      user.password = undefined

      /* ================= 🔥 FIXED COOKIE OPTIONS ================= */
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: true,        // ✅ REQUIRED (HTTPS)
          sameSite: "none",    // ✅ REQUIRED (CROSS-ORIGIN)
          expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        })
        .status(200)
        .json({
          success: true,
          token,
          user,
          message: "User Login Success",
        })
    } else {
      return res.status(401).json({
        success: false,
        message: "Password is incorrect",
      })
    }
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      success: false,
      message: "Login Failure",
    })
  }
}

// ================= SEND OTP =================
exports.sendotp = async (req, res) => {
  try {
    const { email } = req.body

    const checkUserPresent = await User.findOne({ email })
    if (checkUserPresent) {
      return res.status(400).json({
        success: false,
        message: "User already registered",
      })
    }

    let otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    })

    const otpBody = await OTP.create({ email, otp })

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      otp,
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

// ================= CHANGE PASSWORD =================
exports.changePassword = async (req, res) => {
  try {
    const userDetails = await User.findById(req.user.id)
    const { oldPassword, newPassword } = req.body

    const isPasswordMatch = await bcrypt.compare(
      oldPassword,
      userDetails.password
    )

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: "Old password is incorrect",
      })
    }

    const encryptedPassword = await bcrypt.hash(newPassword, 10)
    await User.findByIdAndUpdate(req.user.id, {
      password: encryptedPassword,
    })

    await mailSender(
      userDetails.email,
      "Password updated",
      passwordUpdated(
        userDetails.email,
        `Password updated successfully`
      )
    )

    return res.status(200).json({
      success: true,
      message: "Password updated successfully",
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error updating password",
    })
  }
}
