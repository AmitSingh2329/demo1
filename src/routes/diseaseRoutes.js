import express from "express";
import { detectDisease } from "../controllers/diseaseController.js";
import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.post(
  "/detect",
  protect,
  upload.single("file"),
  detectDisease
);

export default router;