/**
 * models/TemporaryTransaction.js
 *
 * This schema holds ITR application data temporarily between the time of
 * form submission and successful payment verification.
 */
import mongoose from "mongoose";

const temporaryTransactionSchema = new mongoose.Schema(
  {
    txnid: { type: String, required: true, unique: true, index: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    serviceType: { type: String, required: true, default: "ITR" },
    // Store all the text data for the ITR application
    itrData: {
      aadharCardNo: String,
      panCardNo: String,
      accountNo: String,
      ifscCode: String,
    },
    // Store the paths to the files in their temporary location
    tempFilePaths: {
      aadharFile: String,
      panCardFile: String,
      passbookFile: String,
    },
    amount: { type: Number, required: true },
    status: { type: String, default: "pending" }, // e.g., pending, completed
  },
  {
    // Automatically delete documents after 1 hour to clean up abandoned transactions
    timestamps: true,
    expireAfterSeconds: 3600,
  }
);

export default mongoose.model(
  "TemporaryTransaction",
  temporaryTransactionSchema
);
