import mongoose from "mongoose";

const rtpsSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    block: { type: String, enum: ["GOH", "KONCH"], required: true },
    registrationType: {
      type: String,
      enum: ["BRCCO", "BICCO", "BCCCO", "NCLCO", "BOBCO"],
      required: true,
    },
    registrationNumber: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("RTPS", rtpsSchema);
