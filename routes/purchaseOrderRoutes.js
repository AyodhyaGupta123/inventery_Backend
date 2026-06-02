const express = require("express");

const {
  createPurchaseOrder,
  getPurchaseOrders,
  getPurchaseOrderById,
  confirmPurchaseOrder,
  receivePurchaseOrder,
  cancelPurchaseOrder,
  getSupplierStats,
} = require("../controllers/purchaseOrderController");

const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// List all purchase orders with pagination
router.get("/", protect, getPurchaseOrders);

// Get supplier statistics
router.get("/suppliers/:supplierId/stats", protect, getSupplierStats);

// Create new purchase order
router.post(
  "/",
  protect,
  authorize("admin", "manager", "staff"),
  createPurchaseOrder
);

// Get purchase order by ID
router.get("/:id", protect, getPurchaseOrderById);

// Confirm purchase order
router.put(
  "/:id/confirm",
  protect,
  authorize("admin", "manager"),
  confirmPurchaseOrder
);

// Receive purchase order (create GRN)
router.put(
  "/:id/receive",
  protect,
  authorize("admin", "manager", "staff"),
  receivePurchaseOrder
);

// Cancel purchase order
router.put(
  "/:id/cancel",
  protect,
  authorize("admin", "manager"),
  cancelPurchaseOrder
);

module.exports = router;