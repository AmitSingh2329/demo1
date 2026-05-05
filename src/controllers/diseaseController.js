import axios from "axios";
import FormData from "form-data";
import User from "../models/User.js";
import cloudinary from "../config/cloudinary.js";

export const detectDisease = async (req, res) => {
  let result = { disease: "Unknown Disease" };
  let imageUrl = "";

  try {
    // ✅ Validate file
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];

    if (!req.file || !allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        error: "Valid image (jpg/png) is required",
      });
    }

    console.log("📦 File received:", req.file.originalname);

    // ☁️ Upload to Cloudinary
    const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

    const uploaded = await cloudinary.uploader.upload(base64, {
      folder: "disease_detection",
      resource_type: "image",
      transformation: [
        { width: 512, height: 512, crop: "limit" },
        { quality: "auto" },
      ],
    });

    if (!uploaded?.secure_url) {
      throw new Error("Cloudinary upload failed");
    }

    imageUrl = uploaded.secure_url;

    console.log("✅ Cloudinary URL:", imageUrl);

    // 🤖 ML API
    try {
      if (!process.env.ML_DISEASE_API) {
        throw new Error("ML API not configured");
      }

      const formData = new FormData();
      formData.append("file", req.file.buffer, {
        filename: req.file.originalname,
        contentType: req.file.mimetype,
      });

      const mlResponse = await axios.post(
        `${process.env.ML_DISEASE_API}/predict`,
        formData,
        {
          headers: formData.getHeaders(),
          timeout: 60000,
        },
      );

      const mlData = mlResponse.data;

      // 🔥 HANDLE INVALID IMAGE
      if (mlData.error) {
        return res.status(200).json({
          error: mlData.error,
          confidence: mlData.confidence || 0,
        });
      }

      // ✅ VALID RESULT
      result = {
        disease: mlData.disease || "Unknown Disease",
        confidence: mlData.confidence || 0,
        fallback: false,
      };

      console.log("✅ ML RESULT:", result);
    } catch (mlError) {
      console.error("❌ ML Error:", mlError.message);

      result = {
        disease: "Unknown Disease",
        fallback: true,
        message: "ML service unavailable",
      };
    }

    // 💾 Save to DB
    if (req.user?._id) {
      await User.findByIdAndUpdate(
        req.user._id,
        {
          $push: {
            diseaseHistory: {
              image: imageUrl,
              result,
              createdAt: new Date(),
            },
          },
        },
        { returnDocument: "before" },
      );

      console.log("✅ Saved to DB");
    }

    // 📤 Response
    res.status(200).json({
      message: "Detection completed",
      result,
      image: imageUrl,
    });
  } catch (error) {
    console.error("❌ Detection Error:", error.message);

    res.status(500).json({
      error: "Disease detection failed",
    });
  }
};