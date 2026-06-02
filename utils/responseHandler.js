/**
 * Standardized Response Handler
 * Ensures all API responses follow a consistent format
 */

const responseHandler = {
  /**
   * Send success response
   * @param {Object} res - Express response object
   * @param {*} data - Response data (optional)
   * @param {string} message - Success message (optional)
   * @param {number} statusCode - HTTP status code (default: 200)
   */
  success: (res, data = null, message = "Success", statusCode = 200) => {
    res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * Send error response
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code (default: 400)
   * @param {*} errors - Additional error details (optional)
   */
  error: (res, message = "Error", statusCode = 400, errors = null) => {
    res.status(statusCode).json({
      success: false,
      message,
      ...(errors && { errors }),
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * Send paginated list response
   * @param {Object} res - Express response object
   * @param {Array} data - Array of items
   * @param {number} page - Current page
   * @param {number} limit - Items per page
   * @param {number} total - Total items count
   * @param {string} message - Success message
   * @param {number} statusCode - HTTP status code
   */
  paginated: (
    res,
    data = [],
    page = 1,
    limit = 20,
    total = 0,
    message = "Success",
    statusCode = 200
  ) => {
    const pages = Math.ceil(total / limit);

    res.status(statusCode).json({
      success: true,
      message,
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages,
      },
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * Send validation error response
   * @param {Object} res - Express response object
   * @param {Object} errors - Field-level error details
   * @param {string} message - Error message
   */
  validationError: (res, errors = {}, message = "Validation failed") => {
    res.status(400).json({
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString(),
    });
  },
};

module.exports = responseHandler;
