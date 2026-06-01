const express = require("express");

const {
  createReturn,
  getReturns,
  getReturnById,
  updateReturnStatus,
  deleteReturn,
} = require("../controllers/returnController");

const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

/*
  Generic Inventory:
  /api/returns = Stock Returns
*/

router.get("/", protect, getReturns);

router.post(
  "/",
  protect,
  authorize("admin", "manager", "staff"),
  createReturn
);

router.get("/:id", protect, getReturnById);

router.put(
  "/:id/status",
  protect,
  authorize("admin", "manager"),
  updateReturnStatus
);

router.delete(
  "/:id",
  protect,
  authorize("admin"),
  deleteReturn
);

module.exports = router;