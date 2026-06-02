const asyncHandler = require("express-async-handler");
const responseHandler = require("../utils/responseHandler");
const analyticsService = require("../services/analyticsService");
const common = require("../validators/commonValidator");

/**
 * Get complete dashboard summary
 */
const getAnalyticsDashboard = asyncHandler(async (req, res) => {
  const { fromDate, toDate, warehouseId } = req.query;

  const dashboardData = await analyticsService.getDashboardSummary({
    fromDate,
    toDate,
    warehouseId,
  });

  responseHandler.success(
    res,
    dashboardData,
    "Dashboard summary retrieved successfully"
  );
});

/**
 * Get low stock products
 */
const getLowStockProducts = asyncHandler(async (req, res) => {
  // Validate pagination
  const paginationValidation = common.validatePagination(
    req.query.page,
    req.query.limit
  );
  if (!paginationValidation.isValid) {
    return responseHandler.validationError(res, paginationValidation.errors);
  }

  const { page, limit } = paginationValidation;
  const skip = (page - 1) * limit;
  const { warehouseId, threshold } = req.query;

  const lowStockProducts = await analyticsService.getLowStockProducts(
    warehouseId,
    threshold ? parseInt(threshold) : null
  );

  const paginatedProducts = lowStockProducts.slice(skip, skip + limit);

  responseHandler.paginated(
    res,
    paginatedProducts,
    page,
    limit,
    lowStockProducts.length,
    "Low stock products retrieved successfully"
  );
});

/**
 * Get inventory value
 */
const getInventoryValue = asyncHandler(async (req, res) => {
  const { warehouseId } = req.query;

  const inventoryValue = await analyticsService.getInventoryValue(warehouseId);

  responseHandler.success(
    res,
    inventoryValue,
    "Inventory value calculated successfully"
  );
});

/**
 * Get stock movement analytics
 */
const getMovementAnalytics = asyncHandler(async (req, res) => {
  // Validate date range
  const dateValidation = common.validateDateRange(
    req.query.fromDate,
    req.query.toDate
  );
  if (!dateValidation.isValid) {
    return responseHandler.validationError(res, dateValidation.errors);
  }

  const { fromDate, toDate, warehouseId } = req.query;

  const movementData = await analyticsService.getMovementAnalytics({
    fromDate,
    toDate,
    warehouseId,
  });

  responseHandler.success(
    res,
    movementData,
    "Stock movement analytics retrieved successfully"
  );
});

/**
 * Get sales analytics
 */
const getSalesAnalytics = asyncHandler(async (req, res) => {
  // Validate date range
  const dateValidation = common.validateDateRange(
    req.query.fromDate,
    req.query.toDate
  );
  if (!dateValidation.isValid) {
    return responseHandler.validationError(res, dateValidation.errors);
  }

  const { fromDate, toDate, warehouseId } = req.query;

  const salesData = await analyticsService.getSalesAnalytics({
    fromDate,
    toDate,
    warehouseId,
  });

  responseHandler.success(
    res,
    salesData,
    "Sales analytics retrieved successfully"
  );
});

/**
 * Get supplier analytics
 */
const getSupplierAnalytics = asyncHandler(async (req, res) => {
  // Validate date range
  const dateValidation = common.validateDateRange(
    req.query.fromDate,
    req.query.toDate
  );
  if (!dateValidation.isValid) {
    return responseHandler.validationError(res, dateValidation.errors);
  }

  const { fromDate, toDate } = req.query;

  const supplierData = await analyticsService.getSupplierAnalytics({
    fromDate,
    toDate,
  });

  responseHandler.success(
    res,
    supplierData,
    "Supplier analytics retrieved successfully"
  );
});

/**
 * Get expiring stock
 */
const getExpiringStock = asyncHandler(async (req, res) => {
  // Validate pagination
  const paginationValidation = common.validatePagination(
    req.query.page,
    req.query.limit
  );
  if (!paginationValidation.isValid) {
    return responseHandler.validationError(res, paginationValidation.errors);
  }

  const { page, limit } = paginationValidation;
  const skip = (page - 1) * limit;
  const { daysUntilExpiry } = req.query;

  const expiringProducts = await analyticsService.getExpiringStock({
    daysUntilExpiry: daysUntilExpiry ? parseInt(daysUntilExpiry) : 30,
  });

  const paginatedProducts = expiringProducts.slice(skip, skip + limit);

  responseHandler.paginated(
    res,
    paginatedProducts,
    page,
    limit,
    expiringProducts.length,
    "Expiring stock products retrieved successfully"
  );
});

/**
 * Get stock aging report
 */
const getStockAgingReport = asyncHandler(async (req, res) => {
  const { warehouseId } = req.query;

  const agingReport = await analyticsService.getStockAgingReport({
    warehouseId,
  });

  responseHandler.success(
    res,
    agingReport,
    "Stock aging report generated successfully"
  );
});

module.exports = {
  getAnalyticsDashboard,
  getLowStockProducts,
  getInventoryValue,
  getMovementAnalytics,
  getSalesAnalytics,
  getSupplierAnalytics,
  getExpiringStock,
  getStockAgingReport,
};