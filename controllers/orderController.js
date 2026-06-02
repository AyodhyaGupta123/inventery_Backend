const asyncHandler = require("express-async-handler");
const responseHandler = require("../utils/responseHandler");
const orderValidator = require("../validators/orderValidator");
const commonValidator = require("../validators/commonValidator");
const orderService = require("../services/orderService");
const Order = require("../models/Order");

/**
 * Create a new sales order
 * POST /api/orders
 */
const createOrder = asyncHandler(async (req, res) => {
  // Validate request
  const validation = orderValidator.validateCreate(req.body);
  if (!validation.isValid) {
    return responseHandler.validationError(res, validation.errors, "Validation failed");
  }

  try {
    // Create order using service
    const order = await orderService.createSalesOrder({
      ...req.body,
      createdBy: req.user._id,
    });

    // Populate order details
    const populatedOrder = await Order.findById(order._id)
      .populate("warehouse", "name warehouseName")
      .populate("items.product", "name sku unit currentStock")
      .populate("createdBy", "name email");

    return responseHandler.success(
      res,
      populatedOrder,
      "Sales order created successfully",
      201
    );
  } catch (error) {
    return responseHandler.error(res, error.message, 400);
  }
});

/**
 * Get all orders with pagination and filtering
 * GET /api/orders?page=1&limit=20&status=pending&warehouseId=xxx
 */
const getOrders = asyncHandler(async (req, res) => {
  // Validate pagination
  const paginationValidation = commonValidator.validatePagination(req.query);
  if (!paginationValidation.isValid) {
    return responseHandler.validationError(res, paginationValidation.errors);
  }

  const { page, limit } = paginationValidation;
  const { status, warehouseId, search } = req.query;

  // Build query filters
  const filters = {};
  if (status) filters.status = status;
  if (warehouseId) filters.warehouse = warehouseId;
  if (search) {
    filters.$or = [
      { orderNumber: { $regex: search, $options: "i" } },
      { customerName: { $regex: search, $options: "i" } },
    ];
  }

  try {
    const skip = (page - 1) * limit;

    // Get total count
    const total = await Order.countDocuments(filters);

    // Get paginated orders
    const orders = await Order.find(filters)
      .populate("warehouse", "name warehouseName")
      .populate("items.product", "name sku unit currentStock")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return responseHandler.paginated(
      res,
      orders,
      page,
      limit,
      total,
      "Orders retrieved successfully",
      200
    );
  } catch (error) {
    return responseHandler.error(res, error.message, 500);
  }
});

/**
 * Get order by ID
 * GET /api/orders/:id
 */
const getOrderById = asyncHandler(async (req, res) => {
  // Validate ID
  if (!commonValidator.isValidId(req.params.id)) {
    return responseHandler.error(res, "Invalid order ID", 400);
  }

  try {
    const order = await Order.findById(req.params.id)
      .populate("warehouse", "name warehouseName")
      .populate("items.product", "name sku unit currentStock")
      .populate("createdBy", "name email");

    if (!order) {
      return responseHandler.error(res, "Order not found", 404);
    }

    return responseHandler.success(res, order, "Order retrieved successfully", 200);
  } catch (error) {
    return responseHandler.error(res, error.message, 500);
  }
});

/**
 * Confirm a pending order
 * PUT /api/orders/:id/confirm
 */
const confirmOrder = asyncHandler(async (req, res) => {
  // Validate ID
  if (!commonValidator.isValidId(req.params.id)) {
    return responseHandler.error(res, "Invalid order ID", 400);
  }

  try {
    const order = await orderService.confirmOrder(req.params.id, req.user._id);

    const populatedOrder = await Order.findById(order._id)
      .populate("warehouse", "name warehouseName")
      .populate("items.product", "name sku unit currentStock")
      .populate("createdBy", "name email");

    return responseHandler.success(
      res,
      populatedOrder,
      "Order confirmed successfully",
      200
    );
  } catch (error) {
    return responseHandler.error(res, error.message, 400);
  }
});

/**
 * Fulfill/issue an order (deduct stock)
 * PUT /api/orders/:id/fulfill
 */
const fulfillOrder = asyncHandler(async (req, res) => {
  // Validate ID
  if (!commonValidator.isValidId(req.params.id)) {
    return responseHandler.error(res, "Invalid order ID", 400);
  }

  try {
    const order = await orderService.fulfillOrder({
      orderId: req.params.id,
      issuedBy: req.user._id,
    });

    const populatedOrder = await Order.findById(order._id)
      .populate("warehouse", "name warehouseName")
      .populate("items.product", "name sku unit currentStock")
      .populate("createdBy", "name email");

    return responseHandler.success(
      res,
      populatedOrder,
      "Order fulfilled and stock deducted successfully",
      200
    );
  } catch (error) {
    return responseHandler.error(res, error.message, 400);
  }
});

/**
 * Complete an order
 * PUT /api/orders/:id/complete
 */
const completeOrder = asyncHandler(async (req, res) => {
  // Validate ID
  if (!commonValidator.isValidId(req.params.id)) {
    return responseHandler.error(res, "Invalid order ID", 400);
  }

  try {
    const order = await orderService.completeOrder(req.params.id);

    const populatedOrder = await Order.findById(order._id)
      .populate("warehouse", "name warehouseName")
      .populate("items.product", "name sku unit currentStock")
      .populate("createdBy", "name email");

    return responseHandler.success(
      res,
      populatedOrder,
      "Order completed successfully",
      200
    );
  } catch (error) {
    return responseHandler.error(res, error.message, 400);
  }
});

/**
 * Cancel an order
 * PUT /api/orders/:id/cancel
 */
const cancelOrder = asyncHandler(async (req, res) => {
  // Validate ID
  if (!commonValidator.isValidId(req.params.id)) {
    return responseHandler.error(res, "Invalid order ID", 400);
  }

  try {
    const order = await orderService.cancelOrder(req.params.id);

    const populatedOrder = await Order.findById(order._id)
      .populate("warehouse", "name warehouseName")
      .populate("items.product", "name sku unit currentStock")
      .populate("createdBy", "name email");

    return responseHandler.success(
      res,
      populatedOrder,
      "Order cancelled successfully",
      200
    );
  } catch (error) {
    return responseHandler.error(res, error.message, 400);
  }
});

/**
 * Delete an order
 * DELETE /api/orders/:id
 */
const deleteOrder = asyncHandler(async (req, res) => {
  // Validate ID
  if (!commonValidator.isValidId(req.params.id)) {
    return responseHandler.error(res, "Invalid order ID", 400);
  }

  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return responseHandler.error(res, "Order not found", 404);
    }

    // Only allow deleting draft orders
    if (order.status !== "draft") {
      return responseHandler.error(
        res,
        "Only draft orders can be deleted",
        400
      );
    }

    await Order.findByIdAndDelete(req.params.id);

    return responseHandler.success(res, null, "Order deleted successfully", 200);
  } catch (error) {
    return responseHandler.error(res, error.message, 500);
  }
});

/**
 * Get warehouse order statistics
 * GET /api/orders/stats/warehouse/:warehouseId
 */
const getWarehouseStats = asyncHandler(async (req, res) => {
  // Validate ID
  if (!commonValidator.isValidId(req.params.warehouseId)) {
    return responseHandler.error(res, "Invalid warehouse ID", 400);
  }

  try {
    const stats = await orderService.getWarehouseOrderStats(
      req.params.warehouseId,
      {
        fromDate: req.query.fromDate,
        toDate: req.query.toDate,
      }
    );

    return responseHandler.success(
      res,
      stats,
      "Warehouse statistics retrieved successfully",
      200
    );
  } catch (error) {
    return responseHandler.error(res, error.message, 500);
  }
});

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  confirmOrder,
  fulfillOrder,
  completeOrder,
  cancelOrder,
  deleteOrder,
  getWarehouseStats,
};