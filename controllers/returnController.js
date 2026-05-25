const asyncHandler = require("express-async-handler");
const Return = require("../models/Return");
const Order = require("../models/Order");

const createReturn = asyncHandler(async (req, res) => {
  const { order, reason, notes } = req.body;

  if (!order || !reason) {
    res.status(400);
    throw new Error("Order and reason are required");
  }

  const existingOrder = await Order.findById(order);

  if (!existingOrder) {
    res.status(404);
    throw new Error("Order not found");
  }

  const returnRequest = await Return.create({
    returnNumber: `RET-${Date.now()}`,
    order,
    reason,
    notes,
    createdBy: req.user?._id,
  });

  res.status(201).json({
    success: true,
    message: "Return request created successfully",
    return: returnRequest,
  });
});

const getReturns = asyncHandler(async (req, res) => {
  const returns = await Return.find()
    .populate("order", "orderNumber customerName grandTotal orderStatus")
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    count: returns.length,
    returns,
  });
});

const getReturnById = asyncHandler(async (req, res) => {
  const returnRequest = await Return.findById(req.params.id).populate("order");

  if (!returnRequest) {
    res.status(404);
    throw new Error("Return not found");
  }

  res.json({
    success: true,
    return: returnRequest,
  });
});

const updateReturnStatus = asyncHandler(async (req, res) => {
  const { status, notes } = req.body;

  const returnRequest = await Return.findById(req.params.id);

  if (!returnRequest) {
    res.status(404);
    throw new Error("Return not found");
  }

  if (status) returnRequest.status = status;
  if (notes !== undefined) returnRequest.notes = notes;

  await returnRequest.save();

  res.json({
    success: true,
    message: "Return status updated successfully",
    return: returnRequest,
  });
});

const deleteReturn = asyncHandler(async (req, res) => {
  const returnRequest = await Return.findById(req.params.id);

  if (!returnRequest) {
    res.status(404);
    throw new Error("Return not found");
  }

  await returnRequest.deleteOne();

  res.json({
    success: true,
    message: "Return deleted successfully",
  });
});

module.exports = {
  createReturn,
  getReturns,
  getReturnById,
  updateReturnStatus,
  deleteReturn,
};