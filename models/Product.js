const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },

    shortName: {
      type: String,
      default: "",
      trim: true,
    },

    productType: {
      type: String,
      enum: ["Simple Product", "Variant Product", "Bundle/Combo", "Service"],
      default: "Simple Product",
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Product category is required"],
    },

    subCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubCategory",
      default: null,
    },

    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      default: null,
    },

    sku: {
      type: String,
      required: [true, "SKU is required"],
      unique: true,
      trim: true,
    },

    barcode: {
      type: String,
      default: "",
    },

    hsnSacCode: {
      type: String,
      default: "",
    },

    internalProductCode: {
      type: String,
      default: "",
    },

    purchasePrice: {
      type: Number,
      default: 0,
    },

    sellingPrice: {
      type: Number,
      required: [true, "Selling price is required"],
      default: 0,
    },

    mrp: {
      type: Number,
      default: 0,
    },

    wholesalePrice: {
      type: Number,
      default: 0,
    },

    distributorPrice: {
      type: Number,
      default: 0,
    },

    tax: {
      type: Number,
      default: 0,
    },

    discountType: {
      type: String,
      enum: ["Flat", "Percentage"],
      default: "Flat",
    },

    discountValue: {
      type: Number,
      default: 0,
    },

    openingStock: {
      type: Number,
      default: 0,
    },

    currentStock: {
      type: Number,
      default: 0,
    },

    minStockLevel: {
      type: Number,
      default: 0,
    },

    reorderQuantity: {
      type: Number,
      default: 0,
    },

    maximumStock: {
      type: Number,
      default: 0,
    },

    warehouseLocation: {
      type: String,
      default: "",
    },

    enableStockTracking: {
      type: Boolean,
      default: true,
    },

    allowNegativeStock: {
      type: Boolean,
      default: false,
    },

    trackBatchNumber: {
      type: Boolean,
      default: true,
    },

    trackSerialNumber: {
      type: Boolean,
      default: false,
    },

    enableVariants: {
      type: Boolean,
      default: false,
    },

    primaryUnit: {
      type: String,
      default: "Piece",
    },

    unitConversions: {
      type: Array,
      default: [],
    },

    variantTypes: {
      type: Array,
      default: [],
    },

    variantCombinations: {
      type: Array,
      default: [],
    },

    enableExpiryTracking: {
      type: Boolean,
      default: false,
    },

    batches: {
      type: Array,
      default: [],
    },

    suppliers: {
      type: Array,
      default: [],
    },

    productDescription: {
      type: String,
      default: "",
    },

    seoTitle: {
      type: String,
      default: "",
    },

    seoKeywords: {
      type: String,
      default: "",
    },

    metaDescription: {
      type: String,
      default: "",
    },

    slugUrl: {
      type: String,
      default: "",
    },

    weight: {
      type: Number,
      default: 0,
    },

    length: {
      type: Number,
      default: 0,
    },

    width: {
      type: Number,
      default: 0,
    },

    height: {
      type: Number,
      default: 0,
    },

    published: {
      type: Boolean,
      default: true,
    },

    featuredProduct: {
      type: Boolean,
      default: false,
    },

    onlineOnly: {
      type: Boolean,
      default: false,
    },

    returnable: {
      type: Boolean,
      default: false,
    },

    fragile: {
      type: Boolean,
      default: false,
    },

    codAvailable: {
      type: Boolean,
      default: false,
    },

    subscriptionProduct: {
      type: Boolean,
      default: false,
    },

    perishable: {
      type: Boolean,
      default: false,
    },

    requiresShipping: {
      type: Boolean,
      default: false,
    },

    fastMoving: {
      type: Boolean,
      default: false,
    },

    seasonal: {
      type: Boolean,
      default: false,
    },

    highMargin: {
      type: Boolean,
      default: false,
    },

    bestseller: {
      type: Boolean,
      default: false,
    },

    thumbnail: {
      type: String,
      default: "",
    },

    images: {
      type: [String],
      default: [],
    },

    status: {
      type: String,
      enum: ["active", "inactive", "draft"],
      default: "active",
    },

    visibility: {
      type: String,
      enum: ["Visible Everywhere", "Online Only", "POS Only", "Hidden"],
      default: "Visible Everywhere",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);



module.exports = mongoose.model("Product", productSchema);