const express = require("express");

const {
  createTax,
  getTaxes,
  getTaxById,
  updateTax,
  deleteTax,
} = require("../controllers/taxController");

const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getTaxes);

router.post("/", protect, authorize("admin", "manager"), createTax);

router.get("/:id", protect, getTaxById);

router.put("/:id", protect, authorize("admin", "manager"), updateTax);

router.delete("/:id", protect, authorize("admin"), deleteTax);

module.exports = router;