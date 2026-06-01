const express = require("express");
const router = express.Router();

const {
  createSubCategory,
  getSubCategories,
  getSubCategoryById,
  updateSubCategory,
  deleteSubCategory,
} = require("../controllers/subCategoryController");

const { protect, authorize } = require("../middleware/authMiddleware");

router
  .route("/")
  .get(protect, getSubCategories)
  .post(protect, authorize("admin", "manager"), createSubCategory);

router
  .route("/:id")
  .get(protect, getSubCategoryById)
  .put(protect, authorize("admin", "manager"), updateSubCategory)
  .delete(protect, authorize("admin"), deleteSubCategory);

module.exports = router;