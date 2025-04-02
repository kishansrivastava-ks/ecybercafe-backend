import express from "express";
import {
  uploadServiceDocument,
  downloadServiceDocument,
  listServiceDocuments,
} from "../controllers/serviceController.js";
import { protect, isAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Upload document (admin only)
router.post(
  "/services/:serviceId/documents",
  protect,
  isAdmin,
  uploadServiceDocument
);

// List documents (user and admin)
router.get("/services/:serviceId/documents", protect, listServiceDocuments);

// Download document (user of the service or admin)
router.get(
  "/services/:serviceId/documents/:documentId/download",
  protect,
  downloadServiceDocument
);

export default router;
