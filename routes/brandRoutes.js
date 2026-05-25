const express = require("express");

const {
  createBrand,
  getBrands,
  getBrandById,
  updateBrand,
  deleteBrand,
} = require("../controllers/brandController");

const { protect, authorize } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

const setBrandUploadFolder = (req, res, next) => {
  req.folder = "brands";
  next();
};

router.get("/", protect, getBrands);



router.post(
  "/",
  protect,
  authorize("admin", "manager"),
  setBrandUploadFolder,
  upload.single("image"),
  createBrand,
);

router.get("/:id", protect, getBrandById);

router.put(
  "/:id",
  protect,
  authorize("admin", "manager"),
  setBrandUploadFolder,
  upload.single("image"),
  updateBrand,
);

router.delete("/:id", protect, authorize("admin"), deleteBrand);

module.exports = router;
