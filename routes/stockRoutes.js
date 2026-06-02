const express = require("express");

const {
  createStockIn,
  createStockOut,
  createAdjustment,
  transferStock,
  getStockTransactions,
  getStockLevel,
  getLowStockProducts,
  getStockHistory,
} = require("../controllers/stockController");

const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// Support legacy/simple query: GET /api/stock?type=stock-in
router.get("/", protect, getStockTransactions);

// Get stock transactions with pagination
router.get("/transactions", protect, getStockTransactions);

// Get stock level for a product in a warehouse
router.get("/level/:productId/:warehouseId", protect, getStockLevel);

// Get low stock products
router.get("/low-stock", protect, getLowStockProducts);

// Get stock history for a product
router.get("/history/:productId", protect, getStockHistory);

// Create stock in transaction
router.post(
  "/in",
  protect,
  authorize("admin", "manager", "staff"),
  createStockIn
);

// Create stock out transaction
router.post(
  "/out",
  protect,
  authorize("admin", "manager", "staff"),
  createStockOut
);

// Create stock adjustment
router.post(
  "/adjust",
  protect,
  authorize("admin", "manager"),
  createAdjustment
);

// Transfer stock between warehouses
router.post(
  "/transfer",
  protect,
  authorize("admin", "manager"),
  transferStock
);

module.exports = router;