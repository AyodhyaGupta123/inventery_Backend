const express = require("express");

const {
  createPurchaseOrder,
  getPurchaseOrders,
  getPurchaseOrderById,
} = require("../controllers/purchaseOrderController");

const router = express.Router();

router.post("/", createPurchaseOrder);

router.get("/", getPurchaseOrders);

router.get("/:id", getPurchaseOrderById);

module.exports = router;