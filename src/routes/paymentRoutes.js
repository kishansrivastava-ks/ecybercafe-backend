/**
 * routes/paymentRoutes.js
 *
 * Defines the API routes for payment processing.
 */
import express from "express";
import {
  initiateITRWithUpload,
  itrPaymentCallback,
} from "../controllers/paymentController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Route to start the payment process for an ITR service
// It's protected to ensure only logged-in users can initiate payments.
router.post("/initiate-itr-payment", protect, initiateITRWithUpload);

// Route for PayU to send the user back to after payment attempt.
// This route should NOT be protected by your auth middleware, as PayU's server will be calling it.
router.post("/itr-callback", itrPaymentCallback);

export default router;
