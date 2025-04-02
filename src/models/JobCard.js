import mongoose from "mongoose";

const jobCardSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    fatherHusbandName: { type: String, required: true },
    aadharFilePath: { type: String, required: true }, // Aadhar file upload
    passbookFilePath: { type: String, required: true }, // Passbook file upload
    status: {
      type: String,
      enum: ["pending", "processing", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("JobCard", jobCardSchema);
