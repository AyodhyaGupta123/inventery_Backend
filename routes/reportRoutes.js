const express = require("express");
const router = express.Router();

const {
  getStockTransactionReport,
  getStockTransferReport,
  getOrderReport,
  getPurchaseOrderReport,
  getInventorySnapshot,
  getReports,
  getReportById,
  createReport,
  deleteReport,
  runReport,
} = require("../controllers/reportController");

// Saved custom reports (list / create)
router.get("/", getReports);
router.post("/", createReport);

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

// Saved custom reports (single-resource actions) — must stay below literal paths above
router.post("/:id/run", runReport);
router.get("/:id", getReportById);
router.delete("/:id", deleteReport);

module.exports = router;