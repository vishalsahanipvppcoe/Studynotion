const mailSender = require("./utils/mailSender");
const emailTemplate = require("./mail/templates/emailVerificationTemplate");
require("dotenv").config();

async function test() {
    try {
        console.log("Trying to send OTP email with new logo...");
        const htmlBody = emailTemplate("123456");
        const info = await mailSender("vishalsahani4747@gmail.com", "Test OTP Email with New Logo", htmlBody);
        console.log("Success:", info.response);
    } catch (e) {
        console.error("Error:", e);
    }
}
test();
