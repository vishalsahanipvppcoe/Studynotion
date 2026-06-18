const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

const OTP = require('./models/OTP'); // Assuming this model is exported

async function runFullSignupTest() {
  const testEmail = `testsignup_${Date.now()}@gmail.com`;
  console.log(`Starting full signup test for email: ${testEmail}`);

  try {
    // 1. Send OTP
    console.log("1. Requesting OTP...");
    const otpRes = await axios.post("http://localhost:4000/api/v1/auth/sendotp", { email: testEmail });
    console.log("   OTP Response:", otpRes.data.message);

    // 2. Connect to DB to fetch the OTP (since we can't read the real email inbox)
    console.log("2. Connecting to Database to retrieve OTP...");
    await mongoose.connect(process.env.MONGODB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    // Wait a couple of seconds to ensure OTP is saved
    await new Promise(res => setTimeout(res, 2000));
    
    // Fetch latest OTP
    const otpDoc = await OTP.findOne({ email: testEmail }).sort({ createdAt: -1 }).limit(1);
    
    if (!otpDoc) {
      console.error("   Failed: Could not find OTP in database.");
      process.exit(1);
    }
    
    const otpCode = otpDoc.otp;
    console.log(`   Found OTP in database: ${otpCode}`);

    // 3. Signup with OTP
    console.log("3. Submitting Signup Request...");
    const signupPayload = {
      accountType: "Student",
      firstName: "Test",
      lastName: "User",
      email: testEmail,
      password: "TestPassword123!",
      confirmPassword: "TestPassword123!",
      otp: otpCode
    };

    const signupRes = await axios.post("http://localhost:4000/api/v1/auth/signup", signupPayload);
    console.log("   Signup Response:", signupRes.data.message);
    
    console.log("\n✅ FULL SIGNUP FLOW TEST COMPLETED SUCCESSFULLY!");

  } catch (err) {
    console.error("\n❌ Test Failed:");
    if (err.response) {
      console.error(err.response.data);
    } else {
      console.error(err.message);
    }
  } finally {
    // Disconnect DB
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
}

runFullSignupTest();
