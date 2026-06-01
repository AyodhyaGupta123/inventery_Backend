const asyncHandler = require("express-async-handler");
const Product = require("../models/Product");

const toNumber = (value) => {
  const num = Number(value);
  return Number.isNaN(num) ? 0 : num;
};

const toBoolean = (value) => {
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return false;
};

const toArray = (value) => {
  try {
    return value ? JSON.parse(value) : [];
  } catch {
    return [];
  }
};

const getUploadedThumbnail = (req) => {
  if (req.files?.thumbnail?.[0]) {
    return `/uploads/products/${req.files.thumbnail[0].filename}`;
  }

  if (req.file) {
    return `/uploads/products/${req.file.filename}`;
  }

  return "";
};

const getUploadedImages = (req) => {
  if (!req.files?.images) return [];

  return req.files.images.map(
    (file) => `/uploads/products/${file.filename}`
  );
};

const buildProductData = (req, isUpdate = false) => {
  const body = req.body;

  const productData = {
    name: body.name,
    shortName: body.shortName,
    productType: body.productType,

    category: body.category,
    subCategory: body.subCategory,
    brand: body.brand,

    sku: body.sku,
    barcode: body.barcode,
    hsnSacCode: body.hsnSacCode,
    internalProductCode: body.internalProductCode,

    purchasePrice: toNumber(body.purchasePrice),
    sellingPrice: toNumber(body.sellingPrice),
    mrp: toNumber(body.mrp),
    wholesalePrice: toNumber(body.wholesalePrice),
    distributorPrice: toNumber(body.distributorPrice),
    tax: toNumber(body.tax),
    discountType: body.discountType,
    discountValue: toNumber(body.discountValue),

    openingStock: toNumber(body.openingStock),
    minStockLevel: toNumber(body.minStockLevel),
    reorderQuantity: toNumber(body.reorderQuantity),
    maximumStock: toNumber(body.maximumStock),
    warehouseLocation: body.warehouseLocation,

    enableStockTracking: toBoolean(body.enableStockTracking),
    allowNegativeStock: toBoolean(body.allowNegativeStock),
    trackBatchNumber: toBoolean(body.trackBatchNumber),
    trackSerialNumber: toBoolean(body.trackSerialNumber),

    enableVariants: toBoolean(body.enableVariants),
    primaryUnit: body.primaryUnit,
    unitConversions: toArray(body.unitConversions),
    variantTypes: toArray(body.variantTypes),
    variantCombinations: toArray(body.variantCombinations),

    enableExpiryTracking: toBoolean(body.enableExpiryTracking),
    batches: toArray(body.batches),
    suppliers: toArray(body.suppliers),

    productDescription: body.productDescription,
    seoTitle: body.seoTitle,
    seoKeywords: body.seoKeywords,
    metaDescription: body.metaDescription,
    slugUrl: body.slugUrl,

    weight: toNumber(body.weight),
    length: toNumber(body.length),
    width: toNumber(body.width),
    height: toNumber(body.height),

    published: toBoolean(body.published),
    featuredProduct: toBoolean(body.featuredProduct),
    onlineOnly: toBoolean(body.onlineOnly),
    returnable: toBoolean(body.returnable),
    fragile: toBoolean(body.fragile),
    codAvailable: toBoolean(body.codAvailable),
    subscriptionProduct: toBoolean(body.subscriptionProduct),
    perishable: toBoolean(body.perishable),
    requiresShipping: toBoolean(body.requiresShipping),
    fastMoving: toBoolean(body.fastMoving),
    seasonal: toBoolean(body.seasonal),
    highMargin: toBoolean(body.highMargin),
    bestseller: toBoolean(body.bestseller),

    status: body.status,
    visibility: body.visibility,
  };

  if (!isUpdate) {
    productData.currentStock = toNumber(body.openingStock);
    productData.createdBy = req.user?._id;
  }

  const thumbnail = getUploadedThumbnail(req);
  const images = getUploadedImages(req);

  if (thumbnail) productData.thumbnail = thumbnail;
  if (thumbnail) productData.image = thumbnail;
  if (images.length) productData.images = images;

  Object.keys(productData).forEach((key) => {
    if (productData[key] === undefined) {
      delete productData[key];
    }
  });

  return productData;
};

const createProduct = asyncHandler(async (req, res) => {
  const { name, sku, category, sellingPrice } = req.body;

  if (!name || !sku) {
    res.status(400);
    throw new Error("Product name and SKU are required");
  }

  if (!category) {
    res.status(400);
    throw new Error("Product category is required");
  }

  if (!sellingPrice) {
    res.status(400);
    throw new Error("Selling price is required");
  }

  const exists = await Product.findOne({ sku });

  if (exists) {
    res.status(400);
    throw new Error("Product with this SKU already exists");
  }

  const product = await Product.create(buildProductData(req));

  res.status(201).json({
    success: true,
    message: "Product created successfully",
    product,
  });
});

const getProducts = asyncHandler(async (req, res) => {
  const { search, status, category, brand } = req.query;

  const query = {};

  if (status) query.status = status;
  if (category) query.category = category;
  if (brand) query.brand = brand;

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { sku: { $regex: search, $options: "i" } },
      { brand: { $regex: search, $options: "i" } },
      { category: { $regex: search, $options: "i" } },
      { barcode: { $regex: search, $options: "i" } },
    ];
  }

  const products = await Product.find(query).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: products.length,
    products,
  });
});

const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  res.status(200).json({
    success: true,
    product,
  });
});

const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  if (req.body.sku && req.body.sku !== product.sku) {
    const exists = await Product.findOne({ sku: req.body.sku });

    if (exists) {
      res.status(400);
      throw new Error("Product with this SKU already exists");
    }
  }

  const updateData = buildProductData(req, true);

  if (req.body.openingStock !== undefined && req.body.currentStock === undefined) {
    updateData.currentStock = product.currentStock;
  }

  const updatedProduct = await Product.findByIdAndUpdate(
    req.params.id,
    updateData,
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    success: true,
    message: "Product updated successfully",
    product: updatedProduct,
  });
});

const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  await product.deleteOne();

  res.status(200).json({
    success: true,
    message: "Product deleted successfully",
  });
});

const getLowStockProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({
    $expr: { $lte: ["$currentStock", "$minStockLevel"] },
    status: "active",
  }).sort({ currentStock: 1 });

  res.status(200).json({
    success: true,
    count: products.length,
    products,
  });
});

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
};