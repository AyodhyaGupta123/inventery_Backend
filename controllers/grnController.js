const asyncHandler = require("express-async-handler");
const responseHandler = require("../utils/responseHandler");
const commonValidator = require("../validators/commonValidator");
const purchaseService = require("../services/purchaseService");
const GoodsReceived = require("../models/GoodsReceived");
const PurchaseOrder = require("../models/PurchaseOrder");

/**
 * Create a Goods Received Note (GRN) for a purchase order
 * POST /api/grn
 */
const createGRN = asyncHandler(async (req, res) => {
  const { purchaseOrderId, warehouseId, receivedDate, notes } = req.body;

  // Validate required fields
  if (!purchaseOrderId || !commonValidator.isValidId(purchaseOrderId)) {
    return responseHandler.error(res, "Invalid purchase order ID", 400);
  }

  if (!warehouseId || !commonValidator.isValidId(warehouseId)) {
    return responseHandler.error(res, "Invalid warehouse ID", 400);
  }

  try {
    // Receive purchase order using service
    const purchaseOrder = await purchaseService.receivePurchaseOrder({
      poId: purchaseOrderId,
      warehouseId,
      receivedBy: req.user._id,
      receivedDate: receivedDate || new Date(),
      notes,
    });

    // Fetch created GRN
    const grn = await GoodsReceived.findOne({ purchaseOrder: purchaseOrderId })
      .populate("purchaseOrder")
      .populate("supplier", "name email phone")
      .populate("items.product", "name sku unit")
      .populate("receivedBy", "name email")
      .sort({ createdAt: -1 })
      .limit(1);

    return responseHandler.success(
      res,
      grn,
      "GRN created and stock updated successfully",
      201
    );
  } catch (error) {
    return responseHandler.error(res, error.message, 400);
  }
});

/**
 * Get all GRNs with pagination and filtering
 * GET /api/grn?page=1&limit=20&status=received&purchaseOrderId=xxx
 */
const getGRNs = asyncHandler(async (req, res) => {
  // Validate pagination
  const paginationValidation = commonValidator.validatePagination(req.query);
  if (!paginationValidation.isValid) {
    return responseHandler.validationError(res, paginationValidation.errors);
  }

  const { page, limit } = paginationValidation;
  const { status, purchaseOrderId, supplierId, search } = req.query;

  // Build query filters
  const filters = {};
  if (status) filters.status = status;
  if (purchaseOrderId) filters.purchaseOrder = purchaseOrderId;
  if (supplierId) filters.supplierId = supplierId;
  if (search) {
    filters.$or = [
      { grnNumber: { $regex: search, $options: "i" } },
    ];
  }

  try {
    const skip = (page - 1) * limit;

    // Get total count
    const total = await GoodsReceived.countDocuments(filters);

    // Get paginated GRNs
    const grns = await GoodsReceived.find(filters)
      .populate("purchaseOrder")
      .populate("supplier", "name email phone")
      .populate("items.product", "name sku unit")
      .populate("receivedBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return responseHandler.paginated(
      res,
      grns,
      page,
      limit,
      total,
      "GRNs retrieved successfully",
      200
    );
  } catch (error) {
    return responseHandler.error(res, error.message, 500);
  }
});

/**
 * Get GRN by ID
 * GET /api/grn/:id
 */
const getGRNById = asyncHandler(async (req, res) => {
  // Validate ID
  if (!commonValidator.isValidId(req.params.id)) {
    return responseHandler.error(res, "Invalid GRN ID", 400);
  }

  try {
    const grn = await GoodsReceived.findById(req.params.id)
      .populate("purchaseOrder")
      .populate("supplier", "name email phone")
      .populate("items.product", "name sku unit")
      .populate("receivedBy", "name email");

    if (!grn) {
      return responseHandler.error(res, "GRN not found", 404);
    }

    return responseHandler.success(res, grn, "GRN retrieved successfully", 200);
  } catch (error) {
    return responseHandler.error(res, error.message, 500);
  }
});

/**
 * Get GRNs for a specific purchase order
 * GET /api/grn/purchase-order/:purchaseOrderId
 */
const getGRNsByPurchaseOrder = asyncHandler(async (req, res) => {
  // Validate ID
  if (!commonValidator.isValidId(req.params.purchaseOrderId)) {
    return responseHandler.error(res, "Invalid purchase order ID", 400);
  }

  try {
    const grns = await GoodsReceived.find({ purchaseOrder: req.params.purchaseOrderId })
      .populate("purchaseOrder")
      .populate("supplier", "name email phone")
      .populate("items.product", "name sku unit")
      .populate("receivedBy", "name email")
      .sort({ createdAt: -1 });

    return responseHandler.success(
      res,
      grns,
      "GRNs retrieved successfully",
      200
    );
  } catch (error) {
    return responseHandler.error(res, error.message, 500);
  }
});

/**
 * Update GRN status
 * PUT /api/grn/:id/status
 */
const updateGRNStatus = asyncHandler(async (req, res) => {
  const { status, notes } = req.body;

  if (!status) {
    return responseHandler.error(res, "Status is required", 400);
  }

  if (!commonValidator.isValidId(req.params.id)) {
    return responseHandler.error(res, "Invalid GRN ID", 400);
  }

  try {
    const grn = await GoodsReceived.findByIdAndUpdate(
      req.params.id,
      { status, notes },
      { new: true }
    )
      .populate("purchaseOrder")
      .populate("supplier", "name email phone")
      .populate("items.product", "name sku unit")
      .populate("receivedBy", "name email");

    if (!grn) {
      return responseHandler.error(res, "GRN not found", 404);
    }

    return responseHandler.success(
      res,
      grn,
      "GRN status updated successfully",
      200
    );
  } catch (error) {
    return responseHandler.error(res, error.message, 500);
  }
});

module.exports = {
  createGRN,
  getGRNs,
  getGRNById,
  getGRNsByPurchaseOrder,
  updateGRNStatus,
};