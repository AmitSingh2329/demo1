
import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import User from "../models/User.js";
import { v2 as cloudinary } from "cloudinary";

export const detectDisease = async (req, res) => {
  let result = { disease: "Unknown Disease" };
  let imageUrl = "";

  // ❌ No file
  if (!req.file) {
    return res.status(400).json({ error: "Image is required" });
  }

  console.log("FILE PATH:", req.file.path);

  // 🔥 STEP 1: Configure Cloudinary (RUNTIME SAFE)
  cloudinary.config({
    cloud_name: process.env.CLOUD_NAME?.trim(),
    api_key: process.env.CLOUD_API_KEY?.trim(),
    api_secret: process.env.CLOUD_API_SECRET?.trim(),
  });

  console.log("ENV CHECK:");
  console.log(process.env.CLOUD_NAME);
  console.log(process.env.CLOUD_API_KEY);
  console.log(process.env.CLOUD_API_SECRET);

  // 🔥 STEP 2: Upload Image (ALWAYS TRY)
  try {
    console.log("Uploading to Cloudinary...");

    const uploaded = await cloudinary.uploader.upload(req.file.path, {
      folder: "disease_detection",
    });

    imageUrl = uploaded.secure_url;

    console.log("✅ Cloudinary URL:", imageUrl);

  } catch (uploadError) {
    console.error("❌ Cloudinary Error:", uploadError.message);
  }

  // 🔥 STEP 3: Try ML (OPTIONAL / FALLBACK SAFE)
  try {
    if (process.env.ML_DISEASE_API) {
      const formData = new FormData();
      formData.append("file", fs.createReadStream(req.file.path));

      const mlResponse = await axios.post(
        process.env.ML_DISEASE_API,
        formData,
        {
          headers: formData.getHeaders(),
          timeout: 10000,
        }
      );

      result = {
        disease: mlResponse.data?.disease || "Unknown Disease",
      };

      console.log("✅ ML RESULT:", result);
    } else {
      console.log("⚠️ ML API not configured");
    }

  } catch (mlError) {
    console.error("❌ ML ERROR:", mlError.code || mlError.message);

    result = {
      disease: "Unknown Disease (ML unavailable)",
    };
  }

  // 🔥 STEP 4: Save to DB (ALWAYS)
  try {
    if (req.user?._id) {
      await User.findByIdAndUpdate(req.user._id, {
        $push: {
          diseaseHistory: {
            image: imageUrl, // may be empty if upload fails
            result,
            createdAt: new Date(),
          },
        },
      });

      console.log("✅ Saved to DB");
    }
  } catch (dbError) {
    console.error("❌ DB Error:", dbError.message);
  }

  // 🧹 STEP 5: Clean local file
  if (req.file?.path) {
    fs.unlink(req.file.path, (err) => {
      if (err) console.log("Delete error:", err.message);
    });
  }

  // 🔥 FINAL RESPONSE
  res.status(200).json({
    message: "Detection completed",
    result,
    image: imageUrl, // optional (useful for frontend)
  });
};

