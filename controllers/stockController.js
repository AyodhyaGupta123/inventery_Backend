const asyncHandler = require("express-async-handler");
const Product = require("../models/Product");
const StockTransaction = require("../models/StockTransaction");

const createStockIn = asyncHandler(async (req, res) => {
  const { product, quantity, reason, referenceNo, notes } = req.body;

  const productDoc = await Product.findById(product);

  if (!productDoc) {
    res.status(404);
    throw new Error("Product not found");
  }

  const qty = Number(quantity);
  const previousStock = Number(productDoc.currentStock || 0);
  const newStock = previousStock + qty;

  productDoc.currentStock = newStock;
  await productDoc.save();

  const transaction = await StockTransaction.create({
    type: "stock-in",
    product,
    quantity: qty,
    previousStock,
    newStock,
    reason,
    referenceNo,
    notes,
    createdBy: req.user?._id,
  });

  res.status(201).json({
    success: true,
    message: "Stock added successfully",
    transaction,
  });
});

const createStockOut = asyncHandler(async (req, res) => {
  const { product, quantity, reason, referenceNo, notes } = req.body;

  const productDoc = await Product.findById(product);

  if (!productDoc) {
    res.status(404);
    throw new Error("Product not found");
  }

  const qty = Number(quantity);
  const previousStock = Number(productDoc.currentStock || 0);

  if (previousStock < qty) {
    res.status(400);
    throw new Error("Insufficient stock");
  }

  const newStock = previousStock - qty;

  productDoc.currentStock = newStock;
  await productDoc.save();

  const transaction = await StockTransaction.create({
    type: "stock-out",
    product,
    quantity: qty,
    previousStock,
    newStock,
    reason,
    referenceNo,
    notes,
    createdBy: req.user?._id,
  });

  res.status(201).json({
    success: true,
    message: "Stock removed successfully",
    transaction,
  });
});

const createAdjustment = asyncHandler(async (req, res) => {
  const { product, quantity, reason, referenceNo, notes } = req.body;

  const productDoc = await Product.findById(product);

  if (!productDoc) {
    res.status(404);
    throw new Error("Product not found");
  }

  const previousStock = Number(productDoc.currentStock || 0);
  const newStock = Number(quantity);

  productDoc.currentStock = newStock;
  await productDoc.save();

  const transaction = await StockTransaction.create({
    type: "adjustment",
    product,
    quantity: Math.abs(newStock - previousStock),
    previousStock,
    newStock,
    reason,
    referenceNo,
    notes,
    createdBy: req.user?._id,
  });

  res.status(201).json({
    success: true,
    message: "Stock adjusted successfully",
    transaction,
  });
});

const getStockTransactions = asyncHandler(async (req, res) => {
  const { type, search } = req.query;

  const query = {};

  if (type) query.type = type;

  const transactions = await StockTransaction.find(query)
    .populate("product", "name sku image currentStock")
    .sort({ createdAt: -1 });

  const filtered = search
    ? transactions.filter((item) => {
        const value = `${item.product?.name || ""} ${item.product?.sku || ""} ${
          item.referenceNo || ""
        }`;
        return value.toLowerCase().includes(search.toLowerCase());
      })
    : transactions;

  res.status(200).json({
    success: true,
    count: filtered.length,
    transactions: filtered,
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
  createStockIn,
  createStockOut,
  createAdjustment,
  getStockTransactions,
  getLowStockProducts,
};