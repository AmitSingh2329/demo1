import express from "express";
import { detectDisease } from "../controllers/diseaseController.js";
import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.post(
  "/detect",
  protect,
  upload.single("image"),
  detectDisease
);

export default router;