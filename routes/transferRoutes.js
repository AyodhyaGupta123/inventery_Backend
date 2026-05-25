const express = require("express");

const {
  createTransfer,
  getTransfers,
  getTransferById,
  updateTransferStatus,
  deleteTransfer,
} = require("../controllers/transferController");

const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getTransfers);
router.post("/", protect, authorize("admin", "manager"), createTransfer);
router.get("/:id", protect, getTransferById);
router.put("/:id/status", protect, authorize("admin", "manager"), updateTransferStatus);
router.delete("/:id", protect, authorize("admin"), deleteTransfer);

module.exports = router;