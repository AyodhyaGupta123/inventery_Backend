/**
 * Supplier Validator
 */

const common = require("./commonValidator");

const supplierValidator = {
  /**
   * Validate create supplier request
   */
  validateCreate: (data) => {
    const errors = {};

    // Required fields
    const requiredCheck = common.validateRequired(data, [
      "name",
      "email",
      "phone",
      "address",
    ]);
    Object.assign(errors, requiredCheck.errors);

    // Validate name length
    if (data.name) {
      const nameErrors = common.validateStringLength(data.name, "name", 3, 100);
      Object.assign(errors, nameErrors);
    }

    // Validate email
    if (data.email && !common.isValidEmail(data.email)) {
      errors.email = "Invalid email format";
    }

    // Validate phone
    if (data.phone && !common.isValidPhone(data.phone)) {
      errors.phone = "Invalid phone format";
    }

    // Validate address
    if (data.address) {
      const addressErrors = common.validateStringLength(data.address, "address", 5, 500);
      Object.assign(errors, addressErrors);
    }

    // Validate city if provided
    if (data.city) {
      const cityErrors = common.validateStringLength(data.city, "city", 2, 50);
      Object.assign(errors, cityErrors);
    }

    // Validate state if provided
    if (data.state) {
      const stateErrors = common.validateStringLength(data.state, "state", 2, 50);
      Object.assign(errors, stateErrors);
    }

    // Validate contact person if provided
    if (data.contactPerson) {
      const contactErrors = common.validateStringLength(
        data.contactPerson,
        "contactPerson",
        3,
        100
      );
      Object.assign(errors, contactErrors);
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },

  /**
   * Validate update supplier request
   */
  validateUpdate: (data) => {
    const errors = {};

    // Validate name if provided
    if (data.name) {
      const nameErrors = common.validateStringLength(data.name, "name", 3, 100);
      Object.assign(errors, nameErrors);
    }

    // Validate email if provided
    if (data.email && !common.isValidEmail(data.email)) {
      errors.email = "Invalid email format";
    }

    // Validate phone if provided
    if (data.phone && !common.isValidPhone(data.phone)) {
      errors.phone = "Invalid phone format";
    }

    // Validate address if provided
    if (data.address) {
      const addressErrors = common.validateStringLength(data.address, "address", 5, 500);
      Object.assign(errors, addressErrors);
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },
};

module.exports = supplierValidator;
