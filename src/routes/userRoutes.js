import express from "express";
import {
  deleteCropHistory,
  deleteDiseaseHistory
} from "../controllers/userController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.delete("/crop/:id", protect, deleteCropHistory);
router.delete("/disease/:id", protect, deleteDiseaseHistory);

export default router;