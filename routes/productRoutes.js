const express = require("express");

const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
} = require("../controllers/productController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

router.get("/", protect, getProducts);

router.post(
  "/",
  protect,
  authorize("admin", "manager"),
  (req, res, next) => {
    req.folder = "products";
    next();
  },
  upload.single("image"),
  createProduct
);

router.get("/low-stock", protect, getLowStockProducts);

router.get("/:id", protect, getProductById);

router.put(
  "/:id",
  protect,
  authorize("admin", "manager"),
  upload.single("image"),
  updateProduct
);

router.delete(
  "/:id",
  protect,
  authorize("admin"),
  deleteProduct
);

module.exports = router;