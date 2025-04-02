import express from "express";
import {
  // applyForService,
  getUserServices,
  updateService,
  uploadServiceDocument,
  downloadServiceDocument,
  listServiceDocuments,
  applyForPanCard,
  applyForRTPS,
  applyForJobCard,
} from "../controllers/serviceController.js";
import { protect, isAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

// router.post("/apply", protect, applyForService);

router.post("/apply/pan-card", protect, applyForPanCard);
router.post("/apply/rtps", protect, applyForRTPS);
router.post("/apply/job-card", protect, applyForJobCard);

router.get("/my-services", protect, getUserServices);
router.put("/update/:serviceId", protect, isAdmin, updateService);

// Upload document (admin only)
router.post("/:serviceId/documents", protect, isAdmin, uploadServiceDocument);

// List documents (user and admin)
router.get("/:serviceId/documents", protect, listServiceDocuments);

// Download document (user of the service or admin)
router.get(
  "/:serviceId/documents/:documentId/download",
  protect,
  downloadServiceDocument
);

export default router;
