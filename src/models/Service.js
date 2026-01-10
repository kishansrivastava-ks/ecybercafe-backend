import mongoose from "mongoose";
import PanCard from "./PanCard.js";
import VoterCard from "./VoterCard.js";
import Rtps from "./Rtps.js";

const models = { PanCard, VoterCard, Rtps };

const serviceSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Link to User
    serviceType: {
      type: String,
      required: true,
      enum: Object.keys(models),
    }, // Type of service
    specificService: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "serviceType",
    },
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed", "approved", "rejected"],
      default: "pending",
    },
    comments: [{ text: String, createdAt: { type: Date, default: Date.now } }],
    documents: [
      {
        filename: { type: String, required: true },
        originalName: { type: String, required: true },
        path: { type: String, required: true },
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        uploadedAt: { type: Date, default: Date.now },
        documentType: {
          type: String,
          enum: ["receipt", "additional_document", "proof", "other"],
          default: "other",
        },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Service", serviceSchema);
