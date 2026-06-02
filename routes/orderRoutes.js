const express = require("express");

const {
  createOrder,
  getOrders,
  getOrderById,
  confirmOrder,
  fulfillOrder,
  completeOrder,
  cancelOrder,
  deleteOrder,
  getWarehouseStats,
} = require("../controllers/orderController");

const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// List all orders with pagination
router.get("/", protect, getOrders);

// Get warehouse statistics
router.get("/stats/warehouse/:warehouseId", protect, getWarehouseStats);

// Create new order
router.post(
  "/",
  protect,
  authorize("admin", "manager", "staff"),
  createOrder
);

// Get order by ID
router.get("/:id", protect, getOrderById);

// Confirm order
router.put(
  "/:id/confirm",
  protect,
  authorize("admin", "manager"),
  confirmOrder
);

// Fulfill/issue order (deduct stock)
router.put(
  "/:id/fulfill",
  protect,
  authorize("admin", "manager"),
  fulfillOrder
);

// Complete order
router.put(
  "/:id/complete",
  protect,
  authorize("admin", "manager"),
  completeOrder
);

// Cancel order
router.put(
  "/:id/cancel",
  protect,
  authorize("admin", "manager"),
  cancelOrder
);

// Delete order (draft only)
router.delete(
  "/:id",
  protect,
  authorize("admin"),
  deleteOrder
);

module.exports = router;