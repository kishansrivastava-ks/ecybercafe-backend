import User from "../models/User.js";
import Verification from "../models/Verification.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import sendEmail from "../utils/emailService.js";
import crypto from "crypto";

// Generate JWT Token
const generateToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
};

// Signup Controller
export const signup = async (req, res) => {
  try {
    const { name, email, password, confirmPassword, jila, prakhand } = req.body;

    if (password !== confirmPassword)
      return res.status(400).json({ message: "Passwords do not match" });

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email already exists" });

    const verificationCode = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min expiry

    await Verification.create({ email, code: verificationCode, expiresAt });

    await sendEmail(
      email,
      "Email Verification",
      `Your verification code is: ${verificationCode}. This code will expire in 10 mins`
    );

    res.status(200).json({ message: "Verification code sent to email" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Verify Email Controller
export const verifyEmail = async (req, res) => {
  try {
    const { email, code, name, password, jila, prakhand } = req.body;

    const verificationRecord = await Verification.findOne({ email, code });
    if (!verificationRecord || verificationRecord.expiresAt < new Date()) {
      return res
        .status(400)
        .json({ message: "Invalid or expired verification code" });
    }

    await User.create({
      name,
      email,
      password,
      jila,
      prakhand,
      isVerified: true,
    });
    await Verification.deleteOne({ email });

    res.status(201).json({ message: "Email verified. You can now log in." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login Controller
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    console.log(user);
    if (!user)
      return res.status(400).json({ message: "Invalid email or password" });

    if (!user.isVerified)
      return res.status(403).json({ message: "Email not verified" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res
        .status(400)
        .json({ message: "Invalid email or password. Password dont match" });

    const token = generateToken(user);

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        jila: user.jila,
        prakhand: user.prakhand,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
