const PurchaseOrder = require("../models/PurchaseOrder");

const createPurchaseOrder = async (req, res) => {
  try {
    const {
      supplier,
      purchaseDate,
      expectedDate,
      items,
      notes,
    } = req.body;

    const subtotal = items.reduce(
      (sum, item) => sum + item.quantity * item.rate,
      0
    );

    const gstAmount = subtotal * 0.18;

    const totalAmount = subtotal + gstAmount;

    const orderNumber = `PO-${Date.now()}`;

    const purchaseOrder = await PurchaseOrder.create({
      supplier,
      purchaseDate,
      expectedDate,
      items: items.map((item) => ({
        ...item,
        amount: item.quantity * item.rate,
      })),
      notes,
      subtotal,
      gstAmount,
      totalAmount,
      orderNumber,
    });

    res.status(201).json({
      success: true,
      purchaseOrder,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getPurchaseOrders = async (req, res) => {
  try {
    const purchaseOrders = await PurchaseOrder.find()
      .populate(
        "supplier",
        "name email phone company gst city address"
      )
      .populate(
        "items.product",
        "name sku unit rate price sellingPrice currentStock"
      )
      .sort({
        createdAt: -1,
      });

    res.json({
      success: true,
      count: purchaseOrders.length,
      purchaseOrders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const getPurchaseOrderById = async (req, res) => {
  try {
    const purchaseOrder = await PurchaseOrder.findById(req.params.id)
      .populate("supplier", "name email phone company gst city address")
      .populate("items.product", "name sku unit rate price sellingPrice currentStock");

    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: "Purchase order not found",
      });
    }

    res.json({
      success: true,
      purchaseOrder,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createPurchaseOrder,
  getPurchaseOrders,
  getPurchaseOrderById,
};