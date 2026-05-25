const express = require("express");

const {
  createWarehouse,
  getWarehouses,
  getWarehouseById,
  updateWarehouse,
  deleteWarehouse,
} = require("../controllers/warehouseController");

const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getWarehouses);
router.post("/", protect, authorize("admin", "manager"), createWarehouse);
router.get("/:id", protect, getWarehouseById);
router.put("/:id", protect, authorize("admin", "manager"), updateWarehouse);
router.delete("/:id", protect, authorize("admin"), deleteWarehouse);

module.exports = router;