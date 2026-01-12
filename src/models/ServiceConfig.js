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

    isActive: {
      type: Boolean,
      default: true, // Services are active by default
    },
    maintenanceMessage: {
      type: String,
      default: "This service is currently under maintenance.",
    },
  },
  { timestamps: true }
);

export default mongoose.model("ServiceConfig", serviceConfigSchema);
