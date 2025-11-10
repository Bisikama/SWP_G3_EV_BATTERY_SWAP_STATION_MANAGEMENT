// ========================================
// ROUTE CONFIG
// ========================================
// File: src/config/route.config.js
// Purpose: Singleton class to load and cache system configuration from database
// 
// Features:
// - Load configuration from database only once
// - Cache configuration data in memory
// - Provide update method to reload from database
// - Thread-safe loading with isLoading flag
// ========================================

'use strict';

const db = require('../models');

class RouteConfig {
  constructor() {
    if (RouteConfig.instance) {
      return RouteConfig.instance;
    }
    
    this.configData = null;
    this.isLoading = false;
    RouteConfig.instance = this;
  }

  /**
   * Load configuration from database (only once if already loaded)
   * @returns {Promise<Object>} Configuration data
   */
  async loadConfig() {
    // Nếu đã có config, trả về luôn
    if (this.configData) {
      return this.configData;
    }

    // Nếu đang loading, đợi loading xong
    if (this.isLoading) {
      await this.waitForLoading();
      return this.configData;
    }

    this.isLoading = true;

    try {
      // Lấy config đầu tiên trong bảng (hoặc tất cả nếu có nhiều record)
      const configRecord = await db.Config.findOne({
        attributes: [ 'config_name', 'booking_expired_interval','soh_available_threshole', 'soh_maintenance_threshole','allowed_empty_slot'],
        raw: true
      });

      if (!configRecord) {
        console.warn('⚠️  No configuration found in database. Using default values.');
        // Tạo config mặc định nếu chưa có trong database
        this.configData = {
          config_name: null,
          booking_expired_interval: 30,
          soh_available_threshole: null,
          soh_maintenance_threshole: null,
          allowed_empty_slot: null
        };
      } else {
        this.configData = configRecord;
        console.log('✅ Route configuration loaded successfully:', this.configData);
      }

      return this.configData;
    } catch (error) {
      console.error('❌ Error loading route configuration:', error);
      throw new Error('Failed to load route configuration from database');
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Update configuration by reloading from database
   * @returns {Promise<Object>} Updated configuration data
   */
  async updateConfig() {
    console.log('🔄 Updating route configuration...');
    this.configData = null; // Reset cache
    return await this.loadConfig();
  }

  /**
   * Get current configuration without querying database
   * @returns {Object|null} Current configuration data or null if not loaded
   */
  getConfig() {
    return this.configData;
  }

  /**
   * Get specific configuration value by key
   * @param {string} key - Configuration key
   * @returns {*} Configuration value or undefined
   */
  getConfigValue(key) {
    if (!this.configData) {
      console.warn('⚠️  Configuration not loaded yet. Call loadConfig() first.');
      return undefined;
    }
    return this.configData[key];
  }

  /**
   * Get booking expired interval in minutes
   * @returns {number} Booking expired interval
   */
  getBookingExpiredInterval() {
    return this.getConfigValue('booking_expired_interval') || 30;
  }

  getSohAvailableThreshole() {
    return this.getConfigValue('soh_available_threshole');
  }

  getSohMaintenanceThreshole() {
    return this.getConfigValue('soh_maintenance_threshole');
  }

  getAllowedEmptySlot() {
    return this.getConfigValue('allowed_empty_slot');
  }

  /**
   * Helper function to wait for loading to complete
   * @private
   */
  async waitForLoading() {
    const maxWaitTime = 10000; // 10 seconds max
    const startTime = Date.now();
    
    while (this.isLoading) {
      if (Date.now() - startTime > maxWaitTime) {
        throw new Error('Timeout waiting for configuration to load');
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * Check if configuration is loaded
   * @returns {boolean} True if configuration is loaded
   */
  isLoaded() {
    return this.configData !== null;
  }
}

// Export singleton instance
const routeConfigInstance = new RouteConfig();

module.exports = routeConfigInstance;
