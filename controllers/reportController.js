const asyncHandler = require("express-async-handler");
const responseHandler = require("../utils/responseHandler");
const commonValidator = require("../validators/commonValidator");
const StockTransaction = require("../models/StockTransaction");
const StockTransfer = require("../models/StockTransfer");
const Order = require("../models/Order");
const PurchaseOrder = require("../models/PurchaseOrder");
const Product = require("../models/Product");

/**
 * Get stock transaction reports with advanced filtering
 * GET /api/reports/stock-transactions?page=1&limit=20&type=stock-in&fromDate=&toDate=
 */
const getStockTransactionReport = asyncHandler(async (req, res) => {
  // Validate pagination
  const paginationValidation = commonValidator.validatePagination(req.query);
  if (!paginationValidation.isValid) {
    return responseHandler.validationError(res, paginationValidation.errors);
  }

  const { page, limit } = paginationValidation;
  const { type, productId, warehouseId, fromDate, toDate, search } = req.query;

  // Build filters
  const filters = {};
  if (type) filters.type = type;
  if (productId) filters.product = productId;
  if (warehouseId) filters.warehouse = warehouseId;

  // Date range filtering
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
      .populate("product", "name sku unit")
      .populate("warehouse", "name")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Calculate summary
    const summary = await StockTransaction.aggregate([
      { $match: filters },
      {
        $group: {
          _id: "$type",
          totalQuantity: { $sum: "$quantity" },
          count: { $sum: 1 },
        },
      },
    ]);

    return responseHandler.paginated(
      res,
      { transactions, summary },
      page,
      limit,
      total,
      "Stock transaction report retrieved successfully",
      200
    );
  } catch (error) {
    return responseHandler.error(res, error.message, 500);
  }
});

/**
 * Get stock transfer reports
 * GET /api/reports/stock-transfers?page=1&limit=20&status=completed&fromDate=&toDate=
 */
const getStockTransferReport = asyncHandler(async (req, res) => {
  // Validate pagination
  const paginationValidation = commonValidator.validatePagination(req.query);
  if (!paginationValidation.isValid) {
    return responseHandler.validationError(res, paginationValidation.errors);
  }

  const { page, limit } = paginationValidation;
  const { status, productId, fromWarehouseId, toWarehouseId, fromDate, toDate } = req.query;

  // Build filters
  const filters = {};
  if (status) filters.status = status;
  if (productId) filters.product = productId;
  if (fromWarehouseId) filters.fromWarehouse = fromWarehouseId;
  if (toWarehouseId) filters.toWarehouse = toWarehouseId;

  // Date range filtering
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
    const total = await StockTransfer.countDocuments(filters);

    const transfers = await StockTransfer.find(filters)
      .populate("product", "name sku unit")
      .populate("fromWarehouse", "name")
      .populate("toWarehouse", "name")
      .populate("initiatedBy", "name email")
      .populate("receivedBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Calculate summary
    const summary = await StockTransfer.aggregate([
      { $match: filters },
      {
        $group: {
          _id: "$status",
          totalQuantity: { $sum: "$quantity" },
          count: { $sum: 1 },
        },
      },
    ]);

    return responseHandler.paginated(
      res,
      { transfers, summary },
      page,
      limit,
      total,
      "Stock transfer report retrieved successfully",
      200
    );
  } catch (error) {
    return responseHandler.error(res, error.message, 500);
  }
});

/**
 * Get order reports (both sales and purchase orders)
 * GET /api/reports/orders?page=1&limit=20&orderType=sales-order&status=completed&fromDate=&toDate=
 */
const getOrderReport = asyncHandler(async (req, res) => {
  // Validate pagination
  const paginationValidation = commonValidator.validatePagination(req.query);
  if (!paginationValidation.isValid) {
    return responseHandler.validationError(res, paginationValidation.errors);
  }

  const { page, limit } = paginationValidation;
  const { orderType = "sales-order", status, warehouseId, fromDate, toDate } = req.query;

  // Build filters
  const filters = {};
  if (orderType) filters.orderType = orderType;
  if (status) filters.status = status;
  if (warehouseId) filters.warehouse = warehouseId;

  // Date range filtering
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
    const total = await Order.countDocuments(filters);

    const orders = await Order.find(filters)
      .populate("warehouse", "name")
      .populate("items.product", "name sku unit")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Calculate summary
    const summary = await Order.aggregate([
      { $match: filters },
      {
        $group: {
          _id: "$status",
          totalOrders: { $sum: 1 },
          totalQuantity: {
            $sum: {
              $sum: "$items.quantity",
            },
          },
          totalAmount: { $sum: "$totalAmount" },
        },
      },
    ]);

    return responseHandler.paginated(
      res,
      { orders, summary },
      page,
      limit,
      total,
      "Order report retrieved successfully",
      200
    );
  } catch (error) {
    return responseHandler.error(res, error.message, 500);
  }
});

/**
 * Get purchase order reports
 * GET /api/reports/purchase-orders?page=1&limit=20&status=received&supplierId=xxx&fromDate=&toDate=
 */
const getPurchaseOrderReport = asyncHandler(async (req, res) => {
  // Validate pagination
  const paginationValidation = commonValidator.validatePagination(req.query);
  if (!paginationValidation.isValid) {
    return responseHandler.validationError(res, paginationValidation.errors);
  }

  const { page, limit } = paginationValidation;
  const { status, supplierId, warehouseId, fromDate, toDate } = req.query;

  // Build filters
  const filters = {};
  if (status) filters.status = status;
  if (supplierId) filters.supplier = supplierId;
  if (warehouseId) filters.warehouse = warehouseId;

  // Date range filtering
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
    const total = await PurchaseOrder.countDocuments(filters);

    const purchaseOrders = await PurchaseOrder.find(filters)
      .populate("supplier", "name email phone")
      .populate("items.product", "name sku unit")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Calculate summary
    const summary = await PurchaseOrder.aggregate([
      { $match: filters },
      {
        $group: {
          _id: "$status",
          totalOrders: { $sum: 1 },
          totalQuantity: {
            $sum: {
              $sum: "$items.quantity",
            },
          },
          totalAmount: { $sum: "$totalAmount" },
        },
      },
    ]);

    return responseHandler.paginated(
      res,
      { purchaseOrders, summary },
      page,
      limit,
      total,
      "Purchase order report retrieved successfully",
      200
    );
  } catch (error) {
    return responseHandler.error(res, error.message, 500);
  }
});

/**
 * Get current inventory snapshot by warehouse
 * GET /api/reports/inventory?warehouseId=xxx
 */
const getInventorySnapshot = asyncHandler(async (req, res) => {
  const { warehouseId } = req.query;

  if (!warehouseId || !commonValidator.isValidId(warehouseId)) {
    return responseHandler.error(res, "Invalid warehouse ID", 400);
  }

  try {
    const mongoose = require("mongoose");

    // Get all stock transactions for the warehouse
    const inventory = await StockTransaction.aggregate([
      { $match: { warehouse: mongoose.Types.ObjectId(warehouseId) } },
      {
        $group: {
          _id: "$product",
          currentStock: { $last: "$newStock" },
          totalIn: {
            $sum: { $cond: [{ $eq: ["$type", "stock-in"] }, "$quantity", 0] },
          },
          totalOut: {
            $sum: { $cond: [{ $eq: ["$type", "stock-out"] }, "$quantity", 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Populate product details
    const populatedInventory = await Promise.all(
      inventory.map(async (item) => {
        const product = await Product.findById(item._id).select("name sku unit category");
        return {
          productId: item._id,
          product,
          currentStock: item.currentStock,
          totalInbound: item.totalIn,
          totalOutbound: item.totalOut,
          netMovement: item.totalIn - item.totalOut,
        };
      })
    );

    const summary = {
      totalProducts: populatedInventory.length,
      totalQuantity: populatedInventory.reduce((sum, item) => sum + item.currentStock, 0),
      totalValue: 0,
    };

    return responseHandler.success(
      res,
      { inventory: populatedInventory, summary },
      "Inventory snapshot retrieved successfully",
      200
    );
  } catch (error) {
    return responseHandler.error(res, error.message, 500);
  }
});

module.exports = {
  getStockTransactionReport,
  getStockTransferReport,
  getOrderReport,
  getPurchaseOrderReport,
  getInventorySnapshot,
};