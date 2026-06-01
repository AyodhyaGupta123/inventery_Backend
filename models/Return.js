const mongoose = require("mongoose");

const returnItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    productName: {
      type: String,
      required: true,
      trim: true,
    },

    sku: {
      type: String,
      default: "",
      trim: true,
    },

    unit: {
      type: String,
      default: "pcs",
      trim: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { _id: false }
);

const returnSchema = new mongoose.Schema(
  {
    returnNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    issueOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },

    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true,
    },

    department: {
      type: String,
      required: true,
      trim: true,
    },

    returnDate: {
      type: Date,
      default: Date.now,
    },

    items: {
      type: [returnItemSchema],
      required: true,
      validate: {
        validator: function (items) {
          return items.length > 0;
        },
        message: "At least one return item is required",
      },
    },

    totalQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },

    reason: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: [
        "requested",
        "approved",
        "received",
        "completed",
        "rejected",
        "cancelled",
      ],
      default: "requested",
    },

    returnedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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
  },
  { timestamps: true }
);

module.exports = mongoose.model("Return", returnSchema);