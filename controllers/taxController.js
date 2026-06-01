const asyncHandler = require("express-async-handler");
const Tax = require("../models/Tax");

// @desc    Create tax
// @route   POST /api/taxes
const createTax = asyncHandler(async (req, res) => {
  const {
    name,
    taxType,
    taxRate,
    calculationType,
    description,
    applyOn,
    status,
  } = req.body;

  if (!name || !taxType || taxRate === undefined || !applyOn) {
    res.status(400);
    throw new Error("Tax name, tax type, tax rate and apply on are required");
  }

  const exists = await Tax.findOne({
    name: name.trim(),
  });

  if (exists) {
    res.status(400);
    throw new Error("Tax already exists");
  }

  const tax = await Tax.create({
    name: name.trim(),
    taxType,
    taxRate: Number(taxRate),
    calculationType: calculationType || "taxableAmount",
    description: description || "",
    applyOn,
    status: status || "active",
    createdBy: req.user?._id,
  });

  res.status(201).json({
    success: true,
    message: "Tax created successfully",
    data: tax,
    tax,
  });
});

// @desc    Get all taxes
// @route   GET /api/taxes
const getTaxes = asyncHandler(async (req, res) => {
  const { search, status, taxType, applyOn } = req.query;

  const query = {};

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { taxType: { $regex: search, $options: "i" } },
      { applyOn: { $regex: search, $options: "i" } },
    ];
  }

  if (status) query.status = status;
  if (taxType) query.taxType = taxType;
  if (applyOn) query.applyOn = applyOn;

  const taxes = await Tax.find(query).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: taxes.length,
    data: taxes,
    taxes,
  });
});

// @desc    Get single tax
// @route   GET /api/taxes/:id
const getTaxById = asyncHandler(async (req, res) => {
  const tax = await Tax.findById(req.params.id);

  if (!tax) {
    res.status(404);
    throw new Error("Tax not found");
  }

  res.status(200).json({
    success: true,
    data: tax,
    tax,
  });
});

// @desc    Update tax
// @route   PUT /api/taxes/:id
const updateTax = asyncHandler(async (req, res) => {
  const tax = await Tax.findById(req.params.id);

  if (!tax) {
    res.status(404);
    throw new Error("Tax not found");
  }

  if (req.body.name) {
    const exists = await Tax.findOne({
      name: req.body.name.trim(),
      _id: { $ne: req.params.id },
    });

    if (exists) {
      res.status(400);
      throw new Error("Tax already exists");
    }

    req.body.name = req.body.name.trim();
  }

  if (req.body.taxRate !== undefined) {
    req.body.taxRate = Number(req.body.taxRate);
  }

  const updatedTax = await Tax.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    message: "Tax updated successfully",
    data: updatedTax,
    tax: updatedTax,
  });
});

// @desc    Delete tax
// @route   DELETE /api/taxes/:id
const deleteTax = asyncHandler(async (req, res) => {
  const tax = await Tax.findById(req.params.id);

  if (!tax) {
    res.status(404);
    throw new Error("Tax not found");
  }

  await tax.deleteOne();

  res.status(200).json({
    success: true,
    message: "Tax deleted successfully",
    id: req.params.id,
  });
});

module.exports = {
  createTax,
  getTaxes,
  getTaxById,
  updateTax,
  deleteTax,
};