const asyncHandler = require("express-async-handler");
const Order = require("../models/Order");
const Product = require("../models/Product");

const generateOrderNumber = () => {
  return `ORD-${Date.now()}`;
};

const createOrder = asyncHandler(async (req, res) => {
  const {
    customerName,
    customerPhone,
    customerEmail,
    items,
    discount,
    tax,
    shippingCharge,
    paymentMethod,
    paymentStatus,
    orderStatus,
    notes,
  } = req.body;

  if (!customerName) {
    res.status(400);
    throw new Error("Customer name is required");
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    res.status(400);
    throw new Error("Order items are required");
  }

  const orderItems = [];

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

    if (Number(product.currentStock || 0) < quantity) {
      res.status(400);
      throw new Error(`Insufficient stock for ${product.name}`);
    }

    const price = Number(item.price || product.sellingPrice || 0);
    const total = quantity * price;

    product.currentStock = Number(product.currentStock || 0) - quantity;
    await product.save();

    orderItems.push({
      product: product._id,
      productName: product.name,
      sku: product.sku,
      quantity,
      price,
      total,
    });
  }

  const subTotal = orderItems.reduce((sum, item) => sum + item.total, 0);
  const finalDiscount = Number(discount || 0);
  const finalTax = Number(tax || 0);
  const finalShipping = Number(shippingCharge || 0);
  const grandTotal = subTotal - finalDiscount + finalTax + finalShipping;

  const order = await Order.create({
    orderNumber: generateOrderNumber(),
    customerName,
    customerPhone,
    customerEmail,
    items: orderItems,
    subTotal,
    discount: finalDiscount,
    tax: finalTax,
    shippingCharge: finalShipping,
    grandTotal,
    paymentMethod,
    paymentStatus,
    orderStatus,
    notes,
    createdBy: req.user?._id,
  });

  res.status(201).json({
    success: true,
    message: "Order created successfully",
    order,
  });
});

const getOrders = asyncHandler(async (req, res) => {
  const { search, orderStatus, paymentStatus } = req.query;

  const query = {};

  if (orderStatus) query.orderStatus = orderStatus;
  if (paymentStatus) query.paymentStatus = paymentStatus;

  if (search) {
    query.$or = [
      { orderNumber: { $regex: search, $options: "i" } },
      { customerName: { $regex: search, $options: "i" } },
      { customerPhone: { $regex: search, $options: "i" } },
    ];
  }

  const orders = await Order.find(query)
    .populate("items.product", "name sku image sellingPrice currentStock")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: orders.length,
    orders,
  });
});

const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate(
    "items.product",
    "name sku image sellingPrice currentStock"
  );

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  res.status(200).json({
    success: true,
    order,
  });
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderStatus, paymentStatus, notes } = req.body;

  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  if (orderStatus) order.orderStatus = orderStatus;
  if (paymentStatus) order.paymentStatus = paymentStatus;
  if (notes !== undefined) order.notes = notes;

  const updatedOrder = await order.save();

  res.status(200).json({
    success: true,
    message: "Order updated successfully",
    order: updatedOrder,
  });
});

const deleteOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  await order.deleteOne();

  res.status(200).json({
    success: true,
    message: "Order deleted successfully",
  });
});

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
};