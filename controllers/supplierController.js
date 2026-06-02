const asyncHandler = require("express-async-handler");
const Supplier = require("../models/Supplier");
const responseHandler = require("../utils/responseHandler");
const supplierValidator = require("../validators/supplierValidator");
const common = require("../validators/commonValidator");

const createSupplier = asyncHandler(async (req, res) => {
  // Validate request
  const validation = supplierValidator.validateCreate(req.body);
  if (!validation.isValid) {
    return responseHandler.validationError(res, validation.errors);
  }

  // Create supplier
  const supplier = await Supplier.create({
    ...req.body,
    openingBalance: Number(req.body.openingBalance || 0),
    creditLimit: Number(req.body.creditLimit || 0),
    createdBy: req.user._id,
  });

  responseHandler.success(
    res,
    supplier,
    "Supplier created successfully",
    201
  );
});

const getSuppliers = asyncHandler(async (req, res) => {
  // Validate pagination
  const paginationValidation = common.validatePagination(
    req.query.page,
    req.query.limit
  );
  if (!paginationValidation.isValid) {
    return responseHandler.validationError(res, paginationValidation.errors);
  }

  const { page, limit } = paginationValidation;
  const skip = (page - 1) * limit;

  // Build query filters
  const filters = {};
  if (req.query.search) {
    filters.$or = [
      { name: { $regex: req.query.search, $options: "i" } },
      { email: { $regex: req.query.search, $options: "i" } },
      { phone: { $regex: req.query.search, $options: "i" } },
    ];
  }

  // Get total count and data
  const total = await Supplier.countDocuments(filters);
  const suppliers = await Supplier.find(filters)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  responseHandler.paginated(
    res,
    suppliers,
    page,
    limit,
    total,
    "Suppliers retrieved successfully"
  );
});

const getSupplierById = asyncHandler(async (req, res) => {
  // Validate supplier ID format
  if (!common.isValidId(req.params.id)) {
    return responseHandler.error(res, "Invalid supplier ID", 400);
  }

  const supplier = await Supplier.findById(req.params.id);

  if (!supplier) {
    return responseHandler.error(res, "Supplier not found", 404);
  }

  responseHandler.success(res, supplier, "Supplier retrieved successfully");
});

const updateSupplier = asyncHandler(async (req, res) => {
  // Validate supplier ID format
  if (!common.isValidId(req.params.id)) {
    return responseHandler.error(res, "Invalid supplier ID", 400);
  }

  // Validate request
  const validation = supplierValidator.validateUpdate(req.body);
  if (!validation.isValid) {
    return responseHandler.validationError(res, validation.errors);
  }

  // Check if supplier exists
  const supplier = await Supplier.findById(req.params.id);
  if (!supplier) {
    return responseHandler.error(res, "Supplier not found", 404);
  }

  // Update supplier
  const updatedSupplier = await Supplier.findByIdAndUpdate(
    req.params.id,
    {
      ...req.body,
      openingBalance: req.body.openingBalance
        ? Number(req.body.openingBalance)
        : supplier.openingBalance,
      creditLimit: req.body.creditLimit
        ? Number(req.body.creditLimit)
        : supplier.creditLimit,
      updatedBy: req.user._id,
      updatedAt: new Date(),
    },
    {
      new: true,
      runValidators: true,
    }
  );

  responseHandler.success(
    res,
    updatedSupplier,
    "Supplier updated successfully"
  );
});

module.exports = {
  createSupplier,
  getSuppliers,
  getSupplierById,
  updateSupplier,
};