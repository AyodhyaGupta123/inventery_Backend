const express = require("express");

const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
} = require("../controllers/productController");

const { protect, authorize } = require("../middleware/authMiddleware");

const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

const setProductFolder = (req, res, next) => {
  req.folder = "products";
  next();
};

const productUpload = upload.fields([
  { name: "thumbnail", maxCount: 1 },
  { name: "images", maxCount: 5 },
]);

router.get("/", protect, getProducts);

router.post(
  "/",
  protect,
  authorize("admin", "manager"),
  setProductFolder,
  productUpload,
  createProduct
);

router.get("/low-stock", protect, getLowStockProducts);

router.get("/:id", protect, getProductById);

router.put(
  "/:id",
  protect,
  authorize("admin", "manager"),
  setProductFolder,
  productUpload,
  updateProduct
);

router.delete("/:id", protect, authorize("admin"), deleteProduct);

module.exports = router;