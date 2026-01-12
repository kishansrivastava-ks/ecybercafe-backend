import express from "express";
import {
  addServiceComment,
  createAdmin,
  getAllServicePrices,
  getAllUsers,
  toggleServiceStatus,
  updateServicePrice,
  updateServiceStatus,
} from "../controllers/adminController.js";
import { isAdmin, protect } from "../middlewares/authMiddleware.js";
import {
  getAllServices,
  getServiceDetails,
  getServicesByType,
  handleLabourCardAction,
  handleRtpsAction,
} from "../controllers/serviceController.js";

const router = express.Router();

router.post("/create-admin", createAdmin);

// Route to update service status (Admin only)
router.patch(
  "/service/:serviceId/status",
  protect,
  isAdmin,
  updateServiceStatus
);

// Route to get all users (Admin only)
router.get("/users/all-users", protect, isAdmin, getAllUsers);

// Route to add comment to service (Admin only)
router.post("/service/:serviceId/comment", protect, isAdmin, addServiceComment);

router.get("/service/all-services", protect, isAdmin, getAllServices);
router.get("/service/by-type", protect, isAdmin, getServicesByType);

router.get("/service/:id", protect, getServiceDetails);

// Admin: Perform Action on RTPS (Approve/Reject/Remark)
router.post(
  "/service/:serviceId/rtps/action",
  protect,
  isAdmin,
  handleRtpsAction
);

// Admin: Perform Action on Labour Card
router.post(
  "/service/:serviceId/labour/action",
  protect,
  isAdmin,
  handleLabourCardAction
);

// --- Pricing Configuration Routes ---
router.get("/config/prices", protect, isAdmin, getAllServicePrices);
router.put("/config/prices", protect, isAdmin, updateServicePrice);

// Toggle Service Route
router.patch("/config/toggle", protect, isAdmin, toggleServiceStatus);

export default router;
