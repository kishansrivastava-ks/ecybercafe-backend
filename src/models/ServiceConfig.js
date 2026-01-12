import mongoose from "mongoose";

const serviceConfigSchema = new mongoose.Schema(
  {
    serviceType: {
      type: String,
      required: true,
      unique: true,
      enum: ["PanCard", "VoterCard", "Rtps", "LabourCard"], // Add new services here as you grow
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    label: { type: String }, // User-friendly name (e.g., "PAN Card Application")
  },
  { timestamps: true }
);

export default mongoose.model("ServiceConfig", serviceConfigSchema);
