const mongoose = require("mongoose")

const connectDB = async () => {
  try {
    await mongoose.connect(
      "mongodb+srv://fuibui3:123456%40@cluster0.jnhped4.mongodb.net/restaurant-management?retryWrites=true&w=majority&appName=Cluster0",
      {
        serverSelectionTimeoutMS: 10000,
      },
    )
    console.log("✅ MongoDB connected")
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message)
    process.exit(1)
  }
}

module.exports = connectDB
