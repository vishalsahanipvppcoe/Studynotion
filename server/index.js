const express = require("express");
const app = express();
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const userRoutes = require("./routes/User");
const profileRoutes = require("./routes/Profile");
const paymentRoutes = require("./routes/Payments");
const courseRoutes = require("./routes/Course");
const contactUsRoute = require("./routes/Contact");
const database = require("./config/database");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { cloudinaryConnect } = require("./config/cloudinary");
const fileUpload = require("express-fileupload");
const dotenv = require("dotenv");

dotenv.config();
const PORT = process.env.PORT || 4000;

// ================= DATABASE CONNECT =================
database.connect();

// ================= MIDDLEWARES =================
app.use(express.json());
app.use(cookieParser());

/* ================== ✅ FIXED CORS CONFIG ==================
   ✔ allows localhost (dev)
   ✔ allows deployed frontend (vercel)
   ✔ enables cookies
*/
const allowedOrigins = [
  "http://localhost:3000",
  "https://studynotion-liard-zeta.vercel.app",
  "https://studynotion-git-main-vishalsahanipvppcoes-projects.vercel.app",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// ================= FILE UPLOAD =================
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp",
  })
);

// ================= CLOUDINARY =================
cloudinaryConnect();

// ================= ROUTES =================
app.use("/api/v1/auth", userRoutes);
app.use("/api/v1/profile", profileRoutes);
app.use("/api/v1/course", courseRoutes);
app.use("/api/v1/payment", paymentRoutes);
app.use("/api/v1/reach", contactUsRoute);

// ================= HEALTH / DEFAULT =================
app.get("/", (req, res) => {
  return res.json({
    success: true,
    message: "Your server is up and running....",
  });
});

// ================= START SERVER =================
app.listen(PORT, () => {
  console.log(`App is running at ${PORT}`);
});
