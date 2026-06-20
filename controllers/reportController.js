const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const responseHandler = require("../utils/responseHandler");
const commonValidator = require("../validators/commonValidator");
const StockTransaction = require("../models/StockTransaction");
const StockTransfer = require("../models/StockTransfer");
const Order = require("../models/Order");
const PurchaseOrder = require("../models/PurchaseOrder");
const Product = require("../models/Product");
const Report = require("../models/Report");


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
    // Get all stock transactions for the warehouse
    const inventory = await StockTransaction.aggregate([
      { $match: { warehouse: new mongoose.Types.ObjectId(warehouseId) } },
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

/**
 * Get saved custom reports (list)
 * GET /api/reports?page=1&limit=20&type=Revenue&schedule=Weekly&search=xxx
 */
const getReports = asyncHandler(async (req, res) => {
  const paginationValidation = commonValidator.validatePagination(req.query);
  if (!paginationValidation.isValid) {
    return responseHandler.validationError(res, paginationValidation.errors);
  }

  const { page, limit } = paginationValidation;
  const { type, schedule, status, search } = req.query;

  const filters = {};
  if (type && type !== "all") filters.type = type;
  if (schedule && schedule !== "all") filters.schedule = schedule;
  if (status) filters.status = status;
  if (search) filters.name = { $regex: search, $options: "i" };

  try {
    const skip = (page - 1) * limit;
    const total = await Report.countDocuments(filters);

    const reports = await Report.find(filters)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return responseHandler.paginated(
      res,
      { reports },
      page,
      limit,
      total,
      "Reports retrieved successfully",
      200
    );
  } catch (error) {
    return responseHandler.error(res, error.message, 500);
  }
});

/**
 * Get a single saved report
 * GET /api/reports/:id
 */
const getReportById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!commonValidator.isValidId(id)) {
    return responseHandler.error(res, "Invalid report ID", 400);
  }

  try {
    const report = await Report.findById(id);
    if (!report) return responseHandler.error(res, "Report not found", 404);
    return responseHandler.success(res, { report }, "Report retrieved successfully", 200);
  } catch (error) {
    return responseHandler.error(res, error.message, 500);
  }
});

/**
 * Create a saved report
 * POST /api/reports
 */
const createReport = asyncHandler(async (req, res) => {
  const { name, type, schedule } = req.body;

  const errors = {};
  if (!name || !name.trim()) errors.name = "Name is required";
  if (!type) errors.type = "Type is required";
  if (!schedule) errors.schedule = "Schedule is required";
  if (Object.keys(errors).length > 0) {
    return responseHandler.validationError(res, errors);
  }

  try {
    const report = await Report.create({ name: name.trim(), type, schedule });
    return responseHandler.success(res, { report }, "Report created successfully", 201);
  } catch (error) {
    return responseHandler.error(res, error.message, 500);
  }
});

/**
 * Delete a saved report
 * DELETE /api/reports/:id
 */
const deleteReport = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!commonValidator.isValidId(id)) {
    return responseHandler.error(res, "Invalid report ID", 400);
  }

  try {
    const report = await Report.findByIdAndDelete(id);
    if (!report) return responseHandler.error(res, "Report not found", 404);
    return responseHandler.success(res, null, "Report deleted successfully", 200);
  } catch (error) {
    return responseHandler.error(res, error.message, 500);
  }
});

/**
 * Run a saved report
 * POST /api/reports/:id/run
 */
const runReport = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!commonValidator.isValidId(id)) {
    return responseHandler.error(res, "Invalid report ID", 400);
  }

  try {
    const report = await Report.findById(id);
    if (!report) return responseHandler.error(res, "Report not found", 404);

    report.status = "Completed";
    report.lastRun = new Date();
    // TODO: hook actual report generation logic here, set report.rows from real count
    await report.save();

    return responseHandler.success(res, { report }, "Report run successfully", 200);
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
  getReports,
  getReportById,
  createReport,
  deleteReport,
  runReport,
};