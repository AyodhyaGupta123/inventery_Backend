/**
 * Product Validator
 */

const common = require("./commonValidator");

const productValidator = {
  /**
   * Validate create product request
   */
  validateCreate: (data) => {
    const errors = {};

    // Required fields
    const requiredCheck = common.validateRequired(data, [
      "name",
      "sku",
      "categoryId",
      "sellingPrice",
    ]);
    Object.assign(errors, requiredCheck.errors);

    // Validate name length
    if (data.name) {
      const nameErrors = common.validateStringLength(data.name, "name", 3, 100);
      Object.assign(errors, nameErrors);
    }

    // Validate SKU
    if (data.sku) {
      if (!common.isNonEmptyString(data.sku)) {
        errors.sku = "SKU is required";
      } else if (data.sku.length > 50) {
        errors.sku = "SKU must not exceed 50 characters";
      }
    }

    // Validate category is valid ObjectId
    if (data.categoryId && !common.isValidId(data.categoryId)) {
      errors.categoryId = "Invalid category ID";
    }

    // Validate selling price
    if (data.sellingPrice !== undefined) {
      if (!common.isPositiveNumber(data.sellingPrice)) {
        errors.sellingPrice = "Selling price must be a positive number";
      }
    }

    // Validate purchase price if provided
    if (data.purchasePrice !== undefined) {
      if (!common.isNonNegativeNumber(data.purchasePrice)) {
        errors.purchasePrice = "Purchase price must be a non-negative number";
      }
    }

    // Validate brand if provided
    if (data.brandId && !common.isValidId(data.brandId)) {
      errors.brandId = "Invalid brand ID";
    }

    // Validate sub-category if provided
    if (data.subCategoryId && !common.isValidId(data.subCategoryId)) {
      errors.subCategoryId = "Invalid sub-category ID";
    }

    // Validate reorder level if provided
    if (data.minStockLevel !== undefined) {
      if (!common.isNonNegativeNumber(data.minStockLevel)) {
        errors.minStockLevel = "Minimum stock level must be a non-negative number";
      }
    }

    // Validate MRP if provided
    if (data.mrp !== undefined) {
      if (!common.isNonNegativeNumber(data.mrp)) {
        errors.mrp = "MRP must be a non-negative number";
      }
    }

    // Validate opening stock if provided
    if (data.openingStock !== undefined) {
      if (!common.isNonNegativeNumber(data.openingStock)) {
        errors.openingStock = "Opening stock must be a non-negative number";
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },

  /**
   * Validate update product request
   */
  validateUpdate: (data) => {
    const errors = {};

    // Validate name if provided
    if (data.name) {
      const nameErrors = common.validateStringLength(data.name, "name", 3, 100);
      Object.assign(errors, nameErrors);
    }

    // Validate SKU if provided
    if (data.sku) {
      if (!common.isNonEmptyString(data.sku)) {
        errors.sku = "SKU must be a non-empty string";
      } else if (data.sku.length > 50) {
        errors.sku = "SKU must not exceed 50 characters";
      }
    }

    // Validate category if provided
    if (data.categoryId && !common.isValidId(data.categoryId)) {
      errors.categoryId = "Invalid category ID";
    }

    // Validate price if provided
    if (data.sellingPrice !== undefined) {
      if (!common.isPositiveNumber(data.sellingPrice)) {
        errors.sellingPrice = "Selling price must be a positive number";
      }
    }

    // Validate brand if provided
    if (data.brandId && !common.isValidId(data.brandId)) {
      errors.brandId = "Invalid brand ID";
    }

    // Validate sub-category if provided
    if (data.subCategoryId && !common.isValidId(data.subCategoryId)) {
      errors.subCategoryId = "Invalid sub-category ID";
    }

    // Validate stock levels if provided
    if (data.minStockLevel !== undefined) {
      if (!common.isNonNegativeNumber(data.minStockLevel)) {
        errors.minStockLevel = "Minimum stock level must be a non-negative number";
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },
};

module.exports = productValidator;
