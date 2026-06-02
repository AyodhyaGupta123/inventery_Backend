/**
 * Purchase Order & GRN Service
 * Handles purchase order creation, receipt, and related operations
 */

const mongoose = require("mongoose");
const PurchaseOrder = require("../models/PurchaseOrder");
const GoodsReceived = require("../models/GoodsReceived");
const Product = require("../models/Product");
const stockService = require("./stockService");

const purchaseService = {
  /**
   * Create a new purchase order
   * @param {object} data - Purchase order details
   * @returns {Promise<object>} Created PurchaseOrder
   */
  createPurchaseOrder: async (data) => {
    const {
      supplierId,
      items,
      expectedDate,
      notes,
      warehouseId,
      company,
      createdBy,
    } = data;

    // Generate order number
    const orderNumber = `PO-${Date.now()}`;

    // Calculate totals
    let subtotal = 0;
    let gstAmount = 0;

    // Validate and process items
    const processedItems = [];
    for (const item of items) {
      const product = await Product.findById(item.productId).select(
        "price tax"
      );
      if (!product) {
        throw new Error(`Product ${item.productId} not found`);
      }

      const rate = item.rate || 0;
      const quantity = item.quantity || 0;
      const amount = rate * quantity;

      subtotal += amount;

      processedItems.push({
        product: item.productId,
        quantity,
        rate,
        amount,
      });
    }

    // Calculate GST (assuming 18% default or from product)
    gstAmount = subtotal * 0.18;
    const totalAmount = subtotal + gstAmount;

    const purchaseOrder = await PurchaseOrder.create({
      supplier: supplierId,
      orderNumber,
      purchaseDate: new Date(),
      expectedDate: expectedDate ? new Date(expectedDate) : null,
      items: processedItems,
      notes,
      warehouse: warehouseId,
      subtotal,
      gstAmount,
      totalAmount,
      status: "draft",
      company,
      createdBy,
    });

    return purchaseOrder;
  },

  /**
   * Confirm a purchase order
   * @param {string} poId - Purchase Order ObjectId
   * @returns {Promise<object>} Updated PurchaseOrder
   */
  confirmPurchaseOrder: async (poId, confirmedBy) => {
    const po = await PurchaseOrder.findById(poId);
    if (!po) {
      throw new Error("Purchase order not found");
    }

    if (po.status !== "draft") {
      throw new Error("Only draft POs can be confirmed");
    }

    po.status = "confirmed";
    po.confirmedAt = new Date();
    await po.save();

    return po;
  },

  /**
   * Create GRN (Goods Received Note) and add stock
   * @param {object} data - GRN details
   * @returns {Promise<object>} Created GRN with stock transactions
   */
  receivePurchaseOrder: async (data) => {
    const {
      poId,
      grnNumber,
      receivedQuantities,
      warehouseId,
      notes,
      createdBy,
      company,
    } = data;

    const po = await PurchaseOrder.findById(poId).populate("items.product");
    if (!po) {
      throw new Error("Purchase order not found");
    }

    if (po.status === "received" || po.status === "cancelled") {
      throw new Error(
        "Cannot receive a completed or cancelled purchase order"
      );
    }

    // Create GRN record
    const grn = await GoodsReceived.create({
      grnNumber: grnNumber || `GRN-${Date.now()}`,
      purchaseOrder: poId,
      supplier: po.supplier,
      warehouse: warehouseId || po.warehouse,
      receivedDate: new Date(),
      notes,
      createdBy,
      company,
    });

    // Create stock-in transactions for each item
    const stockTransactions = [];
    let allReceived = true;

    for (let i = 0; i < po.items.length; i++) {
      const item = po.items[i];
      const receivedQty = receivedQuantities[i] || item.quantity;

      if (receivedQty > 0) {
        const transaction = await stockService.addStock({
          productId: item.product._id,
          warehouseId: warehouseId || po.warehouse,
          quantity: receivedQty,
          reason: `Goods Received from PO ${po.orderNumber}`,
          referenceNo: grn.grnNumber,
          referenceDocument: "grn",
          referenceDocumentId: grn._id,
          createdBy,
          company,
        });
        stockTransactions.push(transaction);
      }

      if (receivedQty < item.quantity) {
        allReceived = false;
      }
    }

    // Update PO status
    po.status = allReceived ? "received" : "partially-received";
    po.receivedAt = new Date();
    await po.save();

    return {
      grn,
      stockTransactions,
      purchaseOrder: po,
    };
  },

  /**
   * Calculate purchase order cost
   * @param {array} items - Array of items with quantity and rate
   * @param {number} taxRate - Tax percentage (default 18%)
   * @returns {object} Cost breakdown
   */
  calculatePOCost: (items, taxRate = 18) => {
    let subtotal = 0;

    items.forEach((item) => {
      subtotal += (item.rate || 0) * (item.quantity || 0);
    });

    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;

    return {
      subtotal,
      taxAmount,
      taxRate,
      total,
    };
  },

  /**
   * Get purchase order history
   * @param {object} filters - Filter criteria
   * @returns {Promise<object>} Filtered POs with pagination
   */
  getPOHistory: async (filters) => {
    const {
      supplierId,
      status,
      fromDate,
      toDate,
      limit = 20,
      skip = 0,
    } = filters;

    const query = {};

    if (supplierId) {
      query.supplier = mongoose.Types.ObjectId(supplierId);
    }

    if (status) {
      query.status = status;
    }

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

    const purchaseOrders = await PurchaseOrder.find(query)
      .populate("supplier", "name")
      .populate("items.product", "name sku")
      .populate("createdBy", "name email")
      .sort({ purchaseDate: -1 })
      .skip(skip)
      .limit(limit);

    const total = await PurchaseOrder.countDocuments(query);

    return {
      data: purchaseOrders,
      total,
      count: purchaseOrders.length,
    };
  },

  /**
   * Get supplier purchase statistics
   * @param {string} supplierId - Supplier ObjectId
   * @param {object} options - Query options
   * @returns {Promise<object>} Supplier statistics
   */
  getSupplierStatistics: async (supplierId, options = {}) => {
    const { fromDate, toDate } = options;

    const query = { supplier: mongoose.Types.ObjectId(supplierId) };

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

    const orders = await PurchaseOrder.find(query);

    const stats = {
      totalOrders: orders.length,
      totalAmount: orders.reduce((sum, po) => sum + (po.totalAmount || 0), 0),
      averageOrderValue:
        orders.length > 0
          ? orders.reduce((sum, po) => sum + (po.totalAmount || 0), 0) /
            orders.length
          : 0,
      completedOrders: orders.filter((po) => po.status === "received").length,
      pendingOrders: orders.filter(
        (po) => po.status === "draft" || po.status === "confirmed"
      ).length,
    };

    return stats;
  },

  /**
   * Cancel a purchase order
   * @param {string} poId - Purchase Order ObjectId
   * @returns {Promise<object>} Updated PurchaseOrder
   */
  cancelPurchaseOrder: async (poId, cancelledBy) => {
    const po = await PurchaseOrder.findById(poId);
    if (!po) {
      throw new Error("Purchase order not found");
    }

    if (po.status === "received") {
      throw new Error("Cannot cancel a received purchase order");
    }

    po.status = "cancelled";
    await po.save();

    return po;
  },
};

module.exports = purchaseService;
