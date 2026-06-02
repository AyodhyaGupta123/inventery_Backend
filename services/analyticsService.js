/**
 * Analytics Service
 * Handles dashboard analytics and reporting
 */

const mongoose = require("mongoose");
const Product = require("../models/Product");
const StockTransaction = require("../models/StockTransaction");
const Order = require("../models/Order");
const PurchaseOrder = require("../models/PurchaseOrder");
const Supplier = require("../models/Supplier");
const stockService = require("./stockService");

const analyticsService = {
  /**
   * Get low stock products
   * @param {string} warehouseId - Warehouse ObjectId (optional)
   * @param {number} threshold - Stock level threshold
   * @returns {Promise<Array>} Low stock products
   */
  getLowStockProducts: async (warehouseId = null, threshold = null) => {
    const query = { status: "active" };
    const products = await Product.find(query)
      .populate("category", "name")
      .populate("brand", "name")
      .select("name sku minStockLevel currentStock category brand");

    // Filter products below threshold or minimum stock level
    const lowStockProducts = products.filter((product) => {
      const checkThreshold = threshold || product.minStockLevel;
      return product.currentStock <= checkThreshold;
    });

    return lowStockProducts.sort((a, b) => a.currentStock - b.currentStock);
  },

  /**
   * Get inventory value
   * @param {string} warehouseId - Warehouse ObjectId (optional)
   * @returns {Promise<object>} Inventory value breakdown
   */
  getInventoryValue: async (warehouseId = null) => {
    const products = await Product.find({ status: "active" });

    let totalValue = 0;
    const byCategory = {};

    for (const product of products) {
      const stockLevel = await stockService.calculateStockLevel(
        product._id,
        warehouseId
      );
      const productValue = stockLevel * (product.purchasePrice || 0);
      totalValue += productValue;

      let categoryName = "Uncategorized";
      if (product.category) {
        if (product.category.name) categoryName = product.category.name;
        else categoryName = String(product.category);
      }
      if (!byCategory[categoryName]) {
        byCategory[categoryName] = 0;
      }
      byCategory[categoryName] += productValue;
    }

    return {
      totalValue,
      byCategory,
      lastUpdated: new Date(),
    };
  },

  /**
   * Get stock movement analytics
   * @param {object} options - Filter options (dateRange, warehouseId, etc.)
   * @returns {Promise<object>} Movement analytics
   */
  getMovementAnalytics: async (options = {}) => {
    const { fromDate, toDate, warehouseId } = options;

    const query = {};

    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) {
        query.createdAt.$gte = new Date(fromDate);
      }
      if (toDate) {
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endDate;
      }
    }

    if (warehouseId) {
      query.warehouse = mongoose.Types.ObjectId(warehouseId);
    }

    // Get stock in/out transactions
    const inTransactions = await StockTransaction.find({
      ...query,
      type: "stock-in",
    });

    const outTransactions = await StockTransaction.find({
      ...query,
      type: "stock-out",
    });

    const totalInQuantity = inTransactions.reduce(
      (sum, t) => sum + t.quantity,
      0
    );
    const totalOutQuantity = outTransactions.reduce(
      (sum, t) => sum + t.quantity,
      0
    );

    // Group by product
    const byProduct = {};

    for (const t of inTransactions) {
      try {
        const prodRef = t.product || t.productId;
        const productId = prodRef && prodRef._id ? prodRef._id.toString() : String(prodRef);
        if (!byProduct[productId]) byProduct[productId] = { in: 0, out: 0 };
        byProduct[productId].in += t.quantity;
      } catch (err) {
        console.error("analyticsService.getMovementAnalytics - failed to process inTransaction product:", err, {
          transaction: t,
        });
      }
    }

    for (const t of outTransactions) {
      try {
        const prodRef = t.product || t.productId;
        const productId = prodRef && prodRef._id ? prodRef._id.toString() : String(prodRef);
        if (!byProduct[productId]) byProduct[productId] = { in: 0, out: 0 };
        byProduct[productId].out += t.quantity;
      } catch (err) {
        console.error("analyticsService.getMovementAnalytics - failed to process outTransaction product:", err, {
          transaction: t,
        });
      }
    }

    return {
      period: { from: fromDate, to: toDate },
      totalInQuantity,
      totalOutQuantity,
      netMovement: totalInQuantity - totalOutQuantity,
      transactionCount: inTransactions.length + outTransactions.length,
      byProduct,
    };
  },

  /**
   * Get sales analytics
   * @param {object} options - Filter options
   * @returns {Promise<object>} Sales analytics
   */
  getSalesAnalytics: async (options = {}) => {
    const { fromDate, toDate, warehouseId } = options;

    const query = { status: "completed" };

    if (fromDate || toDate) {
      query.issueDate = {};
      if (fromDate) {
        query.issueDate.$gte = new Date(fromDate);
      }
      if (toDate) {
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);
        query.issueDate.$lte = endDate;
      }
    }

    if (warehouseId) {
      query.warehouse = mongoose.Types.ObjectId(warehouseId);
    }

    const orders = await Order.find(query).populate("items.product");

    const stats = {
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
      totalQuantity: orders.reduce((sum, o) => sum + (o.totalQuantity || 0), 0),
      averageOrderValue:
        orders.length > 0
          ? orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0) /
            orders.length
          : 0,
      topProducts: {},
      period: { from: fromDate, to: toDate },
    };

    // Get top selling products
    orders.forEach((order) => {
      order.items.forEach((item) => {
        const prod = item.product || item.productId || {};
        const productId = prod && prod._id ? prod._id.toString() : String(prod);
        if (!stats.topProducts[productId]) {
          stats.topProducts[productId] = {
            name: prod && prod.name ? prod.name : "Unknown",
            quantity: 0,
            revenue: 0,
          };
        }
        stats.topProducts[productId].quantity += item.quantity || 0;
        stats.topProducts[productId].revenue += item.amount || 0;
      });
    });

    // Sort by revenue
    stats.topProducts = Object.values(stats.topProducts).sort(
      (a, b) => b.revenue - a.revenue
    );

    return stats;
  },

  /**
   * Get supplier analytics
   * @param {object} options - Filter options
   * @returns {Promise<object>} Supplier performance analytics
   */
  getSupplierAnalytics: async (options = {}) => {
    const { fromDate, toDate } = options;

    const query = {};

    if (fromDate || toDate) {
      query.purchaseDate = {};
      if (fromDate) {
        query.purchaseDate.$gte = new Date(fromDate);
      }
      if (toDate) {
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);
        query.purchaseDate.$lte = endDate;
      }
    }

    const purchaseOrders = await PurchaseOrder.find(query).populate("supplier");

    const suppliers = await Supplier.find({});

    const stats = {
      suppliers: {},
      period: { from: fromDate, to: toDate },
    };

    suppliers.forEach((supplier) => {
      stats.suppliers[supplier._id.toString()] = {
        name: supplier.name,
        totalOrders: 0,
        totalAmount: 0,
        completedOrders: 0,
        pendingOrders: 0,
        deliveryPerformance: 0,
      };
    });

    purchaseOrders.forEach((po) => {
      const supplierId = po.supplier._id.toString();
      if (stats.suppliers[supplierId]) {
        stats.suppliers[supplierId].totalOrders += 1;
        stats.suppliers[supplierId].totalAmount += po.totalAmount || 0;

        if (po.status === "received") {
          stats.suppliers[supplierId].completedOrders += 1;
        } else if (po.status === "confirmed" || po.status === "draft") {
          stats.suppliers[supplierId].pendingOrders += 1;
        }
      }
    });

    // Calculate delivery performance
    Object.keys(stats.suppliers).forEach((supplierId) => {
      const supplier = stats.suppliers[supplierId];
      if (supplier.totalOrders > 0) {
        supplier.deliveryPerformance = Math.round(
          (supplier.completedOrders / supplier.totalOrders) * 100
        );
      }
    });

    return stats;
  },

  /**
   * Get dashboard summary
   * @param {object} options - Filter options
   * @returns {Promise<object>} Complete dashboard summary
   */
  getDashboardSummary: async (options = {}) => {
    const { warehouseId } = options;

    const [
      lowStockProducts,
      inventoryValue,
      movementAnalytics,
      salesAnalytics,
      supplierAnalytics,
    ] = await Promise.all([
      analyticsService.getLowStockProducts(warehouseId),
      analyticsService.getInventoryValue(warehouseId),
      analyticsService.getMovementAnalytics(options),
      analyticsService.getSalesAnalytics(options),
      analyticsService.getSupplierAnalytics(options),
    ]);

    return {
      lowStockCount: lowStockProducts.length,
      lowStockProducts: lowStockProducts.slice(0, 10), // Top 10
      inventoryValue,
      movementAnalytics,
      salesAnalytics,
      supplierAnalytics,
      generatedAt: new Date(),
    };
  },

  /**
   * Get expiring stock (if applicable)
   * @param {object} options - Filter options
   * @returns {Promise<Array>} Products with expiring stock
   */
  getExpiringStock: async (options = {}) => {
    const { daysUntilExpiry = 30 } = options;

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + daysUntilExpiry);

    const products = await Product.find({
      status: "active",
      enableExpiryTracking: true,
      "batches.expiryDate": { $lte: expiryDate },
    });

    return products;
  },

  /**
   * Get stock aging report
   * @param {object} options - Filter options
   * @returns {Promise<object>} Stock aging analysis
   */
  getStockAgingReport: async (options = {}) => {
    const { warehouseId } = options;

    const days30 = new Date();
    days30.setDate(days30.getDate() - 30);

    const days60 = new Date();
    days60.setDate(days60.getDate() - 60);

    const days90 = new Date();
    days90.setDate(days90.getDate() - 90);

    const query = {};
    if (warehouseId) {
      query.warehouse = mongoose.Types.ObjectId(warehouseId);
    }

    const recent = await StockTransaction.find({
      ...query,
      type: "stock-in",
      createdAt: { $gte: days30 },
    }).countDocuments();

    const thirtyToSixty = await StockTransaction.find({
      ...query,
      type: "stock-in",
      createdAt: { $gte: days60, $lt: days30 },
    }).countDocuments();

    const sixtyToNinety = await StockTransaction.find({
      ...query,
      type: "stock-in",
      createdAt: { $gte: days90, $lt: days60 },
    }).countDocuments();

    const older = await StockTransaction.find({
      ...query,
      type: "stock-in",
      createdAt: { $lt: days90 },
    }).countDocuments();

    return {
      recent,
      thirtyToSixty,
      sixtyToNinety,
      older,
    };
  },
};

module.exports = analyticsService;
