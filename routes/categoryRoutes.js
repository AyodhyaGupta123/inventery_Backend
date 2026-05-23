const express = require("express");
const {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");

const { protect, authorize } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");


const router = express.Router();

router.get("/", protect, getCategories);

router.post(
  "/",
  protect,
  authorize("admin", "manager"),
  (req, res, next) => {
    req.folder = "categories";
    next();
  },
  upload.single("image"),
  createCategory
);

router.get("/:id", protect, getCategoryById);

router.put(
  "/:id",
  protect,
  authorize("admin", "manager"),
  (req, res, next) => {
    req.folder = "categories";
    next();
  },
  upload.single("image"),
  updateCategory
);

router.delete("/:id", protect, authorize("admin"), deleteCategory);

module.exports = router;