import mongoose from "mongoose";

const connectDB = async () => {
  try {
    // ✅ Validate ENV
    if (!process.env.MONGO_URI) {
      console.error("❌ MONGO_URI is missing in environment variables");
      process.exit(1);
    }

    // ✅ Connect with better options
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // fail fast if DB not reachable
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err.message);

    // Optional: Retry instead of exit (better for deployment)
    setTimeout(connectDB, 5000);
  }
};

export default connectDB;