const express = require("express");
const router = express.Router();

const {
  getStockTransactionReport,
  getStockTransferReport,
  getOrderReport,
  getPurchaseOrderReport,
  getInventorySnapshot,
} = require("../controllers/reportController");

// Stock transactions report
router.get("/stock-transactions", getStockTransactionReport);

// Stock transfers report
router.get("/stock-transfers", getStockTransferReport);

// Orders report (sales & purchase)
router.get("/orders", getOrderReport);

// Purchase orders report
router.get("/purchase-orders", getPurchaseOrderReport);

// Inventory snapshot by warehouse
router.get("/inventory", getInventorySnapshot);

module.exports = router;