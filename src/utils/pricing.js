import ServiceConfig from "../models/ServiceConfig.js";

export const DEFAULT_PRICES = {
  PanCard: 125,
  VoterCard: 370,
  Rtps: 370,
  LabourCard: 370,
};

export const SERVICE_LABELS = {
  PanCard: "PAN Card Application",
  VoterCard: "Voter Card PDF",
  Rtps: "RTPS Service",
  LabourCard: "Labour Card Application",
};

/**
 * Get the current active price for a service.
 * If no config exists in DB, it creates one with the default price.
 */
export const getServicePrice = async (serviceType) => {
  try {
    let config = await ServiceConfig.findOne({ serviceType });

    // If configuration doesn't exist, create it with default value
    if (!config) {
      const defaultPrice = DEFAULT_PRICES[serviceType] || 0;
      config = await ServiceConfig.create({
        serviceType,
        price: defaultPrice,
        label: SERVICE_LABELS[serviceType] || serviceType,
      });
    }

    return config.price;
  } catch (error) {
    console.error(`Error fetching price for ${serviceType}:`, error);
    // Fallback to safety default if DB fails
    return DEFAULT_PRICES[serviceType] || 0;
  }
};
