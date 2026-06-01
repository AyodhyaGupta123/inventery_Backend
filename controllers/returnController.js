const asyncHandler = require("express-async-handler");
const Return = require("../models/Return");
const Order = require("../models/Order");
const Product = require("../models/Product");

const generateReturnNumber = () => {
  return `RET-${Date.now()}`;
};

const isStockIncreaseStatus = (status) => {
  return ["received", "completed"].includes(String(status || "").toLowerCase());
};

const createReturn = asyncHandler(async (req, res) => {
  const {
    issueOrder,
    warehouse,
    department,
    returnDate,
    items,
    reason,
    status,
    returnedBy,
    receivedBy,
    notes,
  } = req.body;

  if (!issueOrder) {
    res.status(400);
    throw new Error("Issue order is required");
  }

  if (!warehouse) {
    res.status(400);
    throw new Error("Warehouse is required");
  }

  if (!department) {
    res.status(400);
    throw new Error("Department or client name is required");
  }

  if (!reason) {
    res.status(400);
    throw new Error("Return reason is required");
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    res.status(400);
    throw new Error("Return items are required");
  }

  const existingOrder = await Order.findById(issueOrder);

  if (!existingOrder) {
    res.status(404);
    throw new Error("Issue order not found");
  }

  const finalStatus = status || "requested";
  const returnItems = [];

  for (const item of items) {
    const product = await Product.findById(item.product);

    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }

    const quantity = Number(item.quantity || 0);

    if (quantity <= 0) {
      res.status(400);
      throw new Error("Return quantity must be greater than zero");
    }

    returnItems.push({
      product: product._id,
      productName: product.name,
      sku: product.sku || "",
      unit: product.unit || "pcs",
      quantity,
    });
  }

  const totalQuantity = returnItems.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );

  const stockReturn = await Return.create({
    returnNumber: generateReturnNumber(),
    issueOrder,
    warehouse,
    department,
    returnDate: returnDate || Date.now(),
    items: returnItems,
    totalQuantity,
    reason,
    status: finalStatus,
    returnedBy,
    receivedBy,
    notes,
    createdBy: req.user?._id,
  });

  if (isStockIncreaseStatus(finalStatus)) {
    for (const item of returnItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { currentStock: Number(item.quantity || 0) },
      });
    }
  }

  res.status(201).json({
    success: true,
    message: "Stock return created successfully",
    return: stockReturn,
  });
});

const getReturns = asyncHandler(async (req, res) => {
  const { search, status, warehouse } = req.query;

  const query = {};

  if (status) query.status = status;
  if (warehouse) query.warehouse = warehouse;

  if (search) {
    query.$or = [
      { returnNumber: { $regex: search, $options: "i" } },
      { department: { $regex: search, $options: "i" } },
      { reason: { $regex: search, $options: "i" } },
    ];
  }

  const returns = await Return.find(query)
    .populate("issueOrder", "orderNumber department status")
    .populate("warehouse", "name warehouseName")
    .populate("items.product", "name sku unit currentStock")
    .populate("returnedBy", "name email")
    .populate("receivedBy", "name email")
    .populate("createdBy", "name email")
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    count: returns.length,
    returns,
  });
});

const getReturnById = asyncHandler(async (req, res) => {
  const returnRequest = await Return.findById(req.params.id)
    .populate("issueOrder", "orderNumber department status warehouse")
    .populate("warehouse", "name warehouseName")
    .populate("items.product", "name sku unit currentStock")
    .populate("returnedBy", "name email")
    .populate("receivedBy", "name email")
    .populate("createdBy", "name email");

  if (!returnRequest) {
    res.status(404);
    throw new Error("Stock return not found");
  }

  res.json({
    success: true,
    return: returnRequest,
  });
});

const updateReturnStatus = asyncHandler(async (req, res) => {
  const { status, notes, receivedBy } = req.body;

  const returnRequest = await Return.findById(req.params.id);

  if (!returnRequest) {
    res.status(404);
    throw new Error("Stock return not found");
  }

  const oldStatus = returnRequest.status;
  const newStatus = status || oldStatus;

  const wasNotReceived = !isStockIncreaseStatus(oldStatus);
  const nowReceived = isStockIncreaseStatus(newStatus);

  if (wasNotReceived && nowReceived) {
    for (const item of returnRequest.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { currentStock: Number(item.quantity || 0) },
      });
    }
  }

  if (status) returnRequest.status = status;
  if (notes !== undefined) returnRequest.notes = notes;
  if (receivedBy) returnRequest.receivedBy = receivedBy;

  await returnRequest.save();

  res.json({
    success: true,
    message: "Stock return status updated successfully",
    return: returnRequest,
  });
});

const deleteReturn = asyncHandler(async (req, res) => {
  const returnRequest = await Return.findById(req.params.id);

  if (!returnRequest) {
    res.status(404);
    throw new Error("Stock return not found");
  }

  if (isStockIncreaseStatus(returnRequest.status)) {
    res.status(400);
    throw new Error("Received or completed stock return cannot be deleted");
  }

  await returnRequest.deleteOne();

  res.json({
    success: true,
    message: "Stock return deleted successfully",
  });
});

module.exports = {
  createReturn,
  getReturns,
  getReturnById,
  updateReturnStatus,
  deleteReturn,
};