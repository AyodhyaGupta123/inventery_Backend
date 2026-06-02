const express = require("express");
const { protect } = require("../middleware/authMiddleware");

const {
  createSupplier,
  getSuppliers,
  getSupplierById,
  updateSupplier,
} = require("../controllers/supplierController");

const router = express.Router();

// Create Supplier (Protected)
router.post("/", protect, createSupplier);

// Get All Suppliers (Protected)
router.get("/", protect, getSuppliers);

// Get Single Supplier (Protected)
router.get("/:id", protect, getSupplierById);

// Update Supplier (Protected)
router.put("/:id", protect, updateSupplier);

module.exports = router;