import User from "../models/User.js";
import bcrypt from "bcrypt";
import Service from "../models/Service.js";
import ServiceConfig from "../models/ServiceConfig.js";
import { DEFAULT_PRICES, SERVICE_LABELS } from "../utils/pricing.js";

/**
 * Create an admin user manually
 */
export const createAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if the email is already registered
    const existingAdmin = await User.findOne({ email });
    if (existingAdmin)
      return res.status(400).json({ message: "Admin already exists" });

    // Hash password before saving
    // const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin user with role "admin"
    const admin = await User.create({
      name,
      email,
      password,
      role: "admin",
      isVerified: true, // Admins should be verified by default
    });

    res
      .status(201)
      .json({ message: "Admin account created successfully", admin });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Service Status (Admin Only)
export const updateServiceStatus = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ["pending", "in_progress", "completed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    // Update status
    service.status = status;
    await service.save();

    res.status(200).json({ message: "Service status updated", service });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add Comment to Service (Admin Only)
export const addServiceComment = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { comment } = req.body;

    if (!comment) {
      return res.status(400).json({ message: "Comment cannot be empty" });
    }

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    // Add comment
    service.comments.push({ text: comment });
    await service.save();

    res.status(200).json({ message: "Comment added successfully", service });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get All Users (Admin Only)
export const getAllUsers = async (req, res) => {
  try {
    // Fetch all users but exclude the 'password' field
    const users = await User.find({
      role: "user",
    })
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Error retrieving users" });
  }
};

/**
 * @desc    Get all service prices
 * @route   GET /api/admin/config/prices
 */
export const getAllServicePrices = async (req, res) => {
  try {
    // 1. List of all services we expect to exist
    const knownServices = Object.keys(DEFAULT_PRICES);

    // 2. Loop through each and ensure it exists in DB
    // We use Promise.all to run these checks in parallel for speed
    await Promise.all(
      knownServices.map(async (type) => {
        const exists = await ServiceConfig.exists({ serviceType: type });

        if (!exists) {
          await ServiceConfig.create({
            serviceType: type,
            price: DEFAULT_PRICES[type],
            label: SERVICE_LABELS[type],
          });
        }
      })
    );

    // 3. Now fetch the complete list from DB
    const configs = await ServiceConfig.find({}).sort({ createdAt: 1 });

    res.status(200).json(configs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Update a specific service price
 * @route   PUT /api/admin/config/prices
 */
export const updateServicePrice = async (req, res) => {
  try {
    const { serviceType, newPrice } = req.body;

    if (!serviceType || newPrice === undefined) {
      return res
        .status(400)
        .json({ message: "Service Type and New Price are required" });
    }

    const config = await ServiceConfig.findOneAndUpdate(
      { serviceType },
      { price: newPrice },
      { new: true, upsert: true } // Create if doesn't exist
    );

    res.status(200).json({ message: "Price updated successfully", config });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ----------------------------------------------------------
// Feature Flag Management
// ----------------------------------------------------------

/**
 * @desc    Toggle Service Status (Active/Inactive)
 * @route   PATCH /api/admin/config/toggle
 */
export const toggleServiceStatus = async (req, res) => {
  try {
    const { serviceType, isActive } = req.body;

    if (!serviceType || typeof isActive !== "boolean") {
      return res
        .status(400)
        .json({ message: "Service Type and isActive status are required" });
    }

    const config = await ServiceConfig.findOneAndUpdate(
      { serviceType },
      { isActive },
      { new: true, upsert: true } // Create if missing
    );

    res.status(200).json({
      message: `Service ${isActive ? "enabled" : "disabled"} successfully`,
      config,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
