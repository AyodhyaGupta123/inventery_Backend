const asyncHandler = require("express-async-handler");
const responseHandler = require("../utils/responseHandler");
const commonValidator = require("../validators/commonValidator");
const stockService = require("../services/stockService");
const StockTransaction = require("../models/StockTransaction");

const PRODUCT_POPULATE_FIELDS =
  "name sku unit primaryUnit image thumbnail images";

const createStockIn = asyncHandler(async (req, res) => {
  const { productId, warehouseId, quantity, reason, referenceNo, notes } =
    req.body;

  if (!productId || !commonValidator.isValidId(productId)) {
    return responseHandler.error(res, "Invalid product ID", 400);
  }

  if (!warehouseId || !commonValidator.isValidId(warehouseId)) {
    return responseHandler.error(res, "Invalid warehouse ID", 400);
  }

  if (!quantity || !commonValidator.isPositiveNumber(quantity)) {
    return responseHandler.error(res, "Quantity must be a positive number", 400);
  }

  try {
    const transaction = await stockService.addStock({
      productId,
      warehouseId,
      quantity: Number(quantity),
      reason,
      referenceNo,
      notes,
      createdBy: req.user._id,
    });

    const populatedTransaction = await StockTransaction.findById(
      transaction._id
    )
      .populate("product", PRODUCT_POPULATE_FIELDS)
      .populate("warehouse", "name");

    return responseHandler.success(
      res,
      populatedTransaction,
      "Stock added successfully",
      201
    );
  } catch (error) {
    return responseHandler.error(res, error.message, 400);
  }
});

const createStockOut = asyncHandler(async (req, res) => {
  const { productId, warehouseId, quantity, reason, referenceNo, notes } =
    req.body;

  if (!productId || !commonValidator.isValidId(productId)) {
    return responseHandler.error(res, "Invalid product ID", 400);
  }

  if (!warehouseId || !commonValidator.isValidId(warehouseId)) {
    return responseHandler.error(res, "Invalid warehouse ID", 400);
  }

  if (!quantity || !commonValidator.isPositiveNumber(quantity)) {
    return responseHandler.error(res, "Quantity must be a positive number", 400);
  }

  try {
    const isAvailable = await stockService.checkStockAvailable(
      productId,
      warehouseId,
      Number(quantity)
    );

    if (!isAvailable) {
      return responseHandler.error(res, "Insufficient stock", 400);
    }

    const transaction = await stockService.deductStock({
      productId,
      warehouseId,
      quantity: Number(quantity),
      reason,
      referenceNo,
      notes,
      createdBy: req.user._id,
    });

    const populatedTransaction = await StockTransaction.findById(
      transaction._id
    )
      .populate("product", PRODUCT_POPULATE_FIELDS)
      .populate("warehouse", "name");

    return responseHandler.success(
      res,
      populatedTransaction,
      "Stock deducted successfully",
      201
    );
  } catch (error) {
    return responseHandler.error(res, error.message, 400);
  }
});

const createAdjustment = asyncHandler(async (req, res) => {
  const { productId, warehouseId, newStock, reason, referenceNo, notes } =
    req.body;

  if (!productId || !commonValidator.isValidId(productId)) {
    return responseHandler.error(res, "Invalid product ID", 400);
  }

  if (!warehouseId || !commonValidator.isValidId(warehouseId)) {
    return responseHandler.error(res, "Invalid warehouse ID", 400);
  }

  if (newStock === undefined || !commonValidator.isNonNegativeNumber(newStock)) {
    return responseHandler.error(
      res,
      "New stock must be a non-negative number",
      400
    );
  }

  try {
    const transaction = await stockService.adjustStock({
      productId,
      warehouseId,
      newStock: Number(newStock),
      reason,
      referenceNo,
      notes,
      createdBy: req.user._id,
    });

    const populatedTransaction = await StockTransaction.findById(
      transaction._id
    )
      .populate("product", PRODUCT_POPULATE_FIELDS)
      .populate("warehouse", "name");

    return responseHandler.success(
      res,
      populatedTransaction,
      "Stock adjusted successfully",
      201
    );
  } catch (error) {
    return responseHandler.error(res, error.message, 400);
  }
});

const transferStock = asyncHandler(async (req, res) => {
  const { productId, fromWarehouseId, toWarehouseId, quantity, notes } =
    req.body;

  if (!productId || !commonValidator.isValidId(productId)) {
    return responseHandler.error(res, "Invalid product ID", 400);
  }

  if (!fromWarehouseId || !commonValidator.isValidId(fromWarehouseId)) {
    return responseHandler.error(res, "Invalid source warehouse ID", 400);
  }

  if (!toWarehouseId || !commonValidator.isValidId(toWarehouseId)) {
    return responseHandler.error(res, "Invalid destination warehouse ID", 400);
  }

  if (!quantity || !commonValidator.isPositiveNumber(quantity)) {
    return responseHandler.error(res, "Quantity must be a positive number", 400);
  }

  if (fromWarehouseId === toWarehouseId) {
    return responseHandler.error(
      res,
      "Source and destination warehouses must be different",
      400
    );
  }

  try {
    const transfer = await stockService.transferStock({
      productId,
      fromWarehouseId,
      toWarehouseId,
      quantity: Number(quantity),
      notes,
      initiatedBy: req.user._id,
    });

    return responseHandler.success(
      res,
      transfer,
      "Stock transferred successfully",
      201
    );
  } catch (error) {
    return responseHandler.error(res, error.message, 400);
  }
});

const getStockTransactions = asyncHandler(async (req, res) => {
  const paginationValidation = commonValidator.validatePagination(req.query);

  if (!paginationValidation.isValid) {
    return responseHandler.validationError(res, paginationValidation.errors);
  }

  const { page, limit } = paginationValidation;
  const { type, productId, warehouseId, fromDate, toDate } = req.query;

  const filters = {};

  if (type) filters.type = type;
  if (productId) filters.product = productId;
  if (warehouseId) filters.warehouse = warehouseId;

  if (fromDate || toDate) {
    const dateFilter = commonValidator.validateDateRange(fromDate, toDate);

    if (!dateFilter.isValid) {
      return responseHandler.validationError(res, dateFilter.errors);
    }

    if (dateFilter.fromDate || dateFilter.toDate) {
      filters.createdAt = {};

      if (dateFilter.fromDate) filters.createdAt.$gte = dateFilter.fromDate;
      if (dateFilter.toDate) filters.createdAt.$lte = dateFilter.toDate;
    }
  }

  try {
    const skip = (page - 1) * limit;

    const total = await StockTransaction.countDocuments(filters);

    const transactions = await StockTransaction.find(filters)
      .populate("product", PRODUCT_POPULATE_FIELDS)
      .populate("warehouse", "name")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return responseHandler.paginated(
      res,
      transactions,
      page,
      limit,
      total,
      "Stock transactions retrieved successfully",
      200
    );
  } catch (error) {
    return responseHandler.error(res, error.message, 500);
  }
});

const getStockLevel = asyncHandler(async (req, res) => {
  if (!commonValidator.isValidId(req.params.productId)) {
    return responseHandler.error(res, "Invalid product ID", 400);
  }

  if (!commonValidator.isValidId(req.params.warehouseId)) {
    return responseHandler.error(res, "Invalid warehouse ID", 400);
  }

  try {
    const stockLevel = await stockService.calculateStockLevel(
      req.params.productId,
      req.params.warehouseId
    );

    return responseHandler.success(
      res,
      {
        productId: req.params.productId,
        warehouseId: req.params.warehouseId,
        stockLevel,
      },
      "Stock level retrieved successfully",
      200
    );
  } catch (error) {
    return responseHandler.error(res, error.message, 500);
  }
});

const getLowStockProducts = asyncHandler(async (req, res) => {
  const { warehouseId, threshold = 10 } = req.query;

  try {
    if (warehouseId && !commonValidator.isValidId(warehouseId)) {
      return responseHandler.error(res, "Invalid warehouse ID", 400);
    }

    const lowStockProducts = await stockService.getLowStockProducts(
      warehouseId || null,
      {
        threshold: Number(threshold),
      }
    );

    return responseHandler.success(
      res,
      lowStockProducts,
      "Low stock products retrieved successfully",
      200
    );
  } catch (error) {
    console.error("Low Stock Error:", error);

    return responseHandler.error(
      res,
      error.message || "Failed to retrieve low stock products",
      500
    );
  }
});

const getStockHistory = asyncHandler(async (req, res) => {
  if (!commonValidator.isValidId(req.params.productId)) {
    return responseHandler.error(res, "Invalid product ID", 400);
  }

  const { warehouseId, fromDate, toDate } = req.query;

  try {
    const history = await stockService.getStockHistory({
      productId: req.params.productId,
      warehouseId,
      fromDate,
      toDate,
    });

    return responseHandler.success(
      res,
      history,
      "Stock history retrieved successfully",
      200
    );
  } catch (error) {
    return responseHandler.error(res, error.message, 500);
  }
});

module.exports = {
  createStockIn,
  createStockOut,
  createAdjustment,
  transferStock,
  getStockTransactions,
  getStockLevel,
  getLowStockProducts,
  getStockHistory,
};