const GoodsReceived = require("../models/GoodsReceived");
const PurchaseOrder = require("../models/PurchaseOrder");

const createGRN = async (req, res) => {
  try {
    const {
      purchaseOrder,
      supplier,
      receivedDate,
      remarks,
      status,
    } = req.body;

    const grn = await GoodsReceived.create({
      purchaseOrder,
      supplier,
      receivedDate,
      remarks,
      status,
    });

    await PurchaseOrder.findByIdAndUpdate(
      purchaseOrder,
      {
        status: "Received",
      }
    );

    res.status(201).json({
      success: true,
      grn,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getGRNs = async (req, res) => {
  try {
    const grns = await GoodsReceived.find()
      .populate("purchaseOrder")
      .populate("supplier")
      .sort({
        createdAt: -1,
      });

    res.json({
      success: true,
      grns,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createGRN,
  getGRNs,
};