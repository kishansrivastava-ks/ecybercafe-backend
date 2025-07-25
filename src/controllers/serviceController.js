import Service from "../models/Service.js";
import PanCard from "../models/PanCard.js";
import Rtps from "../models/Rtps.js";
import JobCard from "../models/JobCard.js";
import ITR from "../models/ITR.js";

import mime from "mime-types";
import path from "path";
import fs from "fs";

/*
export const applyForService = async (req, res) => {
  try {
    // Check if files are uploaded
    if (!req.files || !req.files.photo || !req.files.signature) {
      return res
        .status(400)
        .json({ message: "Photo and signature are required" });
    }

    // Destructure text fields from body
    const {
      fullName,
      dateOfBirth,
      fatherName,
      mobileNumber,
      aadharNumber,
      address,
    } = req.body;

    // Validate required fields
    const requiredFields = [
      fullName,
      dateOfBirth,
      fatherName,
      mobileNumber,
      aadharNumber,
      address,
    ];
    if (requiredFields.some((field) => !field)) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Generate unique filenames
    const photoFileName = `photo_${Date.now()}${path.extname(
      req.files.photo.name
    )}`;
    const signatureFileName = `signature_${Date.now()}${path.extname(
      req.files.signature.name
    )}`;

    // Define upload paths
    const uploadDir = path.join(process.cwd(), "uploads", "pan-card");

    // Create upload directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Save files
    const photoPath = path.join(uploadDir, photoFileName);
    const signaturePath = path.join(uploadDir, signatureFileName);

    req.files.photo.mv(photoPath);
    req.files.signature.mv(signaturePath);

    // Create PanCard entry
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
    });

    // Create Service entry
    const service = await Service.create({
      user: req.user.id,
      serviceType: "PanCard",
      specificService: specificService._id,
    });

    res.status(201).json({
      message: "Pan Card application submitted",
      service,
      panCardDetails: specificService,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

*/

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

    const service = await Service.create({
      user: req.user.id,
      serviceType: "PanCard",
      specificService: specificService._id,
    });
    res.status(201).json({
      message: "PanCard application submitted successfully",
      service,
      specificService,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const applyForRTPS = async (req, res) => {
  try {
    const { block, registrationType, registrationNumber } = req.body;
    if (![block, registrationType, registrationNumber].every(Boolean)) {
      return res
        .status(400)
        .json({ message: "All fields are required for RTPS" });
    }
    const specificService = await Rtps.create({
      user: req.user.id,
      block,
      registrationType,
      registrationNumber,
    });

    const service = await Service.create({
      user: req.user.id,
      serviceType: "RTPS",
      specificService: specificService._id,
    });
    res.status(201).json({
      message: "RTPS application submitted successfully",
      service,
      specificService,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const applyForJobCard = async (req, res) => {
  try {
    if (!req.files || !req.files.aadharFile || !req.files.passbookFile) {
      return res
        .status(400)
        .json({ message: "Aadhar and Passbook files are required" });
    }
    const uploadDir = path.join(process.cwd(), "uploads", "job-card");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const aadharFileName = `aadhar_${Date.now()}${path.extname(
      req.files.aadharFile.name
    )}`;
    const passbookFileName = `passbook_${Date.now()}${path.extname(
      req.files.passbookFile.name
    )}`;
    const aadharFilePath = path.join(uploadDir, aadharFileName);
    const passbookFilePath = path.join(uploadDir, passbookFileName);
    req.files.aadharFile.mv(aadharFilePath);
    req.files.passbookFile.mv(passbookFilePath);

    const specificService = await JobCard.create({
      user: req.user.id,
      name: req.body.name,
      fatherHusbandName: req.body.fatherHusbandName,
      aadharFilePath: `/uploads/job-card/${aadharFileName}`,
      passbookFilePath: `/uploads/job-card/${passbookFileName}`,
    });

    const service = await Service.create({
      user: req.user.id,
      serviceType: "JobCard",
      specificService: specificService._id,
    });
    res.status(201).json({
      message: "JobCard application submitted successfully",
      service,
      specificService,
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

export const applyForITR = async (req, res) => {
  try {
    // --- Improvement: More robust validation ---
    // 1. Validate that files were actually uploaded.
    const { aadharFile, panCardFile, passbookFile } = req.files || {};
    if (!aadharFile || !panCardFile || !passbookFile) {
      return res.status(400).json({
        message: "Aadhar, PAN card, and Passbook files are all required.",
      });
    }

    // 2. Validate that all required text fields from the form body are present.
    const { aadharCardNo, panCardNo, accountNo, ifscCode } = req.body;
    if (!aadharCardNo || !panCardNo || !accountNo || !ifscCode) {
      return res.status(400).json({ message: "All form fields are required." });
    }

    // --- Improvement: Centralized upload path and directory creation ---
    // 3. Handle file saving in a dedicated 'itr' subfolder.
    // This logic could be abstracted into a reusable helper function to reduce code duplication
    // across your different service application controllers.
    const uploadDir = path.join(process.cwd(), "uploads", "itr");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Create unique filenames to prevent overwrites
    const aadharFileName = `aadhar_${req.user.id}_${Date.now()}${path.extname(
      aadharFile.name
    )}`;
    const panCardFileName = `pancard_${req.user.id}_${Date.now()}${path.extname(
      panCardFile.name
    )}`;
    const passbookFileName = `passbook_${
      req.user.id
    }_${Date.now()}${path.extname(passbookFile.name)}`;

    const aadharFilePath = path.join(uploadDir, aadharFileName);
    const panCardFilePath = path.join(uploadDir, panCardFileName);
    const passbookFilePath = path.join(uploadDir, passbookFileName);

    // Use the .mv() method from express-fileupload to move the files
    await aadharFile.mv(aadharFilePath);
    await panCardFile.mv(panCardFilePath);
    await passbookFile.mv(passbookFilePath);

    // 4. Create the specific service document (ITR) in the database.
    const specificService = await ITR.create({
      user: req.user.id,
      aadharCardNo,
      panCardNo,
      accountNo,
      ifscCode,
      aadharFile: `/uploads/itr/${aadharFileName}`,
      panCardFile: `/uploads/itr/${panCardFileName}`,
      passbookFile: `/uploads/itr/${passbookFileName}`,
    });

    // 5. Create the generic Service document that links to the new ITR document.
    const service = await Service.create({
      user: req.user.id,
      serviceType: "ITR", // This must match the model name/key
      specificService: specificService._id,
    });

    // 6. Send a success response back to the client.
    res.status(201).json({
      message: "ITR application submitted successfully.",
      service,
      specificService,
    });
  } catch (error) {
    // --- Improvement: Better error logging ---
    console.error("ITR Application Error:", error);
    res.status(500).json({
      message: "An unexpected error occurred on the server: " + error.message,
    });
  }
};
