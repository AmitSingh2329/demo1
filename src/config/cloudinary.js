import dotenv from "dotenv";
dotenv.config();

import { v2 as cloudinary } from "cloudinary";

// Validate ENV variables
if (
  !process.env.CLOUD_NAME ||
  !process.env.CLOUD_API_KEY ||
  !process.env.CLOUD_API_SECRET
) {
  console.error("❌ Cloudinary ENV variables missing!");
  process.exit(1); // Stop server immediately
}

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
  // secure: true,
});

export default cloudinary;