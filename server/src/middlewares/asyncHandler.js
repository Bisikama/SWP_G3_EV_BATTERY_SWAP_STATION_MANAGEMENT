// ========================================
// ASYNC HANDLER
// ========================================
// File: src/middlewares/asyncHandler.js
// Mục đích: Wrapper để tự động catch lỗi cho async controllers
// ========================================

/**
 * Wrapper function để catch lỗi tự động cho async handlers
 * @param {Function} fn - Async function cần wrap
 * @returns {Function} - Wrapped function với error handling
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
