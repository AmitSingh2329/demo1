import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes.js";
import crop_predictRoutes from "./routes/crop_predictRoutes.js";
import diseaseRoutes from "./routes/diseaseRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import alertRoutes from "./routes/alertRoutes.js";

dotenv.config();

const app = express();

// 🔥 MIDDLEWARE
/* ================= MIDDLEWARE ================= */

app.use(express.json());
app.use(cookieParser());

// 🔥 CORS (more flexible)
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174","https://demo2-three-topaz.vercel.app"], // allow both
    credentials: true,
  })
);

// 🟢 IMPORTANT: serve uploaded images
app.use("/uploads", express.static("uploads"));

// 🔥 ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/crop", crop_predictRoutes);
app.use("/api/disease", diseaseRoutes);
app.use("/api/user", userRoutes);
app.use("/api/alerts", alertRoutes);

app.get("/", (req, res) => {
  res.send("API is running 🚀");
});

export default app;