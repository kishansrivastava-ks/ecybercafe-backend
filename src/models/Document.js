import mongoose from "mongoose";

const DocumentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide a document name"],
    trim: true,
  },
  photoPath: {
    type: String,
    required: [true, "Please provide a photo"],
  },
  signaturePath: {
    type: String,
    required: [true, "Please provide a signature"],
  },
  docPath: {
    type: String,
    required: false,
  },

  // metaData
  photoOriginalName: String,
  signatureOriginalName: String,
  docOriginalName: String,
  docFileType: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Document", DocumentSchema);
