/**
 * Stock Management Service
 * Handles all stock-related business logic and calculations
 */

const mongoose = require("mongoose");
const StockTransaction = require("../models/StockTransaction");
const StockTransfer = require("../models/StockTransfer");
const Product = require("../models/Product");

const stockService = {
  /**
   * Calculate current stock level for a product in a warehouse
   * @param {string} productId - Product ObjectId
   * @param {string} warehouseId - Warehouse ObjectId (optional)
   * @returns {Promise<number>} Current stock quantity
   */
  calculateStockLevel: async (productId, warehouseId = null) => {
    try {
      const matchStage = {
        product: mongoose.Types.ObjectId(productId),
      };

      if (warehouseId) {
        matchStage.warehouse = mongoose.Types.ObjectId(warehouseId);
      }

      const result = await StockTransaction.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalInStock: {
              $sum: {
                $cond: [{ $eq: ["$type", "stock-in"] }, "$quantity", 0],
              },
            },
            totalOutStock: {
              $sum: {
                $cond: [{ $eq: ["$type", "stock-out"] }, "$quantity", 0],
              },
            },
          },
        },
      ]);

      if (result.length === 0) {
        return 0;
      }

      return result[0].totalInStock - result[0].totalOutStock;
    } catch (error) {
      throw new Error(`Stock calculation failed: ${error.message}`);
    }
  },

  /**
   * Check if sufficient stock is available
   * @param {string} productId - Product ObjectId
   * @param {string} warehouseId - Warehouse ObjectId
   * @param {number} quantity - Required quantity
   * @returns {Promise<boolean>} True if stock available
   */
  checkStockAvailable: async (productId, warehouseId, quantity) => {
    const currentStock = await stockService.calculateStockLevel(
      productId,
      warehouseId
    );
    return currentStock >= quantity;
  },

  /**
   * Deduct stock (create stock-out transaction)
   * @param {object} data - Stock out details
   * @returns {Promise<object>} Created StockTransaction
   */
  deductStock: async (data) => {
    const {
      productId,
      warehouseId,
      quantity,
      reason,
      referenceNo,
      referenceDocument,
      referenceDocumentId,
      createdBy,
      company,
    } = data;

    // Check stock availability
    const isAvailable = await stockService.checkStockAvailable(
      productId,
      warehouseId,
      quantity
    );

    if (!isAvailable) {
      throw new Error("Insufficient stock available");
    }

    // Get current stock before deduction
    const previousStock = await stockService.calculateStockLevel(
      productId,
      warehouseId
    );

    // Create stock-out transaction
    const transaction = await StockTransaction.create({
      type: "stock-out",
      product: productId,
      warehouse: warehouseId,
      quantity,
      previousStock,
      newStock: previousStock - quantity,
      reason: reason || "Stock out",
      referenceNo,
      referenceDocument: referenceDocument || "manual",
      referenceDocumentId,
      createdBy,
      company,
    });

    return transaction;
  },

  /**
   * Add stock (create stock-in transaction)
   * @param {object} data - Stock in details
   * @returns {Promise<object>} Created StockTransaction
   */
  addStock: async (data) => {
    const {
      productId,
      warehouseId,
      quantity,
      reason,
      referenceNo,
      referenceDocument,
      referenceDocumentId,
      createdBy,
      company,
    } = data;

    // Get current stock before addition
    const previousStock = await stockService.calculateStockLevel(
      productId,
      warehouseId
    );

    // Create stock-in transaction
    const transaction = await StockTransaction.create({
      type: "stock-in",
      product: productId,
      warehouse: warehouseId,
      quantity,
      previousStock,
      newStock: previousStock + quantity,
      reason: reason || "Stock in",
      referenceNo,
      referenceDocument: referenceDocument || "manual",
      referenceDocumentId,
      createdBy,
      company,
    });

    return transaction;
  },

  /**
   * Transfer stock between warehouses
   * @param {object} data - Transfer details
   * @returns {Promise<object>} Created StockTransfer
   */
  transferStock: async (data) => {
    const {
      productId,
      fromWarehouseId,
      toWarehouseId,
      quantity,
      notes,
      initiatedBy,
      company,
    } = data;

    // Check stock availability in source warehouse
    const isAvailable = await stockService.checkStockAvailable(
      productId,
      fromWarehouseId,
      quantity
    );

    if (!isAvailable) {
      throw new Error("Insufficient stock in source warehouse");
    }

    // Create transfer record
    const transferNumber = `STR-${Date.now()}`;
    const transfer = await StockTransfer.create({
      transferNumber,
      product: productId,
      fromWarehouse: fromWarehouseId,
      toWarehouse: toWarehouseId,
      quantity,
      notes,
      initiatedBy,
      createdBy: initiatedBy,
      company,
    });

    // Deduct from source warehouse
    await stockService.deductStock({
      productId,
      warehouseId: fromWarehouseId,
      quantity,
      reason: `Transfer to another warehouse`,
      referenceNo: transferNumber,
      referenceDocument: "transfer",
      referenceDocumentId: transfer._id,
      createdBy: initiatedBy,
      company,
    });

    // Add to destination warehouse
    await stockService.addStock({
      productId,
      warehouseId: toWarehouseId,
      quantity,
      reason: `Transfer from another warehouse`,
      referenceNo: transferNumber,
      referenceDocument: "transfer",
      referenceDocumentId: transfer._id,
      createdBy: initiatedBy,
      company,
    });

    return transfer;
  },

  /**
   * Get stock movement history
   * @param {object} filters - Filter criteria
   * @returns {Promise<Array>} Stock transactions
   */
  getStockHistory: async (filters) => {
    const {
      productId,
      warehouseId,
      fromDate,
      toDate,
      type,
      limit = 50,
      skip = 0,
    } = filters;

    const query = {};

    if (productId) {
      query.product = mongoose.Types.ObjectId(productId);
    }

    if (warehouseId) {
      query.warehouse = mongoose.Types.ObjectId(warehouseId);
    }

    if (type) {
      query.type = type;
    }

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

    const transactions = await StockTransaction.find(query)
      .populate("product", "name sku")
      .populate("warehouse", "name")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await StockTransaction.countDocuments(query);

    return {
      data: transactions,
      total,
      count: transactions.length,
    };
  },

  /**
   * Get low stock products in a warehouse
   * @param {string} warehouseId - Warehouse ObjectId
   * @param {object} options - Query options
   * @returns {Promise<Array>} Low stock products
   */
  getLowStockProducts: async (warehouseId, options = {}) => {
    const { limit = 20, skip = 0 } = options;

    // Get all products with stock transactions for this warehouse
    const lowStockProducts = await Product.find({
      status: "active",
    })
      .select("name sku minStockLevel currentStock")
      .sort({ currentStock: 1 })
      .skip(skip)
      .limit(limit);

    // Filter products below minimum stock level
    const filtered = lowStockProducts.filter(
      (product) => product.currentStock <= product.minStockLevel
    );

    return filtered;
  },

  /**
   * Get inventory value for a warehouse
   * @param {string} warehouseId - Warehouse ObjectId (optional)
   * @returns {Promise<number>} Total inventory value
   */
  getInventoryValue: async (warehouseId = null) => {
    try {
      const matchStage = { status: "active" };

      const products = await Product.find(matchStage).lean();

      let totalValue = 0;

      for (const product of products) {
        const stockLevel = await stockService.calculateStockLevel(
          product._id,
          warehouseId
        );
        totalValue += stockLevel * product.purchasePrice;
      }

      return totalValue;
    } catch (error) {
      throw new Error(`Inventory value calculation failed: ${error.message}`);
    }
  },

  /**
   * Adjust stock (manual adjustment)
   * @param {object} data - Adjustment details
   * @returns {Promise<object>} Created StockTransaction
   */
  adjustStock: async (data) => {
    const {
      productId,
      warehouseId,
      adjustmentQuantity,
      reason,
      notes,
      createdBy,
      company,
    } = data;

    const currentStock = await stockService.calculateStockLevel(
      productId,
      warehouseId
    );

    // Create adjustment transaction
    const transaction = await StockTransaction.create({
      type: "adjustment",
      product: productId,
      warehouse: warehouseId,
      quantity: Math.abs(adjustmentQuantity),
      previousStock: currentStock,
      newStock:
        adjustmentQuantity > 0
          ? currentStock + adjustmentQuantity
          : currentStock - Math.abs(adjustmentQuantity),
      reason: reason || "Stock adjustment",
      notes,
      createdBy,
      company,
    });

    return transaction;
  },
};

module.exports = stockService;
