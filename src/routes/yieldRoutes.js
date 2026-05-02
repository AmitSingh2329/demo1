import express from "express";
import { predictYield } from "../controllers/yieldController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// 🔥 Yield Prediction
router.post("/predict", protect, predictYield);

export default router;