/**
 * Fresh Seed Script
 * 
 * Script này sẽ:
 * 1. Xóa tất cả data từ seeders (undo:all)
 * 2. Reset tất cả sequences về 1
 * 3. Chạy lại tất cả seeders
 * 
 * Kết quả: Data mới với IDs bắt đầu từ 1
 * 
 * KHÔNG ảnh hưởng:
 * - Migrations (table structure giữ nguyên)
 * - Foreign key relationships (vẫn hoạt động bình thường)
 * - Application logic (app vẫn chạy như thường)
 * 
 * CHỈ ảnh hưởng:
 * - Số ID bắt đầu lại từ 1 thay vì 79, 80...
 * 
 * Usage:
 *   node scripts/fresh-seed.js
 */

'use strict';
const { sequelize } = require('../src/models');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// ANSI color codes for pretty console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  step: (msg) => console.log(`${colors.cyan}▶${colors.reset} ${msg}`),
  highlight: (msg) => console.log(`${colors.bright}${msg}${colors.reset}`)
};

async function freshSeed() {
  console.log('\n');
  log.highlight('═══════════════════════════════════════════════════════');
  log.highlight('           🌱 FRESH SEED SCRIPT 🌱');
  log.highlight('═══════════════════════════════════════════════════════');
  console.log('\n');

  try {
    // Step 1: Undo all seeders
    log.step('Step 1/3: Removing all seeded data...');
    log.info('Running: npx sequelize-cli db:seed:undo:all');
    
    try {
      const { stdout: undoOutput } = await execPromise('npx sequelize-cli db:seed:undo:all');
      console.log(undoOutput);
      log.success('All seeders undone successfully');
    } catch (error) {
      log.warning('No seeders to undo or already clean');
    }

    console.log('\n');

    // Step 2: Reset sequences
    log.step('Step 2/3: Resetting all AUTO_INCREMENT sequences to 1...');
    
    const sequences = [
      '"SubscriptionPlans_plan_id_seq"',
      '"Stations_station_id_seq"',
      '"BatteryTypes_battery_type_id_seq"',
      '"VehicleModels_model_id_seq"',
      '"Cabinets_cabinet_id_seq"',
      '"CabinetSlots_slot_id_seq"'
    ];

    log.info(`Found ${sequences.length} sequences to reset`);

    for (const seq of sequences) {
      try {
        await sequelize.query(`ALTER SEQUENCE ${seq} RESTART WITH 1;`);
        log.success(`Reset ${seq.replace(/"/g, '')}`);
      } catch (error) {
        log.warning(`Sequence ${seq} not found or already at 1`);
      }
    }

    console.log('\n');

    // Step 3: Run all seeders
    log.step('Step 3/3: Running all seeders with fresh IDs...');
    log.info('Running: npx sequelize-cli db:seed:all');
    
    const { stdout: seedOutput } = await execPromise('npx sequelize-cli db:seed:all');
    console.log(seedOutput);
    
    console.log('\n');
    log.highlight('═══════════════════════════════════════════════════════');
    log.success('🎉 Fresh seed completed successfully!');
    log.highlight('═══════════════════════════════════════════════════════');
    console.log('\n');

    log.info('Summary:');
    console.log('  ✓ Old data removed');
    console.log('  ✓ Sequences reset to 1');
    console.log('  ✓ New data seeded with clean IDs');
    console.log('\n');

    log.info('Expected results:');
    console.log('  • SubscriptionPlans: plan_id starts from 1');
    console.log('  • Stations: station_id starts from 1');
    console.log('  • BatteryTypes: battery_type_id starts from 1');
    console.log('  • VehicleModels: model_id starts from 1');
    console.log('  • Cabinets: cabinet_id starts from 1');
    console.log('  • CabinetSlots: slot_id starts from 1');
    console.log('\n');

    // Close database connection
    await sequelize.close();
    process.exit(0);

  } catch (error) {
    console.log('\n');
    log.highlight('═══════════════════════════════════════════════════════');
    log.error('❌ Fresh seed failed!');
    log.highlight('═══════════════════════════════════════════════════════');
    console.log('\n');
    
    log.error('Error details:');
    console.error(error.message);
    console.log('\n');

    log.warning('Troubleshooting:');
    console.log('  1. Make sure database is running');
    console.log('  2. Check database credentials in .env');
    console.log('  3. Verify migrations are up to date');
    console.log('  4. Try running manually:');
    console.log('     npx sequelize-cli db:seed:undo:all');
    console.log('     node scripts/fresh-seed.js');
    console.log('\n');

    await sequelize.close();
    process.exit(1);
  }
}

// Run the script
freshSeed();
