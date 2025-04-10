import mongoose from "mongoose";

const panCardSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    fullName: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    fatherName: { type: String, required: true },
    mobileNumber: { type: String, required: true },
    aadharNumber: { type: String, required: true },
    address: { type: String, required: true },
    photoPath: { type: String, required: true },
    signaturePath: { type: String, required: true },
    aadharFilePath: { type: String },
    status: {
      type: String,
      enum: ["pending", "processing", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("PanCard", panCardSchema);
