import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import Service from "../models/Service.js";
import mongoose from "mongoose";

// Helper to get start of today
const getStartOfDay = () => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
};

/**
 * @desc    Get Top-Level Revenue Stats (Cards)
 * @route   GET /api/admin/stats/overview
 */
export const getOverallStats = async (req, res) => {
  try {
    const startOfDay = getStartOfDay();

    // 1. Total Revenue (All Time) - Sum of all Successful Recharges
    const totalRevenue = await Transaction.aggregate([
      { $match: { type: "CREDIT", category: "RECHARGE", status: "SUCCESS" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    // 2. Today's Revenue
    const todayRevenue = await Transaction.aggregate([
      {
        $match: {
          type: "CREDIT",
          category: "RECHARGE",
          status: "SUCCESS",
          createdAt: { $gte: startOfDay },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    // 3. Total Active Retailers (Users who have made at least one recharge)
    // Optional: Just count total users for simplicity
    const totalRetailers = await User.countDocuments({ role: "user" });

    res.status(200).json({
      totalRevenue: totalRevenue[0]?.total || 0,
      todayRevenue: todayRevenue[0]?.total || 0,
      totalRetailers,
    });
  } catch (error) {
    console.error("Stats Error:", error);
    res.status(500).json({ message: "Error fetching overview stats" });
  }
};

/**
 * @desc    Get List of Retailers with their Revenue Contribution
 * @route   GET /api/admin/stats/retailers
 */
export const getRetailerList = async (req, res) => {
  try {
    const startOfDay = getStartOfDay();

    // We need to join Users with Transactions to sum their recharges
    const retailers = await User.aggregate([
      { $match: { role: "user" } }, // Only Retailers
      {
        $lookup: {
          from: "transactions",
          localField: "_id",
          foreignField: "user",
          as: "txns",
        },
      },
      {
        $project: {
          name: 1,
          email: 1,
          jila: 1,
          prakhand: 1,
          walletBalance: 1,
          // Calculate Total Recharges (All Time)
          totalRecharge: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: "$txns",
                    as: "t",
                    cond: {
                      $and: [
                        { $eq: ["$$t.type", "CREDIT"] },
                        { $eq: ["$$t.category", "RECHARGE"] },
                        { $eq: ["$$t.status", "SUCCESS"] },
                      ],
                    },
                  },
                },
                as: "item",
                in: "$$item.amount",
              },
            },
          },
          // Calculate Today's Recharges
          todayRecharge: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: "$txns",
                    as: "t",
                    cond: {
                      $and: [
                        { $eq: ["$$t.type", "CREDIT"] },
                        { $eq: ["$$t.category", "RECHARGE"] },
                        { $eq: ["$$t.status", "SUCCESS"] },
                        { $gte: ["$$t.createdAt", startOfDay] },
                      ],
                    },
                  },
                },
                as: "item",
                in: "$$item.amount",
              },
            },
          },
        },
      },
      { $sort: { todayRecharge: -1, totalRecharge: -1 } }, // Sort by highest revenue today
    ]);

    res.status(200).json(retailers);
  } catch (error) {
    console.error("Retailer List Error:", error);
    res.status(500).json({ message: "Error fetching retailer list" });
  }
};

/**
 * @desc    Get Deep Dive Details for a Single Retailer
 * @route   GET /api/admin/stats/retailer/:id
 */
export const getRetailerDeepDive = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.params.id);

    // 1. Basic User Info
    const user = await User.findById(userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    // 2. Service Breakdown (Aggregating Services Used)
    // We join 'transactions' with 'services' to group by Service Type
    const serviceStats = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          type: "DEBIT",
          category: "SERVICE_PAYMENT",
          status: "SUCCESS",
        },
      },
      {
        $lookup: {
          from: "services",
          localField: "serviceId",
          foreignField: "_id",
          as: "serviceDetails",
        },
      },
      { $unwind: "$serviceDetails" },
      {
        $group: {
          _id: "$serviceDetails.serviceType", // Group by PanCard, Rtps, etc.
          count: { $sum: 1 }, // Count applications
          totalSpent: { $sum: "$amount" }, // Sum money spent on this service
        },
      },
    ]);

    // 3. Recent Wallet History (Last 20)
    const walletHistory = await Transaction.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({
      user,
      serviceStats,
      walletHistory,
    });
  } catch (error) {
    console.error("Deep Dive Error:", error);
    res.status(500).json({ message: "Error fetching retailer details" });
  }
};
