const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGO_URI
    );

    console.log("");
    console.log("==============================");
    console.log("✅ MongoDB Connected");
    console.log(
      `📦 Database: ${conn.connection.name}`
    );
    console.log(
      `🌐 Host: ${conn.connection.host}`
    );
    console.log("==============================");

    return conn;
  } catch (error) {
    console.error("");
    console.error("❌ MongoDB Connection Failed");
    console.error(error.message);

    throw error;
  }
};

module.exports = connectDB;