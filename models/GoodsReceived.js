const mongoose = require("mongoose");

const goodsReceivedItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    orderedQty: {
      type: Number,
      default: 0,
    },

    receivedQty: {
      type: Number,
      required: true,
      default: 0,
    },

    rejectedQty: {
      type: Number,
      default: 0,
    },

    remarks: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const goodsReceivedSchema = new mongoose.Schema(
  {
    grnNumber: {
      type: String,
      unique: true,
    },

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
      default: "",
    },

    warehouse: {
      type: String,
      default: "",
    },

    items: {
      type: [goodsReceivedItemSchema],
      default: [],
    },

    remarks: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["Received", "Partial"],
      default: "Received",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("GoodsReceived", goodsReceivedSchema);