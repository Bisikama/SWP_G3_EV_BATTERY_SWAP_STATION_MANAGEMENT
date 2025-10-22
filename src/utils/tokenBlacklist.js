'use strict';

// Simple in-memory token blacklist for dev/testing.
// For production use Redis or another persistent store.
const tokenBlacklist = new Set();

function add(token) {
  tokenBlacklist.add(token);
}

function has(token) {
  return tokenBlacklist.has(token);
}

module.exports = { add, has, _set: tokenBlacklist };
