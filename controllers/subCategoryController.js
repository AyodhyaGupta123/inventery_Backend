const asyncHandler = require("express-async-handler");
const SubCategory = require("../models/SubCategory");
const Category = require("../models/Category");

const createSubCategory = asyncHandler(async (req, res) => {
  const { name, categoryId, description, displayOrder, notes, status } = req.body;

  if (!name || !categoryId) {
    res.status(400);
    throw new Error("Sub category name and parent category are required");
  }

  const category = await Category.findById(categoryId);

  if (!category) {
    res.status(404);
    throw new Error("Parent category not found");
  }

  const exists = await SubCategory.findOne({
    name: name.trim(),
    categoryId,
  });

  if (exists) {
    res.status(400);
    throw new Error("Sub category already exists in this category");
  }

  const subCategory = await SubCategory.create({
    name: name.trim(),
    categoryId,
    categoryName: category.name,
    description: description || "",
    displayOrder: Number(displayOrder || 0),
    notes: notes || "",
    status: status || "active",
    createdBy: req.user?._id,
  });

  res.status(201).json({
    success: true,
    message: "Sub category created successfully",
    subCategory,
    data: subCategory,
  });
});

const getSubCategories = asyncHandler(async (req, res) => {
  const { search, categoryId, status } = req.query;

  const query = {};

  if (categoryId) query.categoryId = categoryId;
  if (status) query.status = status;

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { categoryName: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  const subCategories = await SubCategory.find(query)
    .populate("categoryId", "name status")
    .sort({
      displayOrder: 1,
      createdAt: -1,
    });

  res.status(200).json({
    success: true,
    count: subCategories.length,
    subCategories,
    subcategories: subCategories,
    data: subCategories,
  });
});

const getSubCategoryById = asyncHandler(async (req, res) => {
  const subCategory = await SubCategory.findById(req.params.id).populate(
    "categoryId",
    "name status"
  );

  if (!subCategory) {
    res.status(404);
    throw new Error("Sub category not found");
  }

  res.status(200).json({
    success: true,
    subCategory,
    data: subCategory,
  });
});

const updateSubCategory = asyncHandler(async (req, res) => {
  const subCategory = await SubCategory.findById(req.params.id);

  if (!subCategory) {
    res.status(404);
    throw new Error("Sub category not found");
  }

  const { name, categoryId } = req.body;

  let categoryName = subCategory.categoryName;

  if (categoryId) {
    const category = await Category.findById(categoryId);

    if (!category) {
      res.status(404);
      throw new Error("Parent category not found");
    }

    categoryName = category.name;
  }

  if (name || categoryId) {
    const exists = await SubCategory.findOne({
      _id: { $ne: req.params.id },
      name: (name || subCategory.name).trim(),
      categoryId: categoryId || subCategory.categoryId,
    });

    if (exists) {
      res.status(400);
      throw new Error("Sub category already exists in this category");
    }
  }

  const payload = {
    ...req.body,
    categoryName,
  };

  if (payload.name) payload.name = payload.name.trim();

  if (payload.displayOrder !== undefined) {
    payload.displayOrder = Number(payload.displayOrder || 0);
  }

  const updatedSubCategory = await SubCategory.findByIdAndUpdate(
    req.params.id,
    payload,
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    success: true,
    message: "Sub category updated successfully",
    subCategory: updatedSubCategory,
    data: updatedSubCategory,
  });
});

const deleteSubCategory = asyncHandler(async (req, res) => {
  const subCategory = await SubCategory.findById(req.params.id);

  if (!subCategory) {
    res.status(404);
    throw new Error("Sub category not found");
  }

  await subCategory.deleteOne();

  res.status(200).json({
    success: true,
    message: "Sub category deleted successfully",
    id: req.params.id,
  });
});

module.exports = {
  createSubCategory,
  getSubCategories,
  getSubCategoryById,
  updateSubCategory,
  deleteSubCategory,
};