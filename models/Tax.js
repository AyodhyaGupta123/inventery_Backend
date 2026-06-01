const mongoose = require("mongoose");

const taxSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Tax name is required"],
      trim: true,
      unique: true,
    },
    taxType: {
      type: String,
      required: [true, "Tax type is required"],
      enum: ["GST", "VAT", "Sales Tax"],
    },
    taxRate: {
      type: Number,
      required: [true, "Tax rate is required"],
      min: 0,
    },
    calculationType: {
      type: String,
      enum: ["taxableAmount", "inclusive", "exclusive"],
      default: "taxableAmount",
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    applyOn: {
      type: String,
      required: [true, "Apply on is required"],
      enum: ["product", "shipping"],
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Tax", taxSchema);