import express from "express";
import {
  addServiceComment,
  createAdmin,
  updateServiceStatus,
} from "../controllers/adminController.js";
import { isAdmin, protect } from "../middlewares/authMiddleware.js";
import {
  getAllServices,
  getServiceDetails,
  getServicesByType,
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

// Route to add comment to service (Admin only)
router.post("/service/:serviceId/comment", protect, isAdmin, addServiceComment);

router.get("/service/all-services", protect, isAdmin, getAllServices);
router.get("/service/by-type", protect, isAdmin, getServicesByType);

router.get("/service/:id", protect, getServiceDetails);

export default router;
