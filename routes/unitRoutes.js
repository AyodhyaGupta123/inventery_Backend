const express = require("express");

const {
  createUnit,
  getUnits,
  getUnitById,
  updateUnit,
  deleteUnit,
} = require("../controllers/unitController");

const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getUnits);

router.post("/", protect, authorize("admin", "manager"), createUnit);

router.get("/:id", protect, getUnitById);

router.put("/:id", protect, authorize("admin", "manager"), updateUnit);

router.delete("/:id", protect, authorize("admin"), deleteUnit);

module.exports = router;