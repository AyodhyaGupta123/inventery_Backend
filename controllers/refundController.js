const asyncHandler = require("express-async-handler");
const Refund = require("../models/Refund");
const Order = require("../models/Order");

const createRefund = asyncHandler(async (req, res) => {
  const { order, amount, method, reason, notes } = req.body;

  if (!order || amount === undefined) {
    res.status(400);
    throw new Error("Order and amount are required");
  }

  const existingOrder = await Order.findById(order);

  if (!existingOrder) {
    res.status(404);
    throw new Error("Order not found");
  }

  const refund = await Refund.create({
    refundNumber: `REF-${Date.now()}`,
    order,
    amount: Number(amount || 0),
    method,
    reason,
    notes,
    createdBy: req.user?._id,
  });

  res.status(201).json({
    success: true,
    message: "Refund created successfully",
    refund,
  });
});

const getRefunds = asyncHandler(async (req, res) => {
  const refunds = await Refund.find()
    .populate("order", "orderNumber customerName grandTotal paymentStatus")
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    count: refunds.length,
    refunds,
  });
});

const getRefundById = asyncHandler(async (req, res) => {
  const refund = await Refund.findById(req.params.id).populate("order");

  if (!refund) {
    res.status(404);
    throw new Error("Refund not found");
  }

  res.json({
    success: true,
    refund,
  });
});

const updateRefundStatus = asyncHandler(async (req, res) => {
  const { status, notes } = req.body;

  const refund = await Refund.findById(req.params.id);

  if (!refund) {
    res.status(404);
    throw new Error("Refund not found");
  }

  if (status) refund.status = status;
  if (notes !== undefined) refund.notes = notes;

  await refund.save();

  res.json({
    success: true,
    message: "Refund status updated successfully",
    refund,
  });
});

const deleteRefund = asyncHandler(async (req, res) => {
  const refund = await Refund.findById(req.params.id);

  if (!refund) {
    res.status(404);
    throw new Error("Refund not found");
  }

  await refund.deleteOne();

  res.json({
    success: true,
    message: "Refund deleted successfully",
  });
});

module.exports = {
  createRefund,
  getRefunds,
  getRefundById,
  updateRefundStatus,
  deleteRefund,
};