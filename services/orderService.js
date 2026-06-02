/**
 * Sales Order Service
 * Handles order creation, fulfillment, and related operations
 */

const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");
const stockService = require("./stockService");

const orderService = {
  /**
   * Create a new sales order
   * @param {object} data - Order details
   * @returns {Promise<object>} Created Order
   */
  createSalesOrder: async (data) => {
    const {
      warehouseId,
      items,
      customerName,
      customerPhone,
      customerEmail,
      deliveryAddress,
      discount,
      notes,
      company,
      createdBy,
    } = data;

    // Generate order number
    const orderNumber = `SO-${Date.now()}`;

    // Validate stock availability for all items
    for (const item of items) {
      const isAvailable = await stockService.checkStockAvailable(
        item.productId,
        warehouseId,
        item.quantity
      );

      if (!isAvailable) {
        throw new Error(
          `Insufficient stock for product ${item.productId}`
        );
      }
    }

    // Calculate order total
    let subtotal = 0;
    let totalQuantity = 0;

    const processedItems = [];
    for (const item of items) {
      const product = await Product.findById(item.productId).select(
        "name sku sellingPrice"
      );
      if (!product) {
        throw new Error(`Product ${item.productId} not found`);
      }

      const unitPrice = item.unitPrice || product.sellingPrice;
      const amount = unitPrice * item.quantity;

      subtotal += amount;
      totalQuantity += item.quantity;

      processedItems.push({
        product: item.productId,
        productName: product.name,
        sku: product.sku,
        unit: item.unit || "pcs",
        quantity: item.quantity,
        unitPrice,
        amount,
      });
    }

    // Apply discount if provided
    const discountAmount = (subtotal * (discount || 0)) / 100;
    const totalAmount = subtotal - discountAmount;

    const order = await Order.create({
      orderNumber,
      orderType: "sales-order",
      department: customerName || "Direct Customer",
      warehouse: warehouseId,
      items: processedItems,
      totalQuantity,
      totalAmount,
      customerName,
      customerPhone,
      customerEmail,
      deliveryAddress,
      discount: discount || 0,
      notes,
      status: "pending",
      company,
      createdBy,
      issueDate: new Date(),
    });

    return order;
  },

  /**
   * Confirm an order
   * @param {string} orderId - Order ObjectId
   * @returns {Promise<object>} Updated Order
   */
  confirmOrder: async (orderId, confirmedBy) => {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    if (order.status !== "pending") {
      throw new Error("Only pending orders can be confirmed");
    }

    order.status = "confirmed";
    await order.save();

    return order;
  },

  /**
   * Fulfill/Issue an order (deduct stock)
   * @param {object} data - Fulfillment details
   * @returns {Promise<object>} Updated Order with stock transactions
   */
  fulfillOrder: async (data) => {
    const { orderId, issuedBy, company } = data;

    const order = await Order.findById(orderId).populate("items.product");
    if (!order) {
      throw new Error("Order not found");
    }

    if (order.status !== "confirmed" && order.status !== "pending") {
      throw new Error("Only pending or confirmed orders can be fulfilled");
    }

    // Create stock-out transactions for each item
    const stockTransactions = [];

    for (const item of order.items) {
      const transaction = await stockService.deductStock({
        productId: item.product._id,
        warehouseId: order.warehouse,
        quantity: item.quantity,
        reason: `Sales Order ${order.orderNumber}`,
        referenceNo: order.orderNumber,
        referenceDocument: "order",
        referenceDocumentId: order._id,
        createdBy: issuedBy,
        company,
      });

      stockTransactions.push(transaction);
    }

    // Update order status
    order.status = "issued";
    order.issuedBy = issuedBy;
    await order.save();

    return {
      order,
      stockTransactions,
    };
  },

  /**
   * Complete an order (mark as delivered)
   * @param {string} orderId - Order ObjectId
   * @returns {Promise<object>} Updated Order
   */
  completeOrder: async (orderId) => {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    if (order.status !== "issued") {
      throw new Error("Only issued orders can be completed");
    }

    order.status = "completed";
    await order.save();

    return order;
  },

  /**
   * Cancel an order
   * @param {string} orderId - Order ObjectId
   * @returns {Promise<object>} Updated Order
   */
  cancelOrder: async (orderId) => {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    if (order.status === "issued" || order.status === "completed") {
      throw new Error(
        "Cannot cancel an issued or completed order. Process a return instead."
      );
    }

    order.status = "cancelled";
    await order.save();

    return order;
  },

  /**
   * Calculate order total
   * @param {array} items - Array of items with quantity and unitPrice
   * @param {number} taxRate - Tax percentage
   * @param {number} discount - Discount percentage
   * @returns {object} Cost breakdown
   */
  calculateOrderTotal: (items, taxRate = 0, discount = 0) => {
    let subtotal = 0;

    items.forEach((item) => {
      subtotal += (item.unitPrice || 0) * (item.quantity || 0);
    });

    const discountAmount = (subtotal * discount) / 100;
    const subtotalAfterDiscount = subtotal - discountAmount;
    const taxAmount = (subtotalAfterDiscount * taxRate) / 100;
    const total = subtotalAfterDiscount + taxAmount;

    return {
      subtotal,
      discountAmount,
      discount,
      subtotalAfterDiscount,
      taxAmount,
      taxRate,
      total,
    };
  },

  /**
   * Get order history
   * @param {object} filters - Filter criteria
   * @returns {Promise<object>} Filtered orders with pagination
   */
  getOrderHistory: async (filters) => {
    const {
      warehouseId,
      status,
      orderType,
      fromDate,
      toDate,
      limit = 20,
      skip = 0,
    } = filters;

    const query = {};

    if (warehouseId) {
      query.warehouse = mongoose.Types.ObjectId(warehouseId);
    }

    if (status) {
      query.status = status;
    }

    if (orderType) {
      query.orderType = orderType;
    }

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

    const orders = await Order.find(query)
      .populate("warehouse", "name")
      .populate("items.product", "name sku")
      .populate("createdBy", "name email")
      .sort({ issueDate: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments(query);

    return {
      data: orders,
      total,
      count: orders.length,
    };
  },

  /**
   * Get warehouse order statistics
   * @param {string} warehouseId - Warehouse ObjectId
   * @param {object} options - Query options
   * @returns {Promise<object>} Warehouse statistics
   */
  getWarehouseOrderStats: async (warehouseId, options = {}) => {
    const { fromDate, toDate } = options;

    const query = { warehouse: mongoose.Types.ObjectId(warehouseId) };

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

    const orders = await Order.find(query);

    const stats = {
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
      averageOrderValue:
        orders.length > 0
          ? orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0) /
            orders.length
          : 0,
      completedOrders: orders.filter((order) => order.status === "completed").length,
      pendingOrders: orders.filter((order) => order.status === "pending").length,
      issuedOrders: orders.filter((order) => order.status === "issued").length,
    };

    return stats;
  },
};

module.exports = orderService;
