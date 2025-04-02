import Service from "../models/Service.js";
import PanCard from "../models/PanCard.js";
import Rtps from "../models/Rtps.js";
import JobCard from "../models/JobCard.js";

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
    if (!req.files || !req.files.photo || !req.files.signature) {
      return res
        .status(400)
        .json({ message: "Photo and signature are required for PanCard" });
    }
    const uploadDir = path.join(process.cwd(), "uploads", "pan-card");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const photoFileName = `photo_${Date.now()}${path.extname(
      req.files.photo.name
    )}`;
    const signatureFileName = `signature_${Date.now()}${path.extname(
      req.files.signature.name
    )}`;
    const photoPath = path.join(uploadDir, photoFileName);
    const signaturePath = path.join(uploadDir, signatureFileName);
    req.files.photo.mv(photoPath);
    req.files.signature.mv(signaturePath);

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

// export const applyForService = async (req, res) => {
//   try {
//     const { serviceType } = req.body;
//     console.log(serviceType);

//     if (!serviceType || !["PanCard", "RTPS"].includes(serviceType)) {
//       return res.status(400).json({ message: "Invalid service type" });
//     }

//     let specificServiceData;
//     let specificService;
//     // let uploadDir = "";

//     if (serviceType === "PanCard") {
//       // Validate required fields
//       const {
//         fullName,
//         dateOfBirth,
//         fatherName,
//         mobileNumber,
//         aadharNumber,
//         address,
//       } = req.body;
//       if (
//         ![
//           fullName,
//           dateOfBirth,
//           fatherName,
//           mobileNumber,
//           aadharNumber,
//           address,
//         ].every(Boolean)
//       ) {
//         return res
//           .status(400)
//           .json({ message: "All fields are required for PanCard" });
//       }

//       // Check for uploaded files
//       if (!req.files || !req.files.photo || !req.files.signature) {
//         return res
//           .status(400)
//           .json({ message: "Photo and signature are required for PanCard" });
//       }

//       // Generate unique filenames
//       const photoFileName = `photo_${Date.now()}${path.extname(
//         req.files.photo.name
//       )}`;
//       const signatureFileName = `signature_${Date.now()}${path.extname(
//         req.files.signature.name
//       )}`;

//       // Define upload paths
//       const uploadDir = path.join(process.cwd(), "uploads", "pan-card");
//       if (!fs.existsSync(uploadDir))
//         fs.mkdirSync(uploadDir, { recursive: true });

//       // Move files to the upload directory
//       const photoPath = path.join(uploadDir, photoFileName);
//       const signaturePath = path.join(uploadDir, signatureFileName);
//       req.files.photo.mv(photoPath);
//       req.files.signature.mv(signaturePath);

//       // Create PanCard entry
//       specificServiceData = {
//         user: req.user.id,
//         fullName,
//         dateOfBirth: new Date(dateOfBirth),
//         fatherName,
//         mobileNumber,
//         aadharNumber,
//         address,
//         photoPath: `/uploads/pan-card/${photoFileName}`,
//         signaturePath: `/uploads/pan-card/${signatureFileName}`,
//       };
//       specificService = await PanCard.create(specificServiceData);
//     } else if (serviceType === "RTPS") {
//       const { block, registrationType, registrationNumber } = req.body;
//       if (![block, registrationType, registrationNumber].every(Boolean)) {
//         return res
//           .status(400)
//           .json({ message: "All fields are required for RTPS" });
//       }

//       // Create RTPS entry
//       specificServiceData = {
//         user: req.user.id,
//         block,
//         registrationType,
//         registrationNumber,
//       };
//       specificService = await Rtps.create(specificServiceData);
//     } else if (serviceType === "JobCard") {
//       if (!req.files || !req.files.aadharFile || !req.files.passbookFile) {
//         return res
//           .status(400)
//           .json({ message: "Aadhar and Passbook files are required" });
//       }

//       // Generate unique filenames
//       const aadharFileName = `aadhar_${Date.now()}${path.extname(
//         req.files.aadharFile.name
//       )}`;
//       const passbookFileName = `passbook_${Date.now()}${path.extname(
//         req.files.passbookFile.name
//       )}`;

//       // Define upload path
//       const uploadDir = path.join(process.cwd(), "uploads", "job-card");
//       if (!fs.existsSync(uploadDir))
//         fs.mkdirSync(uploadDir, { recursive: true });

//       // Move files
//       const aadharFilePath = path.join(uploadDir, aadharFileName);
//       const passbookFilePath = path.join(uploadDir, passbookFileName);
//       req.files.aadharFile.mv(aadharFilePath);
//       req.files.passbookFile.mv(passbookFilePath);

//       specificService = await JobCard.create({
//         user: req.user.id,
//         name: req.body.name,
//         fatherHusbandName: req.body.fatherHusbandName,
//         aadharFilePath: `/uploads/job-card/${aadharFileName}`,
//         passbookFilePath: `/uploads/job-card/${passbookFileName}`,
//       });
//     } else {
//       return res.status(400).json({ message: "Invalid service type" });
//     }

//     // Create Service entry
//     const service = await Service.create({
//       user: req.user.id,
//       serviceType,
//       specificService: specificService._id,
//     });

//     res.status(201).json({
//       message: `${serviceType} application submitted successfully`,
//       service,
//       specificService,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: error.message });
//   }
// };

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

// export const applyForService = async (req, res) => {
//   try {
//     const { serviceType, details } = req.body;
//     const userId = req.user.id;
//     console.log(req.user);

//     let specificService;
//     let actualServiceType;

//     if (serviceType === "pan_card") {
//       specificService = await PanCard.create({ ...details, user: userId });
//       actualServiceType = "PanCard";
//     } else {
//       return res.status(400).json({ message: "Invalid service type" });
//     }

//     const service = await Service.create({
//       user: userId,
//       serviceType: actualServiceType,
//       specificService: specificService._id,
//     });

//     res.status(201).json({ message: "Service application submitted", service });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };
