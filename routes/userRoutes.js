const express = require("express");
const {
  createStaffUser,
  getCompanyUsers,
  getUserById,
  updateCompanyUser,
  deleteCompanyUser,
} = require("../controllers/userController");

const { protect, admin } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, admin, createStaffUser);
router.get("/", protect, admin, getCompanyUsers);
router.get("/:id", protect, admin, getUserById);
router.put("/:id", protect, admin, updateCompanyUser);
router.delete("/:id", protect, admin, deleteCompanyUser);

module.exports = router;