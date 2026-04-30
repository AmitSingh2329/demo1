import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getUserAlerts } from "../controllers/alertController.js";

const router = express.Router();

// 🔥 Get alerts (real-time)
router.get("/", protect, getUserAlerts);

export default router;