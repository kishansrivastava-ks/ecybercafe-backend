import Document from "../models/Document.js";
import path from "path";
import fs from "fs";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";

// helper function to handle file upload with optimization
const processAndSaveImage = async (file, uploadDir, prefix) => {
  // create directory if it doesnt exist
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  //   generate unique file name
  const uniqueId = uuidv4();
  const fileExt = path.extname(file.name);
  const fileName = `${prefix}_${uniqueId}.${fileExt}`;
  const filePath = path.join(uploadDir, fileName);

  //   get image meta Data
  const metaData = await sharp(file.data).metadata();

  //   calculate the dimensions for 1:1 aspect ratio
  const size = Math.min(1200, Math.max(metaData.width, metaData.height));

  //   optimize and save image
  await sharp(file.data)
    .resize({
      width: size,
      height: size,
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .webp({ quality: 80 })
    .toFile(filePath);

  // return path relative to uploads directory
  return {
    path: `/uploads/documents/${fileName}`,
    originalName: file.name,
  };
};

// create a new document with optimized images
export const createDocument = async (req, res) => {
  const tempFilePaths = [];

  try {
    const { name } = req.body;

    // validate required fields
    if (!name) {
      return res.status(400).json({ message: "Document name is required" });
    }

    // validate files
    if (!req.files || !req.files.photo || !req.files.signature) {
      return res
        .status(400)
        .json({ message: "Both photo and signature are required" });
    }

    const photoFile = req.files.photo;
    const signatureFile = req.files.signature;

    // validate file types
    const allowedMimeTypes = [
      "image/jpg",
      "image/png",
      "image/webp",
      "image/jpeg",
    ];
    console.log(photoFile, signatureFile);
    if (
      !allowedMimeTypes.includes(photoFile.mimetype) ||
      !allowedMimeTypes.includes(signatureFile.mimetype)
    ) {
      return res
        .status(400)
        .json({ message: "Only JPEG, PNG and WebP files are allowed" });
    }

    // validate file sizes
    const maxFileSize = 5 * 1024 * 1024; // 5MB
    if (photoFile.size > maxFileSize || signatureFile.size > maxFileSize) {
      return res.status(400).json({ message: "File size exceeds 5MB" });
    }

    // define the upload directory
    const uploadDir = path.join(process.cwd(), "uploads", "documents");

    // process and save images
    const photoResult = await processAndSaveImage(
      photoFile,
      uploadDir,
      "photo"
    );
    const signatureResult = await processAndSaveImage(
      signatureFile,
      uploadDir,
      "signature"
    );

    // track paths for clean up in case of error
    tempFilePaths.push(
      path.join(process.cwd(), photoResult.path),
      path.join(process.cwd(), signatureResult.path)
    );

    // create document in database
    const document = await Document.create({
      name,
      photoPath: photoResult.path,
      signaturePath: signatureResult.path,
      photoOriginalName: photoResult.originalName,
      signatureOriginalName: signatureResult.originalName,
    });

    res.status(201).json({
      success: true,
      data: document,
    });
  } catch (error) {
    // clean up any uploaded files if the database operation fails
    tempFilePaths.forEach((filePath) => {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });

    console.error("Error in creating document", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error in creating document",
    });
  }
};

// get document by id
export const getDocumentById = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }
    res.status(200).json({
      success: true,
      data: document,
    });
  } catch (error) {
    console.error("Error in getting document by id", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error in getting document by id",
    });
  }
};

export const getAllDocuments = async (req, res) => {
  try {
    const documents = await Document.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: documents.length,
      data: documents,
    });
  } catch (error) {
    console.error("Error in getAllDocuments:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error retrieving documents",
    });
  }
};
