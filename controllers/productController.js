const asyncHandler = require("express-async-handler");
const Product = require("../models/Product");
const StockTransaction = require("../models/StockTransaction");
const responseHandler = require("../utils/responseHandler");
const productValidator = require("../validators/productValidator");
const common = require("../validators/commonValidator");

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

  return req.files.images.map((file) => `/uploads/products/${file.filename}`);
};

const buildProductData = (req, isUpdate = false) => {
  const body = req.body;

  const productData = {
    name: body.name,
    shortName: body.shortName,
    productType: body.productType,

    category: body.categoryId || body.category || undefined,
    subCategory: body.subCategoryId || body.subCategory || null,
    brand: body.brandId || body.brand || null,

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

    status: body.status || "active",
    visibility: body.visibility,
  };

  if (!isUpdate) {
    productData.currentStock = toNumber(body.openingStock);
    productData.createdBy = req.user?._id;
  }

  const thumbnail = getUploadedThumbnail(req);
  const images = getUploadedImages(req);

  if (thumbnail) {
    productData.thumbnail = thumbnail;
    productData.image = thumbnail;
  }

  if (images.length) {
    productData.images = images;
  }

  Object.keys(productData).forEach((key) => {
    if (
      productData[key] === undefined ||
      productData[key] === null ||
      productData[key] === ""
    ) {
      delete productData[key];
    }
  });

  return productData;
};

const createProduct = asyncHandler(async (req, res) => {
  const validation = productValidator.validateCreate(req.body);

  if (!validation.isValid) {
    return responseHandler.validationError(res, validation.errors);
  }

  const { sku } = req.body;

  const exists = await Product.findOne({ sku });

  if (exists) {
    return responseHandler.error(
      res,
      "Product with this SKU already exists",
      400,
    );
  }

  const product = await Product.create({
    ...buildProductData(req),
    createdBy: req.user?._id,
  });

  const openingStock = toNumber(req.body.openingStock);

  if (openingStock > 0) {
    await StockTransaction.create({
      type: "stock-in",
      product: product._id,
      quantity: openingStock,
      previousStock: 0,
      newStock: openingStock,
      reason: "Opening Stock",
      referenceNo: `OPENING-${product.sku}`,
      notes: "Auto generated during product creation",
      createdBy: req.user?._id,
    });
  }

  const populatedProduct = await Product.findById(product._id)
    .populate("category", "name")
    .populate("subCategory", "name")
    .populate("brand", "name");

  responseHandler.success(
    res,
    populatedProduct,
    "Product created successfully",
    201,
  );
});

const getProducts = asyncHandler(async (req, res) => {
  const paginationValidation = common.validatePagination(
    req.query.page,
    req.query.limit,
  );

  if (!paginationValidation.isValid) {
    return responseHandler.validationError(res, paginationValidation.errors);
  }

  const { page, limit } = paginationValidation;
  const { search, status, category, categoryId, brand, brandId } = req.query;

  const query = {};

  if (status) query.status = status;
  if (categoryId || category) query.category = categoryId || category;
  if (brandId || brand) query.brand = brandId || brand;

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { sku: { $regex: search, $options: "i" } },
      { barcode: { $regex: search, $options: "i" } },
      { productType: { $regex: search, $options: "i" } },
      { primaryUnit: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (page - 1) * limit;

  const total = await Product.countDocuments(query);

  const products = await Product.find(query)
    .populate("category", "name")
    .populate("subCategory", "name")
    .populate("brand", "name")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  responseHandler.paginated(
    res,
    products,
    page,
    limit,
    total,
    "Products retrieved successfully",
  );
});

const getProductById = asyncHandler(async (req, res) => {
  if (!common.isValidId(req.params.id)) {
    return responseHandler.error(res, "Invalid product ID", 400);
  }

  const product = await Product.findById(req.params.id)
    .populate("category", "name")
    .populate("subCategory", "name")
    .populate("brand", "name");

  if (!product) {
    return responseHandler.error(res, "Product not found", 404);
  }

  responseHandler.success(res, product, "Product retrieved successfully");
});

const updateProduct = asyncHandler(async (req, res) => {
  if (!common.isValidId(req.params.id)) {
    return responseHandler.error(res, "Invalid product ID", 400);
  }

  const product = await Product.findById(req.params.id);

  if (!product) {
    return responseHandler.error(res, "Product not found", 404);
  }

  const validation = productValidator.validateUpdate(req.body);

  if (!validation.isValid) {
    return responseHandler.validationError(res, validation.errors);
  }

  if (req.body.sku && req.body.sku !== product.sku) {
    const exists = await Product.findOne({ sku: req.body.sku });

    if (exists) {
      return responseHandler.error(
        res,
        "Product with this SKU already exists",
        400,
      );
    }
  }

  const updateData = buildProductData(req, true);

  if (
    req.body.openingStock !== undefined &&
    req.body.currentStock === undefined
  ) {
    updateData.currentStock = product.currentStock;
  }

  const updatedProduct = await Product.findByIdAndUpdate(
    req.params.id,
    updateData,
    {
      new: true,
      runValidators: true,
    },
  )
    .populate("category", "name")
    .populate("subCategory", "name")
    .populate("brand", "name");

  responseHandler.success(res, updatedProduct, "Product updated successfully");
});

const deleteProduct = asyncHandler(async (req, res) => {
  if (!common.isValidId(req.params.id)) {
    return responseHandler.error(res, "Invalid product ID", 400);
  }

  const product = await Product.findById(req.params.id);

  if (!product) {
    return responseHandler.error(res, "Product not found", 404);
  }

  await product.deleteOne();

  responseHandler.success(res, null, "Product deleted successfully");
});

const getLowStockProducts = asyncHandler(async (req, res) => {
  const paginationValidation = common.validatePagination(
    req.query.page,
    req.query.limit,
  );

  if (!paginationValidation.isValid) {
    return responseHandler.validationError(res, paginationValidation.errors);
  }

  const { page, limit } = paginationValidation;
  const skip = (page - 1) * limit;

  const query = {
    $expr: { $lte: ["$currentStock", "$minStockLevel"] },
    status: "active",
  };

  const total = await Product.countDocuments(query);

  const products = await Product.find(query)
    .populate("category", "name")
    .populate("subCategory", "name")
    .populate("brand", "name")
    .sort({ currentStock: 1 })
    .skip(skip)
    .limit(limit);

  responseHandler.paginated(
    res,
    products,
    page,
    limit,
    total,
    "Low stock products retrieved successfully",
  );
});

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
};
