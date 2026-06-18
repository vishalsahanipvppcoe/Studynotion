const axios = require('axios');

async function runTests() {
  const email = `vishalsahani4747@gmail.com`; // Your actual email
  
  console.log("1. Testing Send OTP...");
  try {
    const res = await axios.post("http://localhost:4000/api/v1/auth/sendotp", { email });
    console.log("   Success:", res.data.message);
  } catch (err) {
    console.error("   Failed:", err.response?.data?.message || err.message);
  }

  console.log("\n2. Testing Forgot Password...");
  try {
    const res = await axios.post("http://localhost:4000/api/v1/auth/reset-password-token", { email });
    console.log("   Success:", res.data.message);
  } catch (err) {
    console.error("   Failed:", err.response?.data?.message || err.message);
  }
}

runTests();
