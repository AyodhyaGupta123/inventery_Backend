/**
 * Order (Sales) Validator
 */

const common = require("./commonValidator");

const orderValidator = {
  /**
   * Validate create order request
   */
  validateCreate: (data) => {
    const errors = {};

    // Required fields
    const requiredCheck = common.validateRequired(data, ["warehouseId", "items"]);
    Object.assign(errors, requiredCheck.errors);

    // Validate warehouseId is valid ObjectId
    if (data.warehouseId && !common.isValidId(data.warehouseId)) {
      errors.warehouseId = "Invalid warehouse ID";
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

          if (item.unitPrice && !common.isPositiveNumber(item.unitPrice)) {
            itemError.unitPrice = "Unit price must be a positive number";
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

    // Validate customer name if provided
    if (data.customerName) {
      const nameErrors = common.validateStringLength(data.customerName, "customerName", 3, 100);
      Object.assign(errors, nameErrors);
    }

    // Validate customer phone if provided
    if (data.customerPhone && !common.isValidPhone(data.customerPhone)) {
      errors.customerPhone = "Invalid customer phone format";
    }

    // Validate customer email if provided
    if (data.customerEmail && !common.isValidEmail(data.customerEmail)) {
      errors.customerEmail = "Invalid customer email format";
    }

    // Validate delivery address if provided
    if (data.deliveryAddress) {
      const addressErrors = common.validateStringLength(
        data.deliveryAddress,
        "deliveryAddress",
        5,
        500
      );
      Object.assign(errors, addressErrors);
    }

    // Validate discount if provided
    if (data.discount !== undefined) {
      if (!common.isNonNegativeNumber(data.discount)) {
        errors.discount = "Discount must be a non-negative number";
      } else if (data.discount > 100) {
        errors.discount = "Discount cannot exceed 100%";
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
   * Validate update order request
   */
  validateUpdate: (data) => {
    const errors = {};

    // Validate warehouseId if provided
    if (data.warehouseId && !common.isValidId(data.warehouseId)) {
      errors.warehouseId = "Invalid warehouse ID";
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

          if (Object.keys(itemError).length > 0) {
            itemErrors.push({ index, ...itemError });
          }
        });

        if (itemErrors.length > 0) {
          errors.items = itemErrors;
        }
      }
    }

    // Validate status if provided
    if (data.status) {
      const validStatuses = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
      const statusErrors = common.validateEnum(data.status, "status", validStatuses);
      Object.assign(errors, statusErrors);
    }

    // Validate discount if provided
    if (data.discount !== undefined) {
      if (!common.isNonNegativeNumber(data.discount)) {
        errors.discount = "Discount must be a non-negative number";
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },
};

module.exports = orderValidator;
