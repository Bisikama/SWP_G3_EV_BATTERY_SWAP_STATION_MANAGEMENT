// src/middlewares/validateVin.js
'use strict';

/**
 * VIN Validation Middleware
 * Validates Vehicle Identification Number (17 characters)
 * Format: Alphanumeric, no I, O, Q characters
 */
function validateVin(req, res, next) {
  const { vin } = req.body || {};

  // Check if VIN exists
  if (!vin) {
    return res.status(400).json({ message: 'VIN is required' });
  }

  // Normalize VIN: uppercase and trim
  const normalizedVin = vin.toString().toUpperCase().trim();

  // Check length (must be exactly 17 characters)
  if (normalizedVin.length !== 17) {
    return res.status(400).json({ 
      message: 'VIN must be exactly 17 characters',
      received: normalizedVin.length 
    });
  }

  // Check format: only alphanumeric, no I, O, Q
  const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/;
  if (!vinRegex.test(normalizedVin)) {
    return res.status(400).json({ 
      message: 'Invalid VIN format. VIN must contain only letters (A-Z, excluding I, O, Q) and numbers (0-9)',
      hint: 'VIN cannot contain I, O, or Q characters'
    });
  }

  // Validate check digit (optional - standard VIN validation)
  if (!isValidVinCheckDigit(normalizedVin)) {
    return res.status(400).json({ 
      message: 'Invalid VIN check digit. Please verify the VIN number.',
      vin: normalizedVin
    });
  }

  // Attach normalized VIN to request
  req.body.vin = normalizedVin;
  
  next();
}

/**
 * Validate VIN check digit (9th character)
 * Based on ISO 3779 standard
 */
function isValidVinCheckDigit(vin) {
  const transliteration = {
    A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8,
    J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9,
    S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9,
    0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9
  };

  const weights = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];
  
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    const char = vin[i];
    const value = transliteration[char];
    
    if (value === undefined) {
      return false; // Invalid character
    }
    
    sum += value * weights[i];
  }

  const checkDigit = sum % 11;
  const expectedChar = checkDigit === 10 ? 'X' : checkDigit.toString();
  
  return vin[8] === expectedChar;
}

module.exports = validateVin;
