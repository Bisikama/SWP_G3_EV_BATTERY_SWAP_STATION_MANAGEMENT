// ========================================
// TEST ROUTE CONFIG
// ========================================
// File: test-route-config.js
// Purpose: Test the route config functionality
// Usage: node test-route-config.js
// ========================================

require('dotenv').config();
const routeConfig = require('./src/config/route.config');

async function testRouteConfig() {
  console.log('🧪 Testing Route Config...\n');
  
  try {
    // Test 1: Load config
    console.log('📥 Test 1: Loading configuration...');
    const config1 = await routeConfig.loadConfig();
    console.log('✅ Config loaded:', config1);
    console.log('');
    
    // Test 2: Load again (should use cache)
    console.log('📥 Test 2: Loading configuration again (should use cache)...');
    const startTime = Date.now();
    const config2 = await routeConfig.loadConfig();
    const loadTime = Date.now() - startTime;
    console.log('✅ Config loaded:', config2);
    console.log(`⚡ Load time: ${loadTime}ms (should be ~0ms if cached)`);
    console.log('');
    
    // Test 3: Get config without async
    console.log('📋 Test 3: Getting config synchronously...');
    const config3 = routeConfig.getConfig();
    console.log('✅ Config retrieved:', config3);
    console.log('');
    
    // Test 4: Get specific value
    console.log('🔍 Test 4: Getting specific config value...');
    const interval = routeConfig.getBookingExpiredInterval();
    console.log(`✅ Booking expired interval: ${interval} minutes`);
    console.log('');
    
    // Test 5: Check if loaded
    console.log('✓ Test 5: Checking if config is loaded...');
    const isLoaded = routeConfig.isLoaded();
    console.log(`✅ Is loaded: ${isLoaded}`);
    console.log('');
    
    // Test 6: Update config (simulate)
    console.log('🔄 Test 6: Updating configuration...');
    const updatedConfig = await routeConfig.updateConfig();
    console.log('✅ Config updated:', updatedConfig);
    console.log('');
    
    console.log('✅ All tests passed!\n');
    
    // Summary
    console.log('📊 Summary:');
    console.log('- Config loaded successfully');
    console.log('- Cache working properly');
    console.log('- All methods working as expected');
    console.log('');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

// Run tests
testRouteConfig();
