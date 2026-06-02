/**
 * Purchase Order Validator
 */

const common = require("./commonValidator");

const purchaseOrderValidator = {
  /**
   * Validate create purchase order request
   */
  validateCreate: (data) => {
    const errors = {};

    // Required fields
    const requiredCheck = common.validateRequired(data, ["supplierId", "items"]);
    Object.assign(errors, requiredCheck.errors);

    // Validate supplierId is valid ObjectId
    if (data.supplierId && !common.isValidId(data.supplierId)) {
      errors.supplierId = "Invalid supplier ID";
    }

    // Validate items array
    if (data.items) {
      if (!common.isNonEmptyArray(data.items)) {
        errors.items = "Items must be a non-empty array";
      } else {
        const itemErrors = [];

        data.items.forEach((item, index) => {
          const itemError = {};

          if (!item.productId || !common.isValidId(item.productId)) {
            itemError.productId = "Invalid product ID";
          }

          if (!item.quantity || !common.isPositiveNumber(item.quantity)) {
            itemError.quantity = "Quantity must be a positive number";
          }

          if (!item.rate || !common.isPositiveNumber(item.rate)) {
            itemError.rate = "Rate must be a positive number";
          }

          if (Object.keys(itemError).length > 0) {
            itemErrors.push({ index, ...itemError });
          }
        });

        if (itemErrors.length > 0) {
          errors.items = itemErrors;
        }
      }
    }

    // Validate expected delivery date if provided
    if (data.expectedDeliveryDate) {
      if (isNaN(new Date(data.expectedDeliveryDate))) {
        errors.expectedDeliveryDate = "Invalid expected delivery date";
      } else if (new Date(data.expectedDeliveryDate) < new Date()) {
        errors.expectedDeliveryDate = "Expected delivery date must be in the future";
      }
    }

    // Validate notes if provided
    if (data.notes && typeof data.notes === "string" && data.notes.length > 1000) {
      errors.notes = "Notes must not exceed 1000 characters";
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },

  /**
   * Validate update purchase order request
   */
  validateUpdate: (data) => {
    const errors = {};

    // Validate supplierId if provided
    if (data.supplierId && !common.isValidId(data.supplierId)) {
      errors.supplierId = "Invalid supplier ID";
    }

    // Validate items if provided
    if (data.items) {
      if (!Array.isArray(data.items)) {
        errors.items = "Items must be an array";
      } else if (data.items.length > 0) {
        const itemErrors = [];

        data.items.forEach((item, index) => {
          const itemError = {};

          if (item.productId && !common.isValidId(item.productId)) {
            itemError.productId = "Invalid product ID";
          }

          if (item.quantity && !common.isPositiveNumber(item.quantity)) {
            itemError.quantity = "Quantity must be a positive number";
          }

          if (item.rate && !common.isPositiveNumber(item.rate)) {
            itemError.rate = "Rate must be a positive number";
          }

          if (Object.keys(itemError).length > 0) {
            itemErrors.push({ index, ...itemError });
          }
        });

        if (itemErrors.length > 0) {
          errors.items = itemErrors;
        }
      }
    }

    // Validate expected delivery date if provided
    if (data.expectedDeliveryDate) {
      if (isNaN(new Date(data.expectedDeliveryDate))) {
        errors.expectedDeliveryDate = "Invalid expected delivery date";
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },
};

module.exports = purchaseOrderValidator;
