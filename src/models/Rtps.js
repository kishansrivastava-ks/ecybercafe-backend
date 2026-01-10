import mongoose from "mongoose";

const rtpsSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // Application Details
    district: { type: String, required: true },
    block: { type: String, required: true },
    referenceNumber: { type: String, required: true },

    // Config
    price: { type: Number, default: 2 },

    // Admin Actions
    // 1. The specific note given during Approval or Rejection
    statusRemark: { type: String, default: null },

    // 2. Array for general remarks/history
    generalRemarks: [
      {
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
        adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Optional: track which admin added it
      },
    ],

    // Mirroring status here for easy querying
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Rtps", rtpsSchema);
