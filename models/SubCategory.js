const mongoose = require("mongoose");

const subCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Sub category name is required"],
      trim: true,
    },

    category: {
      type: String,
      required: [true, "Parent category is required"],
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    displayOrder: {
      type: Number,
      default: 0,
    },

    notes: {
      type: String,
      default: "",
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

subCategorySchema.index({ name: 1, category: 1 }, { unique: true });

module.exports = mongoose.model("SubCategory", subCategorySchema);