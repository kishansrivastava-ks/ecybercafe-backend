import express from "express";
import {
  // applyForService,
  getUserServices,
  updateService,
  uploadServiceDocument,
  downloadServiceDocument,
  listServiceDocuments,
  applyForPanCard,
  deleteService,
  deleteAllServices,
  downloadProcessedImage,
  applyForVoterCard,
  uploadVoterDoc,
  downloadVoterPdf,
  applyForRtps,
  applyForLabourCard,
  getServicePrices,
} from "../controllers/serviceController.js";
import { protect, isAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

// NEW: Public route for authenticated users to check prices
router.get("/prices", protect, getServicePrices);

router.post("/apply/pan-card", protect, applyForPanCard);

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

// NEW ROUTE: Download processed photo or signature
// Example usage: /api/services/:serviceId/download-processed/photo
router.get(
  "/:serviceId/download-processed/:type",
  protect, // Keep protection if needed
  downloadProcessedImage
);

// FOR VOTER PDF SERVICE
// Retailer Route: Bulk Apply
router.post("/apply/voter-card", protect, applyForVoterCard);

// Admin Route: Upload/Replace Voter PDF
// Note: This is specific to Voter Card service ID
router.post("/:serviceId/voter/upload-doc", protect, isAdmin, uploadVoterDoc);
router.get("/:serviceId/voter/download", protect, downloadVoterPdf);

// Retailer: Bulk Apply RTPS
router.post("/apply/rtps", protect, applyForRtps);

// Retailer: Bulk Apply Labour Card
router.post("/apply/labour-card", protect, applyForLabourCard);

router.delete("/all", protect, deleteAllServices);
router.delete("/:serviceId", protect, deleteService);

export default router;
