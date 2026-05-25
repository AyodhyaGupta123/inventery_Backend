const express = require("express");
const {
  createRefund,
  getRefunds,
  getRefundById,
  updateRefundStatus,
  deleteRefund,
} = require("../controllers/refundController");

const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getRefunds);
router.post("/", protect, authorize("admin", "manager"), createRefund);
router.get("/:id", protect, getRefundById);
router.put("/:id/status", protect, authorize("admin", "manager"), updateRefundStatus);
router.delete("/:id", protect, authorize("admin"), deleteRefund);

module.exports = router;