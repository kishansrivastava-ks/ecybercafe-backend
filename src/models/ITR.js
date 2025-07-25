/**
 * ITR Model (models/ITR.js)
 * * This schema defines the structure for an Income Tax Return (ITR) service application.
 * It includes all the specific fields required for an ITR filing and links back to the user.
 */
import mongoose from "mongoose";

const itrSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    aadharCardNo: {
      type: String,
      required: [true, "Aadhar Card number is required"],
    },
    panCardNo: {
      type: String,
      required: [true, "PAN Card number is required"],
      uppercase: true,
      trim: true,
    },
    accountNo: {
      type: String,
      required: [true, "Bank account number is required"],
    },
    ifscCode: {
      type: String,
      required: [true, "IFSC code is required"],
      uppercase: true,
      trim: true,
    },
    // Store the public path to the uploaded files
    aadharFile: {
      type: String,
      required: true,
    },
    panCardFile: {
      type: String,
      required: true,
    },
    passbookFile: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "filed", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true } // Adds createdAt and updatedAt timestamps
);

export default mongoose.model("ITR", itrSchema);
