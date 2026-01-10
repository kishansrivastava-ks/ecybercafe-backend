import Service from "../models/Service.js";
import PanCard from "../models/PanCard.js";

import User from "../models/User.js";
import Transaction from "../models/Transaction.js";

import VoterCard from "../models/VoterCard.js";
import Rtps from "../models/Rtps.js";
import LabourCard from "../models/LabourCard.js";

import mime from "mime-types";
import path from "path";
import fs from "fs";

import sharp from "sharp";

// Define the cost for this specific service
const PANCARD_COST = 125;

export const applyForPanCard = async (req, res) => {
  try {
    const {
      fullName,
      dateOfBirth,
      fatherName,
      mobileNumber,
      aadharNumber,
      address,
    } = req.body;
    if (
      ![
        fullName,
        dateOfBirth,
        fatherName,
        mobileNumber,
        aadharNumber,
        address,
      ].every(Boolean)
    ) {
      return res
        .status(400)
        .json({ message: "All fields are required for PanCard" });
    }
    if (
      !req.files ||
      !req.files.photo ||
      !req.files.signature ||
      !req.files.aadharFile
    ) {
      return res.status(400).json({
        message: "Photo and signature and Aadhar card are required for PanCard",
      });
    }

    // ---------------------------------------------------------
    // 2. WALLET CHECK (New Logic)
    // ---------------------------------------------------------
    const user = await User.findById(req.user.id);

    if (user.walletBalance < PANCARD_COST) {
      return res.status(402).json({
        // 402 Payment Required
        message: `Insufficient wallet balance. Required: ₹${PANCARD_COST}, Available: ₹${user.walletBalance}. Please recharge your wallet.`,
      });
    }
    // ---------------------------------------------------------

    // 3. File Handling
    const uploadDir = path.join(process.cwd(), "uploads", "pan-card");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const photoFileName = `photo_${Date.now()}${path.extname(
      req.files.photo.name
    )}`;
    const signatureFileName = `signature_${Date.now()}${path.extname(
      req.files.signature.name
    )}`;
    const aadharFileName = `aadhar_${Date.now()}${path.extname(
      req.files.aadharFile.name
    )}`;
    const photoPath = path.join(uploadDir, photoFileName);
    const signaturePath = path.join(uploadDir, signatureFileName);
    const aadharFilePath = path.join(uploadDir, aadharFileName);
    req.files.photo.mv(photoPath);
    req.files.signature.mv(signaturePath);
    req.files.aadharFile.mv(aadharFilePath);

    // 4. Create PanCard Specific Record
    const specificService = await PanCard.create({
      user: req.user.id,
      fullName,
      dateOfBirth: new Date(dateOfBirth),
      fatherName,
      mobileNumber,
      aadharNumber,
      address,
      photoPath: `/uploads/pan-card/${photoFileName}`,
      signaturePath: `/uploads/pan-card/${signatureFileName}`,
      aadharFilePath: `/uploads/pan-card/${aadharFileName}`,
    });

    // 5. Create General Service Record
    const service = await Service.create({
      user: req.user.id,
      serviceType: "PanCard",
      specificService: specificService._id,
    });

    // ---------------------------------------------------------
    // 6. DEDUCT BALANCE & LOG TRANSACTION
    // ---------------------------------------------------------

    // A. Deduct Amount from User Wallet
    user.walletBalance -= PANCARD_COST;
    await user.save();

    // B. Create Debit Transaction Log
    await Transaction.create({
      user: req.user.id,
      amount: PANCARD_COST,
      type: "DEBIT",
      category: "SERVICE_PAYMENT",
      description: `Applied for Pan Card (Name: ${fullName})`,
      status: "SUCCESS",
      serviceId: service._id, // Link it to the service for reference
    });
    // ---------------------------------------------------------

    res.status(201).json({
      message: "PanCard application submitted successfully",
      service,
      specificService,
      remainingBalance: user.walletBalance,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserServices = async (req, res) => {
  try {
    // const services = await Service.find({ user: req.user.id });
    const services = await Service.find({ user: req.user.id }).populate({
      path: "specificService",
      // model: (doc) => doc.serviceType,
    });
    res.status(200).json(services);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteService = async (req, res) => {
  try {
    const { serviceId } = req.params;

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }
    if (service.user.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "You do not have permission to delete this service" });
    }

    await Service.findByIdAndDelete(serviceId);

    res.status(200).json({ message: "Service deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// to delete all the services of the currently logged in user
export const deleteAllServices = async (req, res) => {
  try {
    await Service.deleteMany({ user: req.user.id });
    res.status(200).json({ message: "All services deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateService = async (req, res) => {
  try {
    const { status, comment } = req.body;
    const service = await Service.findById(req.params.serviceId);

    if (!service) return res.status(404).json({ message: "Service not found" });

    if (status) service.status = status;
    if (comment) service.comments.push({ text: comment });

    await service.save();
    res.status(200).json({ message: "Service updated successfully", service });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllServices = async (req, res) => {
  try {
    const services = await Service.find()
      .populate("user", "name email")
      .populate("specificService");
    res.status(200).json(services);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getServicesByType = async (req, res) => {
  const { type } = req.query;

  try {
    if (!type) {
      return res
        .status(400)
        .json({ message: "Service type is required as a query parameter." });
    }

    const services = await Service.find({ serviceType: type })
      .populate("user", "name email")
      .populate("specificService");

    res.status(200).json({
      results: services.length,
      data: services,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getServiceDetails = async (req, res) => {
  try {
    const { id } = req.params; // Get service ID from URL params

    // Find the service and populate user and specific service details
    const service = await Service.findById(id)
      .populate("user", "name email") // Populate user details
      .populate("specificService"); // Populate specific service details

    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    res.status(200).json(service);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const uploadServiceDocument = async (req, res) => {
  try {
    // Check if file is uploaded
    if (!req.files || !req.files.document) {
      return res.status(400).json({ message: "Document is required" });
    }

    const { serviceId } = req.params;
    const { documentType = "other" } = req.body;
    const documentFile = req.files.document;

    // Find the service
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    // Use original filename, sanitize it to prevent potential security issues
    const sanitizedFileName = documentFile.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const uniqueFileName = `${Date.now()}_${sanitizedFileName}`;

    // Define upload directory
    const uploadDir = path.join(
      process.cwd(),
      "uploads",
      "service-documents",
      serviceId
    );

    // Create upload directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Save file path
    const filePath = path.join(uploadDir, uniqueFileName);

    // Move the file
    await documentFile.mv(filePath);

    // Add document to service
    service.documents.push({
      filename: uniqueFileName,
      originalName: documentFile.name,
      path: `/uploads/service-documents/${serviceId}/${uniqueFileName}`,
      uploadedBy: req.user.id,
      documentType,
    });

    // Save the service
    await service.save();

    res.status(201).json({
      message: "Document uploaded successfully",
      document: service.documents[service.documents.length - 1],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

export const downloadServiceDocument = async (req, res) => {
  try {
    const { serviceId, documentId } = req.params;

    // Find the service
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    // Find the specific document
    const document = service.documents.id(documentId);
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Check user permissions
    // Admin can always download
    // User can only download their own service documents
    const isAdmin = req.user.role === "admin";
    const isOwnService = service.user.toString() === req.user.id;

    if (!isAdmin && !isOwnService) {
      return res
        .status(403)
        .json({ message: "Unauthorized to download this document" });
    }

    // Construct full file path
    const filePath = path.join(process.cwd(), document.path.slice(1));

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found on server" });
    }

    // Determine MIME type
    const mimeType = mime.lookup(filePath) || "application/octet-stream";

    // Set headers for download
    res.set("Content-Type", mimeType);
    res.set(
      "Content-Disposition",
      `attachment; filename="${document.originalName}"`
    );

    // Send file for download
    // res.download(filePath, document.originalName);

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

export const listServiceDocuments = async (req, res) => {
  try {
    const { serviceId } = req.params;

    // Find the service and populate documents
    const service = await Service.findById(serviceId)
      .select("documents")
      .populate("documents.uploadedBy", "name email");

    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    res.status(200).json(service.documents);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

export const downloadProcessedImage = async (req, res) => {
  try {
    const { serviceId, type } = req.params; // type will be "photo" or "signature"

    // 1. Fetch the Service
    const service = await Service.findById(serviceId).populate(
      "specificService"
    );
    console.log("Service fetched for processed image:", service);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    // 2. Determine the file path and processing settings
    let relativePath = "";
    let width = 0;
    let height = 0;
    let dpi = 0;

    if (type === "photo") {
      relativePath = service.specificService.photoPath;
      width = 213;
      height = 213;
      dpi = 300;
    } else if (type === "signature") {
      relativePath = service.specificService.signaturePath;
      width = 400;
      height = 200;
      dpi = 600;
    } else {
      return res.status(400).json({ message: "Invalid image type requested" });
    }

    // 3. Construct absolute path
    // Remove leading slash if present to join correctly with process.cwd()
    const cleanPath = relativePath.startsWith("/")
      ? relativePath.slice(1)
      : relativePath;
    const filePath = path.join(process.cwd(), cleanPath);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found on server" });
    }

    // 4. Process with Sharp
    const processedImageBuffer = await sharp(filePath)
      .resize(width, height, {
        fit: "fill", // Forces exact dimensions (might stretch if aspect ratio differs)
        background: { r: 255, g: 255, b: 255, alpha: 1 }, // White background (safe for JPEGs)
      })
      .withMetadata({ density: dpi }) // SETS THE DPI
      .toFormat("jpeg")
      .toBuffer();

    // 5. Send Response
    res.set("Content-Type", "image/jpeg");
    res.set(
      "Content-Disposition",
      `attachment; filename="${type}_processed_${serviceId}.jpg"`
    );
    res.send(processedImageBuffer);
  } catch (error) {
    console.error("Error processing image download:", error);
    res.status(500).json({ message: "Error processing image download" });
  }
};

// ---------------------------------------------
// FOR VOTER PDF SERVICE
// ---------------------------------------------

// --- 1. BULK APPLY FOR VOTER CARD ---
export const applyForVoterCard = async (req, res) => {
  try {
    const { applications } = req.body; // Expecting an Array of objects

    // 1. Validation
    if (
      !applications ||
      !Array.isArray(applications) ||
      applications.length === 0
    ) {
      return res
        .status(400)
        .json({ message: "Please provide a list of applications." });
    }

    // Validate each item in the array
    for (const app of applications) {
      if (!app.state || !app.name || !app.referenceNumber) {
        return res.status(400).json({
          message:
            "State, Name, and Reference Number are required for all items.",
        });
      }
    }

    const VOTER_COST_PER_UNIT = 30;
    const totalCount = applications.length;
    const totalCost = totalCount * VOTER_COST_PER_UNIT;

    // 2. Wallet Check
    const user = await User.findById(req.user.id);
    if (user.walletBalance < totalCost) {
      return res.status(402).json({
        message: `Insufficient wallet balance. Total Cost: ₹${totalCost} for ${totalCount} applications. Available: ₹${user.walletBalance}.`,
      });
    }

    // 3. Process Applications
    const createdServices = [];

    // Loop through and create records
    // Note: In a production environment with thousands of items, you might use insertMany,
    // but for <100 items, a loop with individual creation ensures proper linkage.
    for (const appData of applications) {
      // A. Create Specific Record
      const specificService = await VoterCard.create({
        user: req.user.id,
        state: appData.state,
        name: appData.name,
        referenceNumber: appData.referenceNumber,
        price: VOTER_COST_PER_UNIT,
        status: "pending",
      });

      // B. Create Generic Service Record
      const service = await Service.create({
        user: req.user.id,
        serviceType: "VoterCard",
        specificService: specificService._id,
        status: "pending",
      });

      createdServices.push(service);
    }

    // 4. Deduct Balance & Log Transaction (Single Transaction for Bulk Order)
    user.walletBalance -= totalCost;
    await user.save();

    await Transaction.create({
      user: req.user.id,
      amount: totalCost,
      type: "DEBIT",
      category: "SERVICE_PAYMENT",
      description: `Bulk Voter PDF Application (${totalCount} items)`,
      status: "SUCCESS",
      // We can't link multiple service IDs easily in one field,
      // so we leave serviceId null or link the first one if strictly needed.
    });

    res.status(201).json({
      message: `Successfully created ${totalCount} applications.`,
      count: totalCount,
      deductedAmount: totalCost,
      remainingBalance: user.walletBalance,
      services: createdServices,
    });
  } catch (error) {
    console.error("Voter Apply Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// --- 2. ADMIN UPLOAD/REPLACE DOCUMENT ---
export const uploadVoterDoc = async (req, res) => {
  try {
    const { serviceId } = req.params;

    if (!req.files || !req.files.document) {
      return res.status(400).json({ message: "No document file uploaded." });
    }

    // Find the Generic Service first
    const service = await Service.findById(serviceId).populate(
      "specificService"
    );
    if (!service || service.serviceType !== "VoterCard") {
      return res.status(404).json({ message: "Voter Service not found." });
    }

    const voterCard = await VoterCard.findById(service.specificService._id);
    if (!voterCard) {
      return res
        .status(404)
        .json({ message: "Specific Voter Card record not found." });
    }

    // File Handling
    const file = req.files.document;
    const uploadDir = path.join(process.cwd(), "uploads", "voter-docs");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    // Generate filename
    const fileName = `voter_admin_${serviceId}_${Date.now()}${path.extname(
      file.name
    )}`;
    const filePath = path.join(uploadDir, fileName);

    // Save File
    await file.mv(filePath);

    // Update specific schema (Replacement logic)
    // If an old file exists, you could fs.unlinkSync(oldPath) here to save space if needed.
    voterCard.adminFilePath = `/uploads/voter-docs/${fileName}`;
    voterCard.adminFileOriginalName = file.name;

    // Auto-update status to completed if admin uploads file? (Optional, but helpful)
    voterCard.status = "completed";
    service.status = "completed"; // Update parent status too

    await voterCard.save();
    await service.save();

    res.status(200).json({
      message: "Document uploaded successfully.",
      filePath: voterCard.adminFilePath,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const downloadVoterPdf = async (req, res) => {
  try {
    const { serviceId } = req.params;

    const service = await Service.findById(serviceId).populate(
      "specificService"
    );
    if (!service || !service.specificService.adminFilePath) {
      return res.status(404).json({ message: "File not found." });
    }

    // Authorization check
    if (req.user.role !== "admin" && service.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const relativePath = service.specificService.adminFilePath;
    const filePath = path.join(process.cwd(), relativePath);

    if (fs.existsSync(filePath)) {
      res.download(
        filePath,
        service.specificService.adminFileOriginalName || "voter_card.pdf"
      );
    } else {
      res.status(404).json({ message: "File missing on server" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------------------------------------
// FOR RTPS SERVICE
// ---------------------------------------------

// --- 1. BULK APPLY FOR RTPS (Retailer) ---
export const applyForRtps = async (req, res) => {
  try {
    const { applications } = req.body; // Expecting Array

    // Validation
    if (
      !applications ||
      !Array.isArray(applications) ||
      applications.length === 0
    ) {
      return res
        .status(400)
        .json({ message: "Please provide a list of applications." });
    }

    // Validate fields
    for (const app of applications) {
      if (!app.district || !app.block || !app.referenceNumber) {
        return res.status(400).json({
          message:
            "District, Block, and Reference Number are required for all items.",
        });
      }
    }

    const RTPS_COST = 370;
    const totalCount = applications.length;
    const totalCost = totalCount * RTPS_COST;

    // Wallet Check
    const user = await User.findById(req.user.id);
    if (user.walletBalance < totalCost) {
      return res.status(402).json({
        message: `Insufficient wallet balance. Total Cost: ₹${totalCost}. Available: ₹${user.walletBalance}.`,
      });
    }

    // Process Applications
    const createdServices = [];

    for (const appData of applications) {
      // A. Create Specific Record
      const specificService = await Rtps.create({
        user: req.user.id,
        district: appData.district,
        block: appData.block,
        referenceNumber: appData.referenceNumber,
        price: RTPS_COST,
        status: "pending",
      });

      // B. Create Generic Service Record
      const service = await Service.create({
        user: req.user.id,
        serviceType: "Rtps",
        specificService: specificService._id,
        status: "pending",
      });

      createdServices.push(service);
    }

    // Deduct Balance & Log
    user.walletBalance -= totalCost;
    await user.save();

    await Transaction.create({
      user: req.user.id,
      amount: totalCost,
      type: "DEBIT",
      category: "SERVICE_PAYMENT",
      description: `Bulk RTPS Application (${totalCount} items)`,
      status: "SUCCESS",
    });

    res.status(201).json({
      message: `Successfully created ${totalCount} RTPS applications.`,
      count: totalCount,
      deductedAmount: totalCost,
      remainingBalance: user.walletBalance,
      services: createdServices,
    });
  } catch (error) {
    console.error("RTPS Apply Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// --- 2. ADMIN ACTION HANDLER (Approve/Reject/Remark) ---
export const handleRtpsAction = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { action, remark } = req.body;
    // action: 'approve', 'reject', 'general_remark'
    // remark: String

    // Find Generic Service
    const service = await Service.findById(serviceId).populate(
      "specificService"
    );
    if (!service || service.serviceType !== "Rtps") {
      return res.status(404).json({ message: "RTPS Service not found." });
    }

    // Find Specific RTPS Record
    const rtpsRecord = await Rtps.findById(service.specificService._id);
    if (!rtpsRecord) {
      return res
        .status(404)
        .json({ message: "Specific RTPS record not found." });
    }

    // --- Logic for Actions ---

    if (action === "approve") {
      rtpsRecord.status = "approved";
      service.status = "approved"; // Sync parent
      if (remark) rtpsRecord.statusRemark = remark; // Optional remark
    } else if (action === "reject") {
      if (!remark) {
        return res
          .status(400)
          .json({ message: "Remark is required for rejection." });
      }
      rtpsRecord.status = "rejected";
      service.status = "rejected"; // Sync parent
      rtpsRecord.statusRemark = remark;
    } else if (action === "general_remark") {
      if (!remark) {
        return res
          .status(400)
          .json({ message: "Remark text cannot be empty." });
      }
      rtpsRecord.generalRemarks.push({
        text: remark,
        adminId: req.user.id,
      });
      // We don't change status here
    } else {
      return res.status(400).json({ message: "Invalid action type." });
    }

    await rtpsRecord.save();
    await service.save();

    res.status(200).json({
      message: "Action performed successfully",
      status: rtpsRecord.status,
      rtpsRecord,
    });
  } catch (error) {
    console.error("RTPS Admin Action Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ---------------------------------------------
// FOR LABOUR CARD
// ---------------------------------------------

// --- 1. BULK APPLY FOR LABOUR CARD (Retailer) ---
export const applyForLabourCard = async (req, res) => {
  try {
    const { applications } = req.body; // Expecting Array

    // Basic Validation
    if (
      !applications ||
      !Array.isArray(applications) ||
      applications.length === 0
    ) {
      return res
        .status(400)
        .json({ message: "Please provide a list of applications." });
    }

    // Validate fields for each item
    for (const app of applications) {
      // District is optional, so we don't check it here
      if (!app.block || !app.name || !app.applicationNumber) {
        return res.status(400).json({
          message:
            "Block, Name, and Application Number are required for all items.",
        });
      }
    }

    const LABOUR_COST = 370;
    const totalCount = applications.length;
    const totalCost = totalCount * LABOUR_COST;

    // Wallet Check
    const user = await User.findById(req.user.id);
    if (user.walletBalance < totalCost) {
      return res.status(402).json({
        message: `Insufficient wallet balance. Total Cost: ₹${totalCost}. Available: ₹${user.walletBalance}.`,
      });
    }

    // Process Applications
    const createdServices = [];

    for (const appData of applications) {
      // A. Create Specific Record
      const specificService = await LabourCard.create({
        user: req.user.id,
        district: appData.district || "", // Handle optional
        block: appData.block,
        name: appData.name,
        applicationNumber: appData.applicationNumber,
        price: LABOUR_COST,
        status: "pending",
      });

      // B. Create Generic Service Record
      const service = await Service.create({
        user: req.user.id,
        serviceType: "LabourCard",
        specificService: specificService._id,
        status: "pending",
      });

      createdServices.push(service);
    }

    // Deduct Balance & Log
    user.walletBalance -= totalCost;
    await user.save();

    await Transaction.create({
      user: req.user.id,
      amount: totalCost,
      type: "DEBIT",
      category: "SERVICE_PAYMENT",
      description: `Bulk Labour Card Application (${totalCount} items)`,
      status: "SUCCESS",
    });

    res.status(201).json({
      message: `Successfully created ${totalCount} Labour Card applications.`,
      count: totalCount,
      deductedAmount: totalCost,
      remainingBalance: user.walletBalance,
      services: createdServices,
    });
  } catch (error) {
    console.error("Labour Card Apply Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// --- 2. ADMIN ACTION HANDLER (Approve/Reject/Remark) ---
export const handleLabourCardAction = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { action, remark } = req.body;

    // Find Generic Service
    const service = await Service.findById(serviceId).populate(
      "specificService"
    );
    if (!service || service.serviceType !== "LabourCard") {
      return res
        .status(404)
        .json({ message: "Labour Card Service not found." });
    }

    // Find Specific Record
    const labourRecord = await LabourCard.findById(service.specificService._id);
    if (!labourRecord) {
      return res
        .status(404)
        .json({ message: "Specific Labour Card record not found." });
    }

    // --- Action Logic ---
    if (action === "approve") {
      labourRecord.status = "approved";
      service.status = "approved";
      if (remark) labourRecord.statusRemark = remark;
    } else if (action === "reject") {
      if (!remark)
        return res
          .status(400)
          .json({ message: "Remark is required for rejection." });
      labourRecord.status = "rejected";
      service.status = "rejected";
      labourRecord.statusRemark = remark;
    } else if (action === "general_remark") {
      if (!remark)
        return res
          .status(400)
          .json({ message: "Remark text cannot be empty." });
      labourRecord.generalRemarks.push({
        text: remark,
        adminId: req.user.id,
      });
    } else {
      return res.status(400).json({ message: "Invalid action type." });
    }

    await labourRecord.save();
    await service.save();

    res.status(200).json({
      message: "Action performed successfully",
      status: labourRecord.status,
      data: labourRecord,
    });
  } catch (error) {
    console.error("Labour Admin Action Error:", error);
    res.status(500).json({ message: error.message });
  }
};
