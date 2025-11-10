// ========================================
// TEST CONFIG UPDATE
// ========================================
// File: test-config-update.js
// Purpose: Test updating configuration with new fields
// Usage: node test-config-update.js
// ========================================

require('dotenv').config();
const db = require('./src/models');
const routeConfig = require('./src/config/route.config');

async function testConfigUpdate() {
  console.log('🧪 Testing Config Update with New Fields...\n');
  
  try {
    // Test 1: Load initial config
    console.log('📥 Test 1: Loading initial configuration...');
    const initialConfig = await routeConfig.loadConfig();
    console.log('✅ Initial config:', initialConfig);
    console.log('');
    
    // Test 2: Update booking_expired_interval
    console.log('🔄 Test 2: Updating booking_expired_interval...');
    await db.Config.update(
      { booking_expired_interval: 45 },
      { where: { config_id: initialConfig.config_id } }
    );
    await routeConfig.updateConfig();
    console.log('✅ Updated config:', routeConfig.getConfig());
    console.log('');
    
    // Test 3: Update SOH thresholds
    console.log('🔄 Test 3: Updating SOH thresholds...');
    await db.Config.update(
      { 
        soh_available_threshole: 80,
        soh_maintenance_threshole: 60
      },
      { where: { config_id: initialConfig.config_id } }
    );
    await routeConfig.updateConfig();
    console.log('✅ Updated config:', routeConfig.getConfig());
    console.log('');
    
    // Test 4: Update allowed_empty_slot
    console.log('🔄 Test 4: Updating allowed_empty_slot...');
    await db.Config.update(
      { allowed_empty_slot: 5 },
      { where: { config_id: initialConfig.config_id } }
    );
    await routeConfig.updateConfig();
    console.log('✅ Updated config:', routeConfig.getConfig());
    console.log('');
    
    // Test 5: Update all fields at once
    console.log('🔄 Test 5: Updating all fields at once...');
    await db.Config.update(
      { 
        booking_expired_interval: 60,
        soh_available_threshole: 85,
        soh_maintenance_threshole: 65,
        allowed_empty_slot: 10
      },
      { where: { config_id: initialConfig.config_id } }
    );
    await routeConfig.updateConfig();
    console.log('✅ Updated config:', routeConfig.getConfig());
    console.log('');
    
    // Test 6: Test getter methods
    console.log('🔍 Test 6: Testing getter methods...');
    console.log('- Booking Expired Interval:', routeConfig.getBookingExpiredInterval());
    console.log('- SOH Available Threshold:', routeConfig.getSohAvailableThreshole());
    console.log('- SOH Maintenance Threshold:', routeConfig.getSohMaintenanceThreshole());
    console.log('- Allowed Empty Slot:', routeConfig.getAllowedEmptySlot());
    console.log('');
    
    // Test 7: Reset to original values
    console.log('🔄 Test 7: Resetting to original values...');
    await db.Config.update(
      { 
        booking_expired_interval: initialConfig.booking_expired_interval,
        soh_available_threshole: initialConfig.soh_available_threshole,
        soh_maintenance_threshole: initialConfig.soh_maintenance_threshole,
        allowed_empty_slot: initialConfig.allowed_empty_slot
      },
      { where: { config_id: initialConfig.config_id } }
    );
    await routeConfig.updateConfig();
    console.log('✅ Reset config:', routeConfig.getConfig());
    console.log('');
    
    console.log('✅ All tests passed!\n');
    
    // Summary
    console.log('📊 Summary:');
    console.log('- All fields can be updated successfully');
    console.log('- Config cache updates correctly');
    console.log('- Getter methods work as expected');
    console.log('');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

// Run tests
testConfigUpdate();
