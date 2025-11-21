// ========================================
// CONFIG CONTROLLER
// ========================================
// File: src/controllers/config.controller.js
// Purpose: Handle system configuration CRUD operations
// ========================================

const db = require('../models');
const routeConfig = require('../config/route.config');

/**
 * Get current system configuration
 */
const getConfig = async (req, res, next) => {
  try {
    // Get cached config (no database query)
    const config = routeConfig.getConfig();
    
    if (!config) {
      // If not loaded, load from database
      const loadedConfig = await routeConfig.loadConfig();
      return res.status(200).json({
        success: true,
        data: loadedConfig,
        message: 'Configuration loaded successfully'
      });
    }
    
    res.status(200).json({
      success: true,
      data: config,
      message: 'Configuration retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
};

const getConfigBookingInterval = async (req, res, next) => {
  try {
    // Get cached config (no database query)
    const config = routeConfig.getBookingExpiredInterval();    
    if (!config) {
      // If not loaded, load from database
      const loadedConfig = await routeConfig.loadConfig();
      return res.status(200).json({
        success: true,
        data: loadedConfig,
        message: 'Configuration booking expired interval loaded successfully'
      });
    }
    
    res.status(200).json({
      success: true,
      data: config,
      message: 'Configuration booking expired interval retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update system configuration
 */
const updateConfig = async (req, res, next) => {
  try {
    const { 
      booking_expired_interval,
      soh_available_threshole,
      soh_maintenance_threshole,
      allowed_empty_slot,
      soc_available_threshole
    } = req.body;
    
    // Validate input
    if (booking_expired_interval !== undefined) {
      if (typeof booking_expired_interval !== 'number' || booking_expired_interval < 1 || booking_expired_interval > 60) {
        return res.status(400).json({
          success: false,
          message: 'booking_expired_interval must be a positive number and at most 60'
        });
      }
    }

    if (soh_available_threshole !== undefined) {
      if (typeof soh_available_threshole !== 'number' || soh_available_threshole < 0 || soh_available_threshole > 100) {
        return res.status(400).json({
          success: false,
          message: 'soh_available_threshole must be a number between 0 and 100'
        });
      }
    }

    if (soh_maintenance_threshole !== undefined) {
      if (typeof soh_maintenance_threshole !== 'number' || soh_maintenance_threshole < 0 || soh_maintenance_threshole > 100) {
        return res.status(400).json({
          success: false,
          message: 'soh_maintenance_threshole must be a number between 0 and 100'
        });
      }
    }

    if (allowed_empty_slot !== undefined) {
      if (typeof allowed_empty_slot !== 'number' || allowed_empty_slot < 0 || allowed_empty_slot > 12) {
        return res.status(400).json({
          success: false,
          message: 'allowed_empty_slot must be a non-negative number and at most 12'
        });
      }
    }

    if (soc_available_threshole !== undefined) {
      if (typeof soc_available_threshole !== 'number' || soc_available_threshole < 0 || soc_available_threshole > 100) {
        return res.status(400).json({
          success: false,
          message: 'soc_available_threshole must be a number between 0 and 100'
        });
      }
    }
    
    // Get current config ID (should be 1, or first record)
    let configRecord = await db.Config.findOne();
    
    // Prepare update data - only include fields that are provided
    const updateData = {};
    if (booking_expired_interval !== undefined) updateData.booking_expired_interval = booking_expired_interval;
    if (soh_available_threshole !== undefined) updateData.soh_available_threshole = soh_available_threshole;
    if (soh_maintenance_threshole !== undefined) updateData.soh_maintenance_threshole = soh_maintenance_threshole;
    if (allowed_empty_slot !== undefined) updateData.allowed_empty_slot = allowed_empty_slot;
    if (soc_available_threshole !== undefined) updateData.soc_available_threshole = soc_available_threshole;

    // Check if any field is provided for update
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields provided for update'
      });
    }
    
    if (!configRecord) {
      // Create new config if not exists (with default values)
      configRecord = await db.Config.create({
        booking_expired_interval: booking_expired_interval || 30,
        soh_available_threshole: soh_available_threshole || 90,
        soh_maintenance_threshole: soh_maintenance_threshole || 70,
        allowed_empty_slot: allowed_empty_slot || 3,
        soc_available_threshole: soc_available_threshole || 90
      });
    } else {
      // Update existing config with only provided fields
      await configRecord.update(updateData);
    }
    
    // Reload config from database to update cache
    const updatedConfig = await routeConfig.updateConfig();
    
    res.status(200).json({
      success: true,
      data: updatedConfig,
      message: 'Configuration updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset configuration to default values
 */
const resetConfig = async (req, res, next) => {
  try {
    const configRecord = await db.Config.findOne();
    
    if (!configRecord) {
      return res.status(404).json({
        success: false,
        message: 'Configuration not found'
      });
    }
    
    // Reset to default values
    await configRecord.update({
      booking_expired_interval: 30,
      soh_available_threshole: 90,
      soh_maintenance_threshole: 70,
      allowed_empty_slot: 3,
      soc_available_threshole: 90
    });
    
    // Reload config from database
    const resetConfig = await routeConfig.updateConfig();
    
    res.status(200).json({
      success: true,
      data: resetConfig,
      message: 'Configuration reset to default values successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get specific config value
 */
const getConfigValue = async (req, res, next) => {
  try {
    const { key } = req.params;
    
    const config = routeConfig.getConfig();
    
    if (!config) {
      return res.status(500).json({
        success: false,
        message: 'Configuration not loaded'
      });
    }
    
    if (!(key in config)) {
      return res.status(404).json({
        success: false,
        message: `Configuration key '${key}' not found`
      });
    }
    
    res.status(200).json({
      success: true,
      key: key,
      value: config[key],
      message: 'Configuration value retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getConfig,
  updateConfig,
  resetConfig,
  getConfigValue,
  getConfigBookingInterval
};
