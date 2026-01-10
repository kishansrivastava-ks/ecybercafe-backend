import mongoose from "mongoose";

const labourCardSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // Application Details
    district: { type: String, required: false }, // Optional as requested
    block: { type: String, required: true },
    name: { type: String, required: true },
    applicationNumber: { type: String, required: true },

    // Config
    price: { type: Number, default: 370 },

    // Admin Actions (Same structure as RTPS)
    statusRemark: { type: String, default: null },

    generalRemarks: [
      {
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
        adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      },
    ],

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("LabourCard", labourCardSchema);
