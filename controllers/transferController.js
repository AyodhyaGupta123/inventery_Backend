const asyncHandler = require("express-async-handler");
const StockTransfer = require("../models/StockTransfer");
const Product = require("../models/Product");
const Warehouse = require("../models/Warehouse");

const createTransfer = asyncHandler(async (req, res) => {
  const { product, fromWarehouse, toWarehouse, quantity, status, notes } = req.body;

  if (!product || !fromWarehouse || !toWarehouse || !quantity) {
    res.status(400);
    throw new Error("Product, warehouses and quantity are required");
  }

  if (fromWarehouse === toWarehouse) {
    res.status(400);
    throw new Error("From and To warehouse cannot be same");
  }

  const productDoc = await Product.findById(product);
  const from = await Warehouse.findById(fromWarehouse);
  const to = await Warehouse.findById(toWarehouse);

  if (!productDoc) {
    res.status(404);
    throw new Error("Product not found");
  }

  if (!from || !to) {
    res.status(404);
    throw new Error("Warehouse not found");
  }

  const transfer = await StockTransfer.create({
    transferNumber: `TRF-${Date.now()}`,
    product,
    fromWarehouse,
    toWarehouse,
    quantity: Number(quantity),
    status: status || "pending",
    notes,
    createdBy: req.user?._id,
  });

  res.status(201).json({
    success: true,
    message: "Stock transfer created successfully",
    transfer,
  });
});

const getTransfers = asyncHandler(async (req, res) => {
  const { search, status } = req.query;

  const query = {};

  if (status) query.status = status;

  const transfers = await StockTransfer.find(query)
    .populate("product", "name sku image")
    .populate("fromWarehouse", "name code")
    .populate("toWarehouse", "name code")
    .sort({ createdAt: -1 });

  const filtered = search
    ? transfers.filter((item) => {
        const value = `${item.transferNumber || ""} ${item.product?.name || ""} ${item.product?.sku || ""} ${item.fromWarehouse?.name || ""} ${item.toWarehouse?.name || ""}`;
        return value.toLowerCase().includes(search.toLowerCase());
      })
    : transfers;

  res.status(200).json({
    success: true,
    count: filtered.length,
    transfers: filtered,
  });
});

const getTransferById = asyncHandler(async (req, res) => {
  const transfer = await StockTransfer.findById(req.params.id)
    .populate("product", "name sku image")
    .populate("fromWarehouse", "name code address city")
    .populate("toWarehouse", "name code address city");

  if (!transfer) {
    res.status(404);
    throw new Error("Transfer not found");
  }

  res.status(200).json({
    success: true,
    transfer,
  });
});

const updateTransferStatus = asyncHandler(async (req, res) => {
  const { status, notes } = req.body;

  const transfer = await StockTransfer.findById(req.params.id);

  if (!transfer) {
    res.status(404);
    throw new Error("Transfer not found");
  }

  if (status) transfer.status = status;
  if (notes !== undefined) transfer.notes = notes;

  const updatedTransfer = await transfer.save();

  res.status(200).json({
    success: true,
    message: "Transfer updated successfully",
    transfer: updatedTransfer,
  });
});

const deleteTransfer = asyncHandler(async (req, res) => {
  const transfer = await StockTransfer.findById(req.params.id);

  if (!transfer) {
    res.status(404);
    throw new Error("Transfer not found");
  }

  await transfer.deleteOne();

  res.status(200).json({
    success: true,
    message: "Transfer deleted successfully",
  });
});

module.exports = {
  createTransfer,
  getTransfers,
  getTransferById,
  updateTransferStatus,
  deleteTransfer,
};