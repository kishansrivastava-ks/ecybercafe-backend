import ServiceConfig from "../models/ServiceConfig.js";

/**
 * Higher Order Function to check if a specific service is active.
 * Usage: router.post(..., checkServiceActive("PanCard"), controller)
 */
export const checkServiceActive = (serviceType) => {
  return async (req, res, next) => {
    try {
      const config = await ServiceConfig.findOne({ serviceType });

      // If config exists and isActive is explicitly false
      if (config && config.isActive === false) {
        return res.status(503).json({
          message:
            config.maintenanceMessage ||
            "Service is currently disabled by admin.",
        });
      }

      // If active (or config doesn't exist yet), proceed
      next();
    } catch (error) {
      console.error("Feature Flag Error:", error);
      res.status(500).json({ message: "Server error checking feature status" });
    }
  };
};
