const asyncHandler = require("express-async-handler");
const Product = require("../models/Product");

const createProduct = asyncHandler(async (req, res) => {
  const {
    name,
    sku,
    category,
    brand,
    unit,
    purchasePrice,
    sellingPrice,
    openingStock,
    minStockLevel,
    description,
    status,
  } = req.body;

  if (!name || !sku) {
    res.status(400);
    throw new Error("Product name and SKU are required");
  }

  const exists = await Product.findOne({ sku });

  if (exists) {
    res.status(400);
    throw new Error("Product with this SKU already exists");
  }

const image = req.file
  ? `/uploads/products/${req.file.filename}`
  : "";

  const product = await Product.create({
    name,
    sku,
    category,
    brand,
    unit,
    purchasePrice: Number(purchasePrice || 0),
    sellingPrice: Number(sellingPrice || 0),
    openingStock: Number(openingStock || 0),
    currentStock: Number(openingStock || 0),
    minStockLevel: Number(minStockLevel || 0),
    description,
    status,
    image,
    createdBy: req.user?._id,
  });

  res.status(201).json({
    success: true,
    message: "Product created successfully",
    product,
  });
});

const getProducts = asyncHandler(async (req, res) => {
  const { search, status, category } = req.query;

  const query = {};

  if (status) query.status = status;
  if (category) query.category = category;

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { sku: { $regex: search, $options: "i" } },
      { brand: { $regex: search, $options: "i" } },
    ];
  }

  const products = await Product.find(query).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: products.length,
    products,
  });
});

const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  res.status(200).json({
    success: true,
    product,
  });
});

const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  const updateData = {
    ...req.body,
  };

  if (req.body.purchasePrice !== undefined) {
    updateData.purchasePrice = Number(req.body.purchasePrice || 0);
  }

  if (req.body.sellingPrice !== undefined) {
    updateData.sellingPrice = Number(req.body.sellingPrice || 0);
  }

  if (req.body.openingStock !== undefined) {
    updateData.openingStock = Number(req.body.openingStock || 0);
  }

  if (req.body.currentStock !== undefined) {
    updateData.currentStock = Number(req.body.currentStock || 0);
  }

  if (req.body.minStockLevel !== undefined) {
    updateData.minStockLevel = Number(req.body.minStockLevel || 0);
  }

  if (req.file) {
    updateData.image = `/uploads/products/${req.file.filename}`;
  }

  const updatedProduct = await Product.findByIdAndUpdate(
    req.params.id,
    updateData,
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    success: true,
    message: "Product updated successfully",
    product: updatedProduct,
  });
});

const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  await product.deleteOne();

  res.status(200).json({
    success: true,
    message: "Product deleted successfully",
  });
});

const getLowStockProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({
    $expr: { $lte: ["$currentStock", "$minStockLevel"] },
    status: "active",
  }).sort({ currentStock: 1 });

  res.status(200).json({
    success: true,
    count: products.length,
    products,
  });
});

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
};