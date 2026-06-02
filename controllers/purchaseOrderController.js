const asyncHandler = require("express-async-handler");
const responseHandler = require("../utils/responseHandler");
const purchaseOrderValidator = require("../validators/purchaseOrderValidator");
const commonValidator = require("../validators/commonValidator");
const purchaseService = require("../services/purchaseService");
const PurchaseOrder = require("../models/PurchaseOrder");

/**
 * Create a new purchase order
 * POST /api/purchases/orders
 */
const createPurchaseOrder = asyncHandler(async (req, res) => {
  // Validate request
  const validation = purchaseOrderValidator.validateCreate(req.body);
  if (!validation.isValid) {
    return responseHandler.validationError(res, validation.errors, "Validation failed");
  }

  try {
    // Create PO using service
    const purchaseOrder = await purchaseService.createPurchaseOrder({
      ...req.body,
      createdBy: req.user._id,
    });

    // Populate order details
    const populatedPO = await PurchaseOrder.findById(purchaseOrder._id)
      .populate("supplier", "name email phone city address")
      .populate("items.product", "name sku unit")
      .populate("createdBy", "name email");

    return responseHandler.success(
      res,
      populatedPO,
      "Purchase order created successfully",
      201
    );
  } catch (error) {
    return responseHandler.error(res, error.message, 400);
  }
});

/**
 * Get all purchase orders with pagination and filtering
 * GET /api/purchases/orders?page=1&limit=20&status=draft&supplierId=xxx
 */
const getPurchaseOrders = asyncHandler(async (req, res) => {
  // Validate pagination
  const paginationValidation = commonValidator.validatePagination(req.query);
  if (!paginationValidation.isValid) {
    return responseHandler.validationError(res, paginationValidation.errors);
  }

  const { page, limit } = paginationValidation;
  const { status, supplierId, search } = req.query;

  // Build query filters
  const filters = {};
  if (status) filters.status = status;
  if (supplierId) filters.supplierId = supplierId;
  if (search) {
    filters.$or = [
      { orderNumber: { $regex: search, $options: "i" } },
    ];
  }

  try {
    const skip = (page - 1) * limit;

    // Get total count
    const total = await PurchaseOrder.countDocuments(filters);

    // Get paginated POs
    const purchaseOrders = await PurchaseOrder.find(filters)
      .populate("supplier", "name email phone city address")
      .populate("items.product", "name sku unit")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return responseHandler.paginated(
      res,
      purchaseOrders,
      page,
      limit,
      total,
      "Purchase orders retrieved successfully",
      200
    );
  } catch (error) {
    return responseHandler.error(res, error.message, 500);
  }
});

/**
 * Get purchase order by ID
 * GET /api/purchases/orders/:id
 */
const getPurchaseOrderById = asyncHandler(async (req, res) => {
  // Validate ID
  if (!commonValidator.isValidId(req.params.id)) {
    return responseHandler.error(res, "Invalid purchase order ID", 400);
  }

  try {
    const purchaseOrder = await PurchaseOrder.findById(req.params.id)
      .populate("supplier", "name email phone city address")
      .populate("items.product", "name sku unit")
      .populate("createdBy", "name email");

    if (!purchaseOrder) {
      return responseHandler.error(res, "Purchase order not found", 404);
    }

    return responseHandler.success(
      res,
      purchaseOrder,
      "Purchase order retrieved successfully",
      200
    );
  } catch (error) {
    return responseHandler.error(res, error.message, 500);
  }
});

/**
 * Confirm a draft purchase order
 * PUT /api/purchases/orders/:id/confirm
 */
const confirmPurchaseOrder = asyncHandler(async (req, res) => {
  // Validate ID
  if (!commonValidator.isValidId(req.params.id)) {
    return responseHandler.error(res, "Invalid purchase order ID", 400);
  }

  try {
    const purchaseOrder = await purchaseService.confirmPurchaseOrder(
      req.params.id,
      req.user._id
    );

    const populatedPO = await PurchaseOrder.findById(purchaseOrder._id)
      .populate("supplier", "name email phone city address")
      .populate("items.product", "name sku unit")
      .populate("createdBy", "name email");

    return responseHandler.success(
      res,
      populatedPO,
      "Purchase order confirmed successfully",
      200
    );
  } catch (error) {
    return responseHandler.error(res, error.message, 400);
  }
});

/**
 * Receive/create GRN for a purchase order
 * PUT /api/purchases/orders/:id/receive
 */
const receivePurchaseOrder = asyncHandler(async (req, res) => {
  // Validate ID
  if (!commonValidator.isValidId(req.params.id)) {
    return responseHandler.error(res, "Invalid purchase order ID", 400);
  }

  try {
    const purchaseOrder = await purchaseService.receivePurchaseOrder({
      poId: req.params.id,
      warehouseId: req.body.warehouseId,
      receivedBy: req.user._id,
      receivedDate: req.body.receivedDate,
      notes: req.body.notes,
    });

    const populatedPO = await PurchaseOrder.findById(purchaseOrder._id)
      .populate("supplier", "name email phone city address")
      .populate("items.product", "name sku unit")
      .populate("createdBy", "name email");

    return responseHandler.success(
      res,
      populatedPO,
      "Purchase order received and stock added successfully",
      200
    );
  } catch (error) {
    return responseHandler.error(res, error.message, 400);
  }
});

/**
 * Cancel a purchase order
 * PUT /api/purchases/orders/:id/cancel
 */
const cancelPurchaseOrder = asyncHandler(async (req, res) => {
  // Validate ID
  if (!commonValidator.isValidId(req.params.id)) {
    return responseHandler.error(res, "Invalid purchase order ID", 400);
  }

  try {
    const purchaseOrder = await purchaseService.cancelPurchaseOrder(
      req.params.id,
      req.user._id
    );

    const populatedPO = await PurchaseOrder.findById(purchaseOrder._id)
      .populate("supplier", "name email phone city address")
      .populate("items.product", "name sku unit")
      .populate("createdBy", "name email");

    return responseHandler.success(
      res,
      populatedPO,
      "Purchase order cancelled successfully",
      200
    );
  } catch (error) {
    return responseHandler.error(res, error.message, 400);
  }
});

/**
 * Get supplier statistics
 * GET /api/purchases/suppliers/:supplierId/stats
 */
const getSupplierStats = asyncHandler(async (req, res) => {
  // Validate ID
  if (!commonValidator.isValidId(req.params.supplierId)) {
    return responseHandler.error(res, "Invalid supplier ID", 400);
  }

  try {
    const stats = await purchaseService.getSupplierStatistics(
      req.params.supplierId,
      {
        fromDate: req.query.fromDate,
        toDate: req.query.toDate,
      }
    );

    return responseHandler.success(
      res,
      stats,
      "Supplier statistics retrieved successfully",
      200
    );
  } catch (error) {
    return responseHandler.error(res, error.message, 500);
  }
});

module.exports = {
  createPurchaseOrder,
  getPurchaseOrders,
  getPurchaseOrderById,
  confirmPurchaseOrder,
  receivePurchaseOrder,
  cancelPurchaseOrder,
  getSupplierStats,
};