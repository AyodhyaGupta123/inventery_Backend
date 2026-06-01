const Product = require("../models/Product");
const StockTransaction = require("../models/StockTransaction");
const Order = require("../models/Order");
const Return = require("../models/Return");
const Refund = require("../models/Refund");
const Brand = require("../models/Brand");
const Warehouse = require("../models/Warehouse");
const Transfer = require("../models/StockTransfer");
const Supplier = require("../models/Supplier");
const PurchaseOrder = require("../models/PurchaseOrder");
const GoodsReceived = require("../models/GoodsReceived");

const getAnalyticsDashboard = async (req, res) => {
  try {
    const [
      products,
      lowStockProducts,
      stockTransactions,
      orders,
      returnsList,
      refunds,
      brands,
      warehouses,
      transfers,
      suppliers,
      purchaseOrders,
      grns,
    ] = await Promise.all([
      Product.find(),
      Product.find({ $expr: { $lte: ["$stock", "$minStock"] } }),
      StockTransaction.find().sort({ createdAt: -1 }).limit(50),
      Order.find(),
      Return.find(),
      Refund.find(),
      Brand.find(),
      Warehouse.find(),
      Transfer.find(),
      Supplier.find(),
      PurchaseOrder.find().populate("supplier").sort({ createdAt: -1 }),
      GoodsReceived.find()
        .populate("supplier")
        .populate("purchaseOrder")
        .sort({ createdAt: -1 }),
    ]);

    const stockIn = stockTransactions
      .filter((item) => item.type === "in" || item.type === "stock-in")
      .reduce((sum, item) => sum + Number(item.quantity || item.qty || 0), 0);

    const stockOut = stockTransactions
      .filter((item) => item.type === "out" || item.type === "stock-out")
      .reduce((sum, item) => sum + Number(item.quantity || item.qty || 0), 0);

    const purchaseSummary = {
      pending: purchaseOrders.filter((item) => item.status === "Pending").length,
      received: purchaseOrders.filter((item) => item.status === "Received").length,
      cancelled: purchaseOrders.filter((item) => item.status === "Cancelled").length,
    };

    const transferSummary = {
      pending: transfers.filter((item) => item.status === "Pending").length,
      completed: transfers.filter((item) => item.status === "Completed").length,
      inTransit: transfers.filter((item) => item.status === "In Transit").length,
    };

    res.json({
      success: true,
      summary: {
        products: products.length,
        lowStock: lowStockProducts.length,
        stockTransactions: stockTransactions.length,
        stockIn,
        stockOut,
        orders: orders.length,
        returns: returnsList.length,
        refunds: refunds.length,
        brands: brands.length,
        warehouses: warehouses.length,
        transfers: transfers.length,
        suppliers: suppliers.length,
        purchaseOrders: purchaseOrders.length,
        grns: grns.length,
        purchaseSummary,
        transferSummary,
      },
      chartData: stockTransactions,
      recentActivities: {
        stockTransactions: stockTransactions.slice(0, 5),
        purchaseOrders: purchaseOrders.slice(0, 5),
        lowStockProducts: lowStockProducts.slice(0, 5),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getAnalyticsDashboard,
};