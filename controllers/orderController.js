const asyncHandler = require("express-async-handler");
const Order = require("../models/Order");
const Product = require("../models/Product");

const generateOrderNumber = () => {
  return `IO-${Date.now()}`;
};

const isIssuedStatus = (status) => {
  return ["issued", "completed"].includes(String(status || "").toLowerCase());
};

const createOrder = asyncHandler(async (req, res) => {
  const {
    department,
    warehouse,
    issueDate,
    items,
    purpose,
    status,
    requestedBy,
    issuedBy,
    notes,
  } = req.body;

  if (!department) {
    res.status(400);
    throw new Error("Department or client name is required");
  }

  if (!warehouse) {
    res.status(400);
    throw new Error("Warehouse is required");
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    res.status(400);
    throw new Error("Issue order items are required");
  }

  const finalStatus = status || "pending";
  const issueItems = [];

  for (const item of items) {
    const product = await Product.findById(item.product);

    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }

    const quantity = Number(item.quantity || 0);

    if (quantity <= 0) {
      res.status(400);
      throw new Error("Quantity must be greater than zero");
    }

    if (isIssuedStatus(finalStatus)) {
      if (Number(product.currentStock || 0) < quantity) {
        res.status(400);
        throw new Error(`Insufficient stock for ${product.name}`);
      }

      product.currentStock = Number(product.currentStock || 0) - quantity;
      await product.save();
    }

    issueItems.push({
      product: product._id,
      productName: product.name,
      sku: product.sku || "",
      unit: product.unit || "pcs",
      quantity,
    });
  }

  const totalQuantity = issueItems.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );

  const order = await Order.create({
    orderNumber: generateOrderNumber(),
    department,
    warehouse,
    issueDate: issueDate || Date.now(),
    items: issueItems,
    totalQuantity,
    purpose,
    status: finalStatus,
    requestedBy,
    issuedBy,
    notes,
    createdBy: req.user?._id,
  });

  res.status(201).json({
    success: true,
    message: "Issue order created successfully",
    order,
  });
});

const getOrders = asyncHandler(async (req, res) => {
  const { search, status, warehouse } = req.query;

  const query = {};

  if (status) query.status = status;
  if (warehouse) query.warehouse = warehouse;

  if (search) {
    query.$or = [
      { orderNumber: { $regex: search, $options: "i" } },
      { department: { $regex: search, $options: "i" } },
      { purpose: { $regex: search, $options: "i" } },
    ];
  }

  const orders = await Order.find(query)
    .populate("warehouse", "name warehouseName")
    .populate("items.product", "name sku unit currentStock")
    .populate("requestedBy", "name email")
    .populate("issuedBy", "name email")
    .populate("createdBy", "name email")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: orders.length,
    orders,
  });
});

const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("warehouse", "name warehouseName")
    .populate("items.product", "name sku unit currentStock")
    .populate("requestedBy", "name email")
    .populate("issuedBy", "name email")
    .populate("createdBy", "name email");

  if (!order) {
    res.status(404);
    throw new Error("Issue order not found");
  }

  res.status(200).json({
    success: true,
    order,
  });
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, notes, issuedBy } = req.body;

  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error("Issue order not found");
  }

  const oldStatus = order.status;
  const newStatus = status || oldStatus;

  const wasNotIssued = !isIssuedStatus(oldStatus);
  const nowIssued = isIssuedStatus(newStatus);

  if (wasNotIssued && nowIssued) {
    for (const item of order.items) {
      const product = await Product.findById(item.product);

      if (!product) {
        res.status(404);
        throw new Error("Product not found");
      }

      if (Number(product.currentStock || 0) < Number(item.quantity || 0)) {
        res.status(400);
        throw new Error(`Insufficient stock for ${product.name}`);
      }

      product.currentStock =
        Number(product.currentStock || 0) - Number(item.quantity || 0);

      await product.save();
    }
  }

  if (status) order.status = status;
  if (notes !== undefined) order.notes = notes;
  if (issuedBy) order.issuedBy = issuedBy;

  const updatedOrder = await order.save();

  res.status(200).json({
    success: true,
    message: "Issue order updated successfully",
    order: updatedOrder,
  });
});

const deleteOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error("Issue order not found");
  }

  if (isIssuedStatus(order.status)) {
    res.status(400);
    throw new Error("Issued or completed order cannot be deleted");
  }

  await order.deleteOne();

  res.status(200).json({
    success: true,
    message: "Issue order deleted successfully",
  });
});

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
};