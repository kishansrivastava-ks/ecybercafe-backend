import User from "../models/User.js";

/**
 * @desc    Update user profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
export const updateUserProfile = async (req, res) => {
  try {
    // req.user is populated by the protect middleware
    console.log("Authenticated user:", req.user);
    const user = await User.findById(req.user.id);

    if (user) {
      // Update fields if they exist in the request body
      // If not provided, keep the existing value
      user.name = req.body.name || user.name;
      user.jila = req.body.jila || user.jila;
      user.prakhand = req.body.prakhand || user.prakhand;

      // Note: We deliberately do NOT update email, role, or password here

      const updatedUser = await user.save();

      res.status(200).json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        jila: updatedUser.jila,
        prakhand: updatedUser.prakhand,
        role: updatedUser.role,
        isVerified: updatedUser.isVerified,
        message: "Profile updated successfully",
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Server error while updating profile" });
  }
};
