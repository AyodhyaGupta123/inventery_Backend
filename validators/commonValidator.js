/**
 * Common Validators
 * Shared validation logic across all validators
 */

const mongoose = require("mongoose");

const validators = {
  /**
   * Validate MongoDB ObjectId
   */
  isValidId: (id) => {
    return mongoose.Types.ObjectId.isValid(id);
  },

  /**
   * Validate email format
   */
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Validate phone number (basic)
   */
  isValidPhone: (phone) => {
    const phoneRegex = /^[\d\s\-\+\(\)]{10,15}$/;
    return phoneRegex.test(phone);
  },

  /**
   * Validate string is not empty after trim
   */
  isNonEmptyString: (str) => {
    return typeof str === "string" && str.trim().length > 0;
  },

  /**
   * Validate number is positive
   */
  isPositiveNumber: (num) => {
    const number = parseFloat(num);
    return !isNaN(number) && number > 0;
  },

  /**
   * Validate number is non-negative
   */
  isNonNegativeNumber: (num) => {
    const number = parseFloat(num);
    return !isNaN(number) && number >= 0;
  },

  /**
   * Validate array is not empty
   */
  isNonEmptyArray: (arr) => {
    return Array.isArray(arr) && arr.length > 0;
  },

  /**
   * Validate pagination params
   * Accepts either (page, limit) or a single `query` object (e.g., req.query)
   */
  validatePagination: (pageOrQuery, limit) => {
    const errors = {};

    let pageVal;
    let limitVal;

    // Support being passed req.query object
    if (pageOrQuery && typeof pageOrQuery === "object" && !Array.isArray(pageOrQuery)) {
      pageVal = pageOrQuery.page;
      limitVal = pageOrQuery.limit;
    } else {
      pageVal = pageOrQuery;
      limitVal = limit;
    }

    const p = Number.isFinite(Number(pageVal)) && pageVal !== undefined && pageVal !== null ? parseInt(pageVal) : 1;
    const l = Number.isFinite(Number(limitVal)) && limitVal !== undefined && limitVal !== null ? parseInt(limitVal) : 20;

    if (p < 1) errors.page = "Page must be >= 1";
    if (l < 1 || l > 100) errors.limit = "Limit must be between 1 and 100";

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      page: p,
      limit: l,
    };
  },

  /**
   * Validate date range
   */
  validateDateRange: (fromDate, toDate) => {
    const errors = {};

    if (fromDate && isNaN(new Date(fromDate))) {
      errors.fromDate = "Invalid from date";
    }

    if (toDate && isNaN(new Date(toDate))) {
      errors.toDate = "Invalid to date";
    }

    if (fromDate && toDate) {
      if (new Date(fromDate) > new Date(toDate)) {
        errors.dateRange = "From date must be before to date";
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },

  /**
   * Validate required fields
   */
  validateRequired: (data, requiredFields) => {
    const errors = {};

    requiredFields.forEach((field) => {
      if (!data[field] || (typeof data[field] === "string" && !data[field].trim())) {
        errors[field] = `${field} is required`;
      }
    });

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },

  /**
   * Validate field length
   */
  validateStringLength: (value, fieldName, minLength, maxLength) => {
    const errors = {};

    if (value && typeof value === "string") {
      const len = value.trim().length;

      if (minLength && len < minLength) {
        errors[fieldName] = `${fieldName} must be at least ${minLength} characters`;
      }

      if (maxLength && len > maxLength) {
        errors[fieldName] = `${fieldName} must not exceed ${maxLength} characters`;
      }
    }

    return errors;
  },

  /**
   * Validate enum values
   */
  validateEnum: (value, fieldName, allowedValues) => {
    const errors = {};

    if (value && !allowedValues.includes(value)) {
      errors[fieldName] = `${fieldName} must be one of: ${allowedValues.join(", ")}`;
    }

    return errors;
  },
};

module.exports = validators;
