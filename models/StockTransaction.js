const mongoose = require("mongoose");

const stockTransactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["stock-in", "stock-out", "adjustment"],
      required: true,
    },

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      default: null,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    previousStock: {
      type: Number,
      default: 0,
    },

    newStock: {
      type: Number,
      default: 0,
    },

    reason: {
      type: String,
      default: "",
      trim: true,
    },

    referenceNo: {
      type: String,
      default: "",
      trim: true,
    },

    referenceDocument: {
      type: String,
      enum: ["order", "purchase-order", "grn", "transfer", "manual"],
      default: "manual",
    },

    referenceDocumentId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    notes: {
      type: String,
      default: "",
      trim: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
    },
  },
  { timestamps: true }
);


module.exports = mongoose.model("StockTransaction", stockTransactionSchema);