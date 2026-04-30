import express from "express";
import { predictCrop } from "../controllers/crop_predictController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/predict", protect, predictCrop);

export default router;