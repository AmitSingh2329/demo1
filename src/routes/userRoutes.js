import express from "express";
import {
  deleteCropHistory,
  deleteDiseaseHistory,
  deleteYieldHistory
} from "../controllers/userController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.delete("/crop/:id", protect, deleteCropHistory);
router.delete("/disease/:id", protect, deleteDiseaseHistory);
router.delete("/yield/:id", protect, deleteYieldHistory);


export default router;