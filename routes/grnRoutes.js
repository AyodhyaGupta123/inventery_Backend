const express = require("express");
const { protect, authorize } = require("../middleware/authMiddleware");

const {
  createGRN,
  getGRNs,
  getGRNById,
  getGRNsByPurchaseOrder,
  updateGRNStatus,
} = require("../controllers/grnController");

const router = express.Router();

// List all GRNs with pagination
router.get("/", protect, getGRNs);

// Get GRNs for a specific purchase order
router.get("/purchase-order/:purchaseOrderId", protect, getGRNsByPurchaseOrder);

// Create new GRN
router.post(
  "/",
  protect,
  authorize("admin", "manager", "staff"),
  createGRN
);

// Get GRN by ID
router.get("/:id", protect, getGRNById);

// Update GRN status
router.put(
  "/:id/status",
  protect,
  authorize("admin", "manager"),
  updateGRNStatus
);

module.exports = router;