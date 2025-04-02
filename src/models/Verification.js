import mongoose from "mongoose";

const verificationSchema = new mongoose.Schema({
  email: { type: String, required: true },
  code: { type: String, required: true },
  expiresAt: { type: Date, required: true },
});

const Verification = mongoose.model("Verification", verificationSchema);

export default Verification;
