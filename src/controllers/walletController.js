import axios from "axios";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";

// Helper: Generate Unique Order ID
const generateOrderId = () => {
  return `ORDS${Date.now()}${Math.floor(Math.random() * 1000)}`;
};

/**
 * @desc    Initiate Wallet Recharge
 * @route   POST /api/wallet/recharge
 * @access  Private
 */
export const initiateRecharge = async (req, res) => {
  try {
    const { amount } = req.body;
    const user = await User.findById(req.user.id);

    console.log("Initiating recharge for user:", user._id, "Amount:", amount);

    if (!amount || amount < 1) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const orderId = generateOrderId();

    // 1. Create PENDING Transaction in DB
    const transaction = await Transaction.create({
      user: user._id,
      amount: amount,
      type: "CREDIT",
      category: "RECHARGE",
      description: "Wallet Recharge via Payment Gateway",
      orderId: orderId,
      status: "PENDING",
    });

    console.log("Created transaction:", transaction);

    // 2. Prepare Payload for AllAPI
    // Note: redirect_url should point to your FRONTEND success page
    const payload = {
      token: process.env.PAYMENT_API_TOKEN,
      order_id: orderId,
      txn_amount: amount,
      txn_note: "Wallet Recharge",
      product_name: "Wallet Credit",
      customer_name: user.name,
      customer_mobile: "9999999999", // Replace with user mobile if you have it in schema
      customer_email: user.email,
      redirect_url: `${process.env.BACKEND_URL}/api/wallet/payment-return`,
    };

    console.log("Payload for AllAPI:", payload);

    // 3. Call AllAPI to create order
    const apiResponse = await axios.post(
      "https://allapi.in/order/create",
      payload,
      { headers: { "Content-Type": "application/json" } }
    );

    const data = apiResponse.data;

    console.log("AllAPI Response:", apiResponse);

    if (data.status === true) {
      res.status(200).json({
        success: true,
        payment_url: data.results.payment_url,
        order_id: orderId,
      });
    } else {
      // If API fails, mark DB transaction as Failed
      transaction.status = "FAILED";
      await transaction.save();
      res
        .status(400)
        .json({ message: "Payment Gateway Error", details: data.message });
    }
  } catch (error) {
    console.error("Recharge Init Error:", error);
    res.status(500).json({ message: "Server error initiating recharge" });
  }
};

/**
 * @desc    Handle Payment Webhook (Callback from AllAPI)
 * @route   POST /api/wallet/webhook
 * @access  Public (Called by AllAPI Server)
 */
export const handlePaymentWebhook = async (req, res) => {
  try {
    // AllAPI sends data as FORM DATA, handled by express.urlencoded()
    const { order_id, status, txn_id } = req.body;

    console.log("Webhook Received:", req.body);

    if (!order_id) {
      return res.status(400).json({ message: "Invalid Webhook Data" });
    }

    const transaction = await Transaction.findOne({ orderId: order_id });
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    // Idempotency: If already processed, don't do it again
    if (transaction.status === "SUCCESS") {
      return res.status(200).json({ message: "Already processed" });
    }

    if (status === "Success") {
      // 1. Update Transaction
      transaction.status = "SUCCESS";
      transaction.paymentTxnId = txn_id; // Save Gateway Txn ID
      await transaction.save();

      // 2. Update User Wallet Balance (Atomic Increment)
      await User.findByIdAndUpdate(transaction.user, {
        $inc: { walletBalance: transaction.amount },
      });

      console.log(`Wallet updated for order ${order_id}`);
    } else if (status === "Failed") {
      transaction.status = "FAILED";
      await transaction.save();
    }

    res.status(200).json({ message: "Webhook processed" });
  } catch (error) {
    console.error("Webhook Error:", error);
    res.status(500).json({ message: "Webhook Processing Failed" });
  }
};

/**
 * @desc    Manual Status Check (Fallback)
 * @route   POST /api/wallet/check-status
 * @access  Private
 */
export const checkPaymentStatus = async (req, res) => {
  try {
    const { order_id } = req.body;
    const transaction = await Transaction.findOne({ orderId: order_id });

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    // If already success, return strictly
    if (transaction.status === "SUCCESS") {
      return res.status(200).json({
        status: "SUCCESS",
        balance: (await User.findById(req.user.id)).walletBalance,
      });
    }

    // Call AllAPI Status Check
    const payload = {
      token: process.env.PAYMENT_API_TOKEN,
      order_id: order_id,
    };

    const apiResponse = await axios.post(
      "https://allapi.in/order/status",
      payload,
      { headers: { "Content-Type": "application/json" } }
    );

    const data = apiResponse.data;

    if (data.status === true && data.results.status === "Success") {
      // Verify amounts match before crediting
      if (parseFloat(data.results.txn_amount) === transaction.amount) {
        transaction.status = "SUCCESS";
        transaction.paymentTxnId = data.results.txn_id;
        await transaction.save();

        // Update User Balance
        const updatedUser = await User.findByIdAndUpdate(
          transaction.user,
          { $inc: { walletBalance: transaction.amount } },
          { new: true }
        );

        return res.status(200).json({
          status: "SUCCESS",
          balance: updatedUser.walletBalance,
        });
      }
    } else if (data.status === true && data.results.status === "Failed") {
      transaction.status = "FAILED";
      await transaction.save();
    }

    res.status(200).json({ status: transaction.status });
  } catch (error) {
    console.error("Status Check Error:", error);
    res.status(500).json({ message: "Error checking status" });
  }
};

/**
 * @desc    Get Wallet History
 * @route   GET /api/wallet/history
 * @access  Private
 */
export const getWalletHistory = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user.id })
      .sort({ createdAt: -1 }) // Newest first
      .limit(50); // Limit to last 50 transactions

    const user = await User.findById(req.user.id).select("walletBalance");

    res.status(200).json({
      balance: user.walletBalance,
      transactions,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching history" });
  }
};

/**
 * --- NEW FUNCTION ---
 * @desc    Handle Return from Gateway (Relay to Frontend)
 * @route   POST /api/wallet/payment-return
 * @access  Public
 */
export const handlePaymentReturn = (req, res) => {
  // 1. The gateway sends data here via POST
  const { order_id, status } = req.body;

  // 2. We simply redirect the user to the Frontend using GET
  // Make sure to include /dashboard/ if your route is nested there
  const frontendUrl = `${process.env.FRONTEND_URL}/dashboard/wallet/status/${order_id}`;

  return res.redirect(frontendUrl);
};
