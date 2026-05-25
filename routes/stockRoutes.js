const express = require("express");

const {
  createStockIn,
  createStockOut,
  createAdjustment,
  getStockTransactions,
  getLowStockProducts,
} = require("../controllers/stockController");

const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getStockTransactions);

router.post(
  "/in",
  protect,
  authorize("admin", "manager", "staff"),
  createStockIn
);

router.post(
  "/out",
  protect,
  authorize("admin", "manager", "staff"),
  createStockOut
);

router.post(
  "/adjustment",
  protect,
  authorize("admin", "manager"),
  createAdjustment
);

router.get("/low-stock", protect, getLowStockProducts);

module.exports = router;