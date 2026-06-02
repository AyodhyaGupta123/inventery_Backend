const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  getAnalyticsDashboard,
  getLowStockProducts,
  getInventoryValue,
  getMovementAnalytics,
  getSalesAnalytics,
  getSupplierAnalytics,
  getExpiringStock,
  getStockAgingReport,
} = require("../controllers/analyticsController");

const router = express.Router();

// Dashboard summary
router.get("/", protect, getAnalyticsDashboard);

// Low stock products
router.get("/low-stock", protect, getLowStockProducts);

// Inventory value
router.get("/inventory-value", protect, getInventoryValue);

// Stock movement analytics
router.get("/movement", protect, getMovementAnalytics);

// Sales analytics
router.get("/sales", protect, getSalesAnalytics);

// Supplier analytics
router.get("/suppliers", protect, getSupplierAnalytics);

// Expiring stock
router.get("/expiring-stock", protect, getExpiringStock);

// Stock aging report
router.get("/stock-aging", protect, getStockAgingReport);

module.exports = router;