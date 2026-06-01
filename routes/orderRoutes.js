const express = require("express");

const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
} = require("../controllers/orderController");

const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

/*
  Generic Inventory:
  /api/orders = Issue Orders
*/

router.get("/", protect, getOrders);

router.post(
  "/",
  protect,
  authorize("admin", "manager", "staff"),
  createOrder
);

router.get("/:id", protect, getOrderById);

router.put(
  "/:id/status",
  protect,
  authorize("admin", "manager"),
  updateOrderStatus
);

router.delete(
  "/:id",
  protect,
  authorize("admin"),
  deleteOrder
);

module.exports = router;