const mongoose = require("mongoose");

const goodsReceivedSchema = new mongoose.Schema(
  {
    purchaseOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PurchaseOrder",
      required: true,
    },

    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
    },

    receivedDate: {
      type: Date,
      required: true,
    },

    receivedBy: {
      type: String,
    },

    remarks: {
      type: String,
    },

    status: {
      type: String,
      enum: ["Received", "Partial"],
      default: "Received",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "GoodsReceived",
  goodsReceivedSchema
);