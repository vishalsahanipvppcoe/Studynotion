const mongoose = require("mongoose");
require("dotenv").config();

exports.connect = () => {
    mongoose
        .connect(process.env.MONGODB_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        })
        .then(() => {
            console.log("✅ DB Connected Successfully");
            console.log(
                "📂 Database Name:",
                mongoose.connection.db.databaseName
            );
            console.log(
                "🌐 Host:",
                mongoose.connection.host
            );
        })
        .catch((error) => {
            console.log("❌ DB Connection Failed");
            console.error(error);
            process.exit(1);
        });
};