import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  initiateRecharge,
  handlePaymentWebhook,
  checkPaymentStatus,
  getWalletHistory,
  handlePaymentReturn,
} from "../controllers/walletController.js";

const router = express.Router();

// 1. Initiate Recharge (User triggers this)
router.post("/recharge", protect, initiateRecharge);

// 2. Webhook (Payment Gateway triggers this)
// IMPORTANT: This route must be publicly accessible (no auth)
router.post("/webhook", handlePaymentWebhook);

// 3. Manual Status Check (Frontend triggers if redirect happens without webhook update)
router.post("/check-status", protect, checkPaymentStatus);

// 4. Wallet History (User views their statement)
router.get("/history", protect, getWalletHistory);

// NEW: Payment Return Relay
// (Allow both GET and POST to be safe)
router.all("/payment-return", handlePaymentReturn);

export default router;
