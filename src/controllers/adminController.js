import User from "../models/User.js";
import bcrypt from "bcrypt";
import Service from "../models/Service.js";

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
