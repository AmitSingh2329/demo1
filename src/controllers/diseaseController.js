import axios from "axios";
import FormData from "form-data";
import User from "../models/User.js";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

export const detectDisease = async (req, res) => {
  let result = { disease: "Unknown Disease" };
  let imageUrl = "";

  // ❌ No file
  if (!req.file) {
    return res.status(400).json({ error: "Image is required" });
  }

  console.log("📦 File received:", req.file.originalname);

  // 🔥 Upload buffer to Cloudinary
  const uploadFromBuffer = (buffer) => {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "disease_detection" },
        (error, result) => {
          if (result) resolve(result);
          else reject(error);
        }
      );
      streamifier.createReadStream(buffer).pipe(stream);
    });
  };

  // 🔥 STEP 1: Upload to Cloudinary
  try {
    console.log("☁️ Uploading to Cloudinary...");

    const uploaded = await uploadFromBuffer(req.file.buffer);
    imageUrl = uploaded.secure_url;

    console.log("✅ Cloudinary URL:", imageUrl);

  } catch (uploadError) {
    console.error("❌ Cloudinary Error:", uploadError.message);
  }

  // 🔥 STEP 2: ML API (optional)
  try {
    if (process.env.ML_DISEASE_API) {
      const formData = new FormData();

      formData.append("file", req.file.buffer, {
        filename: req.file.originalname,
        contentType: req.file.mimetype,
      });

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

  // 🔥 STEP 3: Save to DB
  try {
    if (req.user?._id) {
      await User.findByIdAndUpdate(req.user._id, {
        $push: {
          diseaseHistory: {
            image: imageUrl,
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

  // 🔥 FINAL RESPONSE
  res.status(200).json({
    message: "Detection completed",
    result,
    image: imageUrl,
  });
};