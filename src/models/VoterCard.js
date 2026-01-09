import mongoose from "mongoose";

const voterCardSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // Application Details
    state: { type: String, required: true },
    name: { type: String, required: true },
    referenceNumber: { type: String, required: true },

    // Config
    price: { type: Number, default: 370 }, // Stored in schema as requested

    // The document uploaded by Admin (Replaceable)
    adminFilePath: { type: String, default: null },
    adminFileOriginalName: { type: String, default: null },

    // Status is primarily managed in the parent 'Service' model,
    // but we can mirror it here if needed for specific logic.
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("VoterCard", voterCardSchema);
