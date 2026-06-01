const asyncHandler = require("express-async-handler");
const Unit = require("../models/Unit");

const createUnit = asyncHandler(async (req, res) => {
  const { name, abbreviation, unitType, description, status } = req.body;

  if (!name || !abbreviation) {
    res.status(400);
    throw new Error("Unit name and abbreviation are required");
  }

  const exists = await Unit.findOne({
    $or: [{ name }, { abbreviation }],
  });

  if (exists) {
    res.status(400);
    throw new Error("Unit already exists");
  }

  const unit = await Unit.create({
    name,
    abbreviation,
    unitType,
    description,
    status,
    createdBy: req.user?._id,
  });

  res.status(201).json({
    success: true,
    message: "Unit created successfully",
    unit,
  });
});

const getUnits = asyncHandler(async (req, res) => {
  const units = await Unit.find().sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: units.length,
    units,
  });
});

const getUnitById = asyncHandler(async (req, res) => {
  const unit = await Unit.findById(req.params.id);

  if (!unit) {
    res.status(404);
    throw new Error("Unit not found");
  }

  res.status(200).json({
    success: true,
    unit,
  });
});

const updateUnit = asyncHandler(async (req, res) => {
  const unit = await Unit.findById(req.params.id);

  if (!unit) {
    res.status(404);
    throw new Error("Unit not found");
  }

  const updatedUnit = await Unit.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    message: "Unit updated successfully",
    unit: updatedUnit,
  });
});

const deleteUnit = asyncHandler(async (req, res) => {
  const unit = await Unit.findById(req.params.id);

  if (!unit) {
    res.status(404);
    throw new Error("Unit not found");
  }

  await unit.deleteOne();

  res.status(200).json({
    success: true,
    message: "Unit deleted successfully",
  });
});

module.exports = {
  createUnit,
  getUnits,
  getUnitById,
  updateUnit,
  deleteUnit,
};