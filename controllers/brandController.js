const asyncHandler = require("express-async-handler");
const Brand = require("../models/Brand");

const createBrand = asyncHandler(async (req, res) => {

  const { name, code, description, status } = req.body;

  if (!name || !code) {
    res.status(400);
    throw new Error("Brand name and code are required");
  }

  const exists = await Brand.findOne({ code: code.toUpperCase() });

  if (exists) {
    res.status(400);
    throw new Error("Brand code already exists");
  }

  const image = req.file ? `/uploads/brands/${req.file.filename}` : "";

  const brand = await Brand.create({
    name,
    code: code.toUpperCase(),
    image,
    description,
    status,
    createdBy: req.user?._id,
  });

  res.status(201).json({
    success: true,
    message: "Brand created successfully",
    brand,
  });
});

const getBrands = asyncHandler(async (req, res) => {
  const { search, status } = req.query;

  const query = {};

  if (status) query.status = status;

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { code: { $regex: search, $options: "i" } },
    ];
  }

  const brands = await Brand.find(query).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: brands.length,
    brands,
  });
});

const getBrandById = asyncHandler(async (req, res) => {
  const brand = await Brand.findById(req.params.id);

  if (!brand) {
    res.status(404);
    throw new Error("Brand not found");
  }

  res.status(200).json({
    success: true,
    brand,
  });
});

const updateBrand = asyncHandler(async (req, res) => {
  const brand = await Brand.findById(req.params.id);

  if (!brand) {
    res.status(404);
    throw new Error("Brand not found");
  }

  brand.name = req.body.name || brand.name;
  brand.code = req.body.code ? req.body.code.toUpperCase() : brand.code;
  brand.description = req.body.description || brand.description;
  brand.status = req.body.status || brand.status;

  if (req.file) {
    brand.image = `/uploads/brands/${req.file.filename}`;
  }

  const updatedBrand = await brand.save();

  res.status(200).json({
    success: true,
    message: "Brand updated successfully",
    brand: updatedBrand,
  });
});

const deleteBrand = asyncHandler(async (req, res) => {
  const brand = await Brand.findById(req.params.id);

  if (!brand) {
    res.status(404);
    throw new Error("Brand not found");
  }

  await brand.deleteOne();

  res.status(200).json({
    success: true,
    message: "Brand deleted successfully",
  });
});

module.exports = {
  createBrand,
  getBrands,
  getBrandById,
  updateBrand,
  deleteBrand,
};