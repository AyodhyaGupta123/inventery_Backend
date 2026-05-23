const asyncHandler = require("express-async-handler");
const Category = require("../models/Category");

const createCategory = asyncHandler(async (req, res) => {
  const { name, code, description, status } = req.body;

  if (!name) {
    res.status(400);
    throw new Error("Category name is required");
  }

  const exists = await Category.findOne({ name });

  if (exists) {
    res.status(400);
    throw new Error("Category already exists");
  }

  const image = req.file
  ? `/uploads/categories/${req.file.filename}`
  : "";

  const category = await Category.create({
    name,
    code,
    image,
    description,
    status,
    createdBy: req.user?._id,
  });

  res.status(201).json({
    success: true,
    message: "Category created successfully",
    category,
  });
});

const getCategories = asyncHandler(async (req, res) => {
  const { search, status } = req.query;

  const query = {};

  if (status) query.status = status;

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { code: { $regex: search, $options: "i" } },
    ];
  }

  const categories = await Category.find(query).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: categories.length,
    categories,
  });
});

const getCategoryById = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    res.status(404);
    throw new Error("Category not found");
  }

  res.status(200).json({
    success: true,
    category,
  });
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    res.status(404);
    throw new Error("Category not found");
  }

  const updateData = { ...req.body };

  if (req.file) {
    updateData.image = `/uploads/categories/${req.file.filename}`;
  }

  const updatedCategory = await Category.findByIdAndUpdate(
    req.params.id,
    updateData,
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    success: true,
    message: "Category updated successfully",
    category: updatedCategory,
  });
});

const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    res.status(404);
    throw new Error("Category not found");
  }

  await category.deleteOne();

  res.status(200).json({
    success: true,
    message: "Category deleted successfully",
  });
});

module.exports = {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};