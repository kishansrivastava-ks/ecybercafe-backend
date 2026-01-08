import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    // Link to the Retailer (User)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Amount involved (e.g., 1000 for recharge, 300 for pan card)
    amount: {
      type: Number,
      required: true,
    },

    // Money coming IN (Credit) or going OUT (Debit)
    type: {
      type: String,
      enum: ["CREDIT", "DEBIT"],
      required: true,
    },

    // Why did this transaction happen?
    category: {
      type: String,
      enum: ["RECHARGE", "SERVICE_PAYMENT", "REFUND"],
      required: true,
    },

    // Description for the bank statement (e.g., "Pan Card Application for Client X")
    description: {
      type: String,
      required: true,
    },

    // Payment Gateway Order ID (Specific to Recharges)
    orderId: {
      type: String,
      unique: true,
      sparse: true, // sparse allows this field to be null/missing for "SERVICE_PAYMENT" transactions
    },

    // Payment Gateway Transaction ID (From AllAPI)
    paymentTxnId: {
      type: String,
    },

    // Status of the transaction
    status: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED"],
      default: "PENDING",
    },

    // Optional: Link to a specific service record if this was a service payment
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: false,
    },
  },
  { timestamps: true }
);

const Transaction = mongoose.model("Transaction", transactionSchema);
export default Transaction;
