import express from "express";
import { protect, isAdmin } from "../middlewares/authMiddleware.js";
import {
  getOverallStats,
  getRetailerList,
  getRetailerDeepDive,
} from "../controllers/adminStatsController.js";

const router = express.Router();

router.get("/overview", protect, isAdmin, getOverallStats);
router.get("/retailers", protect, isAdmin, getRetailerList);
router.get("/retailer/:id", protect, isAdmin, getRetailerDeepDive);

export default router;
