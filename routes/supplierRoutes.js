const express = require("express");

const {
  createSupplier,
  getSuppliers,
  getSupplierById,
} = require("../controllers/supplierController");

const router = express.Router();

router.post("/", createSupplier);

router.get("/", getSuppliers);

router.get("/:id", getSupplierById);

module.exports = router;