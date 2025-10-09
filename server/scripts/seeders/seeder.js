// seeders/01-accounts.js
'use strict';
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

module.exports = {
  async up(queryInterface, Sequelize) {
    const hashedPassword = await bcrypt.hash('123', 10);
    
    const accounts = [
      // Admins
      {
        account_id: uuidv4(),
        username: 'admin_john',
        password_hash: hashedPassword,
        fullname: 'John Admin',
        phone_number: '+84901234567',
        email: 'john.admin@evswap.com',
        status: 'active',
        permission: 'admin'
      },
      {
        account_id: uuidv4(),
        username: 'admin_sarah',
        password_hash: hashedPassword,
        fullname: 'Sarah Administrator',
        phone_number: '+84901234568',
        email: 'sarah.admin@evswap.com',
        status: 'active',
        permission: 'admin'
      },
      
      // Warehouse Managers
      {
        account_id: uuidv4(),
        username: 'manager_mike',
        password_hash: hashedPassword,
        fullname: 'Mike Manager',
        phone_number: '+84901234569',
        email: 'mike.manager@evswap.com',
        status: 'active',
        permission: 'manager'
      },
      {
        account_id: uuidv4(),
        username: 'manager_lisa',
        password_hash: hashedPassword,
        fullname: 'Lisa Warehouse',
        phone_number: '+84901234570',
        email: 'lisa.manager@evswap.com',
        status: 'active',
        permission: 'manager'
      },
      
      // Staff
      {
        account_id: uuidv4(),
        username: 'staff_tom',
        password_hash: hashedPassword,
        fullname: 'Tom Staff',
        phone_number: '+84901234571',
        email: 'tom.staff@evswap.com',
        status: 'active',
        permission: 'staff'
      },
      {
        account_id: uuidv4(),
        username: 'staff_anna',
        password_hash: hashedPassword,
        fullname: 'Anna Technician',
        phone_number: '+84901234572',
        email: 'anna.staff@evswap.com',
        status: 'active',
        permission: 'staff'
      },
      {
        account_id: uuidv4(),
        username: 'staff_kevin',
        password_hash: hashedPassword,
        fullname: 'Kevin Support',
        phone_number: '+84901234573',
        email: 'kevin.staff@evswap.com',
        status: 'active',
        permission: 'staff'
      },
      
      // Drivers
      {
        account_id: uuidv4(),
        username: 'driver_nguyen',
        password_hash: hashedPassword,
        fullname: 'Nguyen Van A',
        phone_number: '+84912345678',
        email: 'nguyen.driver@gmail.com',
        status: 'active',
        permission: 'driver'
      },
      {
        account_id: uuidv4(),
        username: 'driver_tran',
        password_hash: hashedPassword,
        fullname: 'Tran Thi B',
        phone_number: '+84912345679',
        email: 'tran.driver@gmail.com',
        status: 'active',
        permission: 'driver'
      },
      {
        account_id: uuidv4(),
        username: 'driver_le',
        password_hash: hashedPassword,
        fullname: 'Le Van C',
        phone_number: '+84912345680',
        email: 'le.driver@gmail.com',
        status: 'active',
        permission: 'driver'
      },
      {
        account_id: uuidv4(),
        username: 'driver_pham',
        password_hash: hashedPassword,
        fullname: 'Pham Thi D',
        phone_number: '+84912345681',
        email: 'pham.driver@gmail.com',
        status: 'active',
        permission: 'driver'
      },
      {
        account_id: uuidv4(),
        username: 'driver_hoang',
        password_hash: hashedPassword,
        fullname: 'Hoang Van E',
        phone_number: '+84912345682',
        email: 'hoang.driver@gmail.com',
        status: 'active',
        permission: 'driver'
      },
      {
        account_id: uuidv4(),
        username: 'driver_vu',
        password_hash: hashedPassword,
        fullname: 'Vu Thi F',
        phone_number: '+84912345683',
        email: 'vu.driver@gmail.com',
        status: 'active',
        permission: 'driver'
      },
      {
        account_id: uuidv4(),
        username: 'driver_do',
        password_hash: hashedPassword,
        fullname: 'Do Van G',
        phone_number: '+84912345684',
        email: 'do.driver@gmail.com',
        status: 'active',
        permission: 'driver'
      },
      {
        account_id: uuidv4(),
        username: 'driver_ngo',
        password_hash: hashedPassword,
        fullname: 'Ngo Thi H',
        phone_number: '+84912345685',
        email: 'ngo.driver@gmail.com',
        status: 'active',
        permission: 'driver'
      }
    ];

    await queryInterface.bulkInsert('Accounts', accounts);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Accounts', null, {});
  }
};

// seeders/02-battery-types.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('BatteryTypes', [
      {
        battery_type_id: 1,
        battery_type_name: 'Li-ion NMC 75kWh',
        nominal_capacity: 75.00,
        nominal_voltage: 400.00,
        energy_capacity_wh: 75000.00,
        rated_power: 150.00,
        cell_chemistry: 'Li-ion',
        weight: 480.00
      },
      {
        battery_type_id: 2,
        battery_type_name: 'LFP 60kWh Standard',
        nominal_capacity: 60.00,
        nominal_voltage: 355.00,
        energy_capacity_wh: 60000.00,
        rated_power: 120.00,
        cell_chemistry: 'LFP',
        weight: 420.00
      },
      {
        battery_type_id: 3,
        battery_type_name: 'Li-ion NMC 50kWh',
        nominal_capacity: 50.00,
        nominal_voltage: 360.00,
        energy_capacity_wh: 50000.00,
        rated_power: 100.00,
        cell_chemistry: 'Li-ion',
        weight: 350.00
      },
      {
        battery_type_id: 4,
        battery_type_name: 'LFP 40kWh Compact',
        nominal_capacity: 40.00,
        nominal_voltage: 320.00,
        energy_capacity_wh: 40000.00,
        rated_power: 80.00,
        cell_chemistry: 'LFP',
        weight: 300.00
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('BatteryTypes', null, {});
  }
};

// seeders/03-vehicle-models.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('VehicleModels', [
      {
        model_id: 1,
        battery_type_id: 1,
        name: 'Model 3',
        brand: 'Tesla',
        avg_energy_usage: 15.50
      },
      {
        model_id: 2,
        battery_type_id: 2,
        name: 'Model Y',
        brand: 'Tesla',
        avg_energy_usage: 17.20
      },
      {
        model_id: 3,
        battery_type_id: 3,
        name: 'Leaf',
        brand: 'Nissan',
        avg_energy_usage: 16.80
      },
      {
        model_id: 4,
        battery_type_id: 2,
        name: 'ID.4',
        brand: 'Volkswagen',
        avg_energy_usage: 18.00
      },
      {
        model_id: 5,
        battery_type_id: 4,
        name: 'e-Golf',
        brand: 'Volkswagen',
        avg_energy_usage: 14.50
      },
      {
        model_id: 6,
        battery_type_id: 1,
        name: 'Kona Electric',
        brand: 'Hyundai',
        avg_energy_usage: 15.00
      },
      {
        model_id: 7,
        battery_type_id: 3,
        name: 'VF8',
        brand: 'VinFast',
        avg_energy_usage: 16.50
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('VehicleModels', null, {});
  }
};

// seeders/04-stations.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Stations', [
      {
        station_id: 1,
        station_name: 'District 1 Central Station',
        address: '123 Nguyen Hue, District 1, HCMC',
        latitude: 10.7769,
        longitude: 106.7009,
        status: 'operational'
      },
      {
        station_id: 2,
        station_name: 'District 3 Tech Hub',
        address: '456 Vo Van Tan, District 3, HCMC',
        latitude: 10.7829,
        longitude: 106.6922,
        status: 'operational'
      },
      {
        station_id: 3,
        station_name: 'Binh Thanh Station',
        address: '789 Xo Viet Nghe Tinh, Binh Thanh, HCMC',
        latitude: 10.8142,
        longitude: 106.7054,
        status: 'operational'
      },
      {
        station_id: 4,
        station_name: 'Thu Duc Service Center',
        address: '321 Vo Van Ngan, Thu Duc, HCMC',
        latitude: 10.8505,
        longitude: 106.7717,
        status: 'operational'
      },
      {
        station_id: 5,
        station_name: 'Tan Binh Airport Station',
        address: '147 Hoang Van Thu, Tan Binh, HCMC',
        latitude: 10.8124,
        longitude: 106.6657,
        status: 'maintenance'
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Stations', null, {});
  }
};

// seeders/05-warehouses.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Get manager accounts
    const managers = await queryInterface.sequelize.query(
      `SELECT account_id FROM Accounts WHERE permission = 'manager' LIMIT 2`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    await queryInterface.bulkInsert('Warehouses', [
      {
        warehouse_id: 1,
        manager_id: managers[0].account_id,
        warehouse_name: 'Central Battery Warehouse',
        address: '999 Nguyen Van Linh, District 7, HCMC',
        capacity: 500,
        stock: 320
      },
      {
        warehouse_id: 2,
        manager_id: managers[1].account_id,
        warehouse_name: 'North Battery Depot',
        address: '555 Pham Van Dong, Thu Duc, HCMC',
        capacity: 300,
        stock: 180
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Warehouses', null, {});
  }
};

// seeders/06-subscription-plans.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const admins = await queryInterface.sequelize.query(
      `SELECT account_id FROM Accounts WHERE permission = 'admin' LIMIT 1`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    await queryInterface.bulkInsert('SubscriptionPlans', [
      {
        plan_id: 1,
        admin_id: admins[0].account_id,
        plan_name: 'Basic Plan',
        plan_fee: 500000.00,
        battery_cap: 20,
        description: '20 battery swaps per month - Perfect for occasional users',
        is_active: true
      },
      {
        plan_id: 2,
        admin_id: admins[0].account_id,
        plan_name: 'Standard Plan',
        plan_fee: 900000.00,
        battery_cap: 40,
        description: '40 battery swaps per month - Great for regular commuters',
        is_active: true
      },
      {
        plan_id: 3,
        admin_id: admins[0].account_id,
        plan_name: 'Premium Plan',
        plan_fee: 1500000.00,
        battery_cap: 80,
        description: '80 battery swaps per month - Unlimited convenience for daily drivers',
        is_active: true
      },
      {
        plan_id: 4,
        admin_id: admins[0].account_id,
        plan_name: 'Enterprise Plan',
        plan_fee: 2500000.00,
        battery_cap: 150,
        description: '150 battery swaps per month - For fleet operators',
        is_active: true
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('SubscriptionPlans', null, {});
  }
};

// seeders/07-vehicles.js
'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    const drivers = await queryInterface.sequelize.query(
      `SELECT account_id FROM Accounts WHERE permission = 'driver'`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const vehicles = [
      {
        vehicle_id: uuidv4(),
        driver_id: drivers[0].account_id,
        model_id: 1,
        license_plate: '51A-12345',
        vin: '5YJ3E1EA1KF000001'
      },
      {
        vehicle_id: uuidv4(),
        driver_id: drivers[1].account_id,
        model_id: 3,
        license_plate: '51B-67890',
        vin: '1N4AZ1CP0KC000002'
      },
      {
        vehicle_id: uuidv4(),
        driver_id: drivers[2].account_id,
        model_id: 2,
        license_plate: '51C-11111',
        vin: '5YJ3E1EB2KF000003'
      },
      {
        vehicle_id: uuidv4(),
        driver_id: drivers[3].account_id,
        model_id: 4,
        license_plate: '51D-22222',
        vin: 'WVGBV7AX0MW000004'
      },
      {
        vehicle_id: uuidv4(),
        driver_id: drivers[4].account_id,
        model_id: 6,
        license_plate: '51E-33333',
        vin: 'KM8K53AG0LU000005'
      },
      {
        vehicle_id: uuidv4(),
        driver_id: drivers[5].account_id,
        model_id: 7,
        license_plate: '51F-44444',
        vin: 'LVVDB1DK5NP000006'
      },
      {
        vehicle_id: uuidv4(),
        driver_id: drivers[6].account_id,
        model_id: 1,
        license_plate: '51G-55555',
        vin: '5YJ3E1EA3KF000007'
      },
      {
        vehicle_id: uuidv4(),
        driver_id: drivers[7].account_id,
        model_id: 5,
        license_plate: '51H-66666',
        vin: 'WVWKP7AU9GW000008'
      }
    ];

    await queryInterface.bulkInsert('Vehicles', vehicles);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Vehicles', null, {});
  }
};

// seeders/08-subscriptions.js
'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    const drivers = await queryInterface.sequelize.query(
      `SELECT account_id FROM Accounts WHERE permission = 'driver'`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const vehicles = await queryInterface.sequelize.query(
      `SELECT vehicle_id, driver_id FROM Vehicles`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const subscriptions = vehicles.map((vehicle, index) => ({
      subscription_id: uuidv4(),
      driver_id: vehicle.driver_id,
      vehicle_id: vehicle.vehicle_id,
      plan_id: (index % 4) + 1, // Distribute across 4 plans
      start_date: new Date('2024-10-01'),
      end_date: new Date('2024-12-31'),
      status: 'in-use'
    }));

    await queryInterface.bulkInsert('Subscriptions', subscriptions);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Subscriptions', null, {});
  }
};

// seeders/09-invoices.js
'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    const subscriptions = await queryInterface.sequelize.query(
      `SELECT s.subscription_id, s.driver_id, sp.plan_fee 
       FROM Subscriptions s 
       JOIN SubscriptionPlans sp ON s.plan_id = sp.plan_id`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const invoices = subscriptions.map((sub, index) => ({
      invoice_id: uuidv4(),
      driver_id: sub.driver_id,
      subscription_id: sub.subscription_id,
      invoice_number: `INV-2024-10-${String(index + 1).padStart(4, '0')}`,
      create_date: new Date('2024-10-01'),
      due_date: new Date('2024-10-15'),
      total_fee: sub.plan_fee
    }));

    await queryInterface.bulkInsert('Invoices', invoices);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Invoices', null, {});
  }
};

// seeders/10-payment-records.js
'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    const invoices = await queryInterface.sequelize.query(
      `SELECT invoice_id, total_fee FROM Invoices`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const paymentMethods = ['credit_card', 'bank_transfer', 'e-wallet', 'momo', 'zalopay'];
    
    const payments = invoices.map((invoice, index) => ({
      payment_id: uuidv4(),
      invoice_id: invoice.invoice_id,
      transaction_num: `TXN-${Date.now()}-${index}`,
      payment_date: new Date('2024-10-05'),
      payment_method: paymentMethods[index % paymentMethods.length],
      amount: invoice.total_fee,
      status: index % 10 === 0 ? 'fail' : 'success' // 10% failure rate
    }));

    await queryInterface.bulkInsert('PaymentRecords', payments);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('PaymentRecords', null, {});
  }
};

// seeders/11-cabinets.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const cabinets = [];
    
    // Station 1: 3 cabinets
    for (let i = 1; i <= 3; i++) {
      cabinets.push({
        cabinet_id: cabinets.length + 1,
        station_id: 1,
        cabinet_name: `Cabinet A${i}`,
        capacity: 10,
        power_capacity_kw: 150.00,
        status: 'operational'
      });
    }

    // Station 2: 2 cabinets
    for (let i = 1; i <= 2; i++) {
      cabinets.push({
        cabinet_id: cabinets.length + 1,
        station_id: 2,
        cabinet_name: `Cabinet B${i}`,
        capacity: 8,
        power_capacity_kw: 120.00,
        status: 'operational'
      });
    }

    // Station 3: 2 cabinets
    for (let i = 1; i <= 2; i++) {
      cabinets.push({
        cabinet_id: cabinets.length + 1,
        station_id: 3,
        cabinet_name: `Cabinet C${i}`,
        capacity: 12,
        power_capacity_kw: 180.00,
        status: 'operational'
      });
    }

    // Station 4: 2 cabinets
    for (let i = 1; i <= 2; i++) {
      cabinets.push({
        cabinet_id: cabinets.length + 1,
        station_id: 4,
        cabinet_name: `Cabinet D${i}`,
        capacity: 10,
        power_capacity_kw: 150.00,
        status: 'operational'
      });
    }

    // Station 5: 1 cabinet (maintenance)
    cabinets.push({
      cabinet_id: cabinets.length + 1,
      station_id: 5,
      cabinet_name: `Cabinet E1`,
      capacity: 8,
      power_capacity_kw: 120.00,
      status: 'maintenance'
    });

    await queryInterface.bulkInsert('Cabinets', cabinets);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Cabinets', null, {});
  }
};

// seeders/12-cabinet-slots.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const cabinets = await queryInterface.sequelize.query(
      `SELECT cabinet_id, capacity FROM Cabinets`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const slots = [];
    const statuses = ['empty', 'charging', 'charged', 'faulty'];
    
    cabinets.forEach(cabinet => {
      for (let i = 1; i <= cabinet.capacity; i++) {
        const statusIndex = Math.floor(Math.random() * 100);
        let status;
        if (statusIndex < 20) status = 'empty';
        else if (statusIndex < 40) status = 'charging';
        else if (statusIndex < 95) status = 'charged';
        else status = 'faulty';

        slots.push({
          slot_id: slots.length + 1,
          cabinet_id: cabinet.cabinet_id,
          slot_number: `S${String(i).padStart(2, '0')}`,
          voltage: 400.00 + (Math.random() * 10 - 5), // 395-405V
          current: 150.00 + (Math.random() * 20 - 10), // 140-160A
          status: status
        });
      }
    });

    await queryInterface.bulkInsert('CabinetSlots', slots);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('CabinetSlots', null, {});
  }
};

// seeders/13-batteries.js
'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    const vehicles = await queryInterface.sequelize.query(
      `SELECT vehicle_id FROM Vehicles`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const chargedSlots = await queryInterface.sequelize.query(
      `SELECT slot_id FROM CabinetSlots WHERE status IN ('charged', 'charging')`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const warehouses = await queryInterface.sequelize.query(
      `SELECT warehouse_id FROM Warehouses`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const batteries = [];

    // Batteries in vehicles (one per vehicle)
    vehicles.forEach((vehicle, index) => {
      batteries.push({
        battery_id: uuidv4(),
        vehicle_id: vehicle.vehicle_id,
        warehouse_id: null,
        slot_id: null,
        battery_serial: `BAT-VEH-${String(index + 1).padStart(4, '0')}`,
        current_soc: 15.00 + Math.random() * 70, // 15-85%
        current_soh: 85.00 + Math.random() * 15 // 85-100%
      });
    });

    // Batteries in cabinet slots
    chargedSlots.slice(0, 50).forEach((slot, index) => {
      batteries.push({
        battery_id: uuidv4(),
        vehicle_id: null,
        warehouse_id: null,
        slot_id: slot.slot_id,
        battery_serial: `BAT-SLT-${String(index + 1).padStart(4, '0')}`,
        current_soc: 80.00 + Math.random() * 20, // 80-100%
        current_soh: 88.00 + Math.random() * 12 // 88-100%
      });
    });

    // Batteries in warehouses
    for (let i = 0; i < 30; i++) {
      batteries.push({
        battery_id: uuidv4(),
        vehicle_id: null,
        warehouse_id: warehouses[i % warehouses.length].warehouse_id,
        slot_id: null,
        battery_serial: `BAT-WRH-${String(i + 1).padStart(4, '0')}`,
        current_soc: 95.00 + Math.random() * 5, // 95-100%
        current_soh: 92.00 + Math.random() * 8 // 92-100%
      });
    }

    await queryInterface.bulkInsert('Batteries', batteries);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Batteries', null, {});
  }
};

// seeders/14-shifts.js
'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    const admins = await queryInterface.sequelize.query(
      `SELECT account_id FROM Accounts WHERE permission = 'admin'`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const staff = await queryInterface.sequelize.query(
      `SELECT account_id FROM Accounts WHERE permission = 'staff'`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const stations = await queryInterface.sequelize.query(
      `SELECT station_id FROM Stations WHERE status = 'operational'`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const shifts = [];
    const today = new Date();
    
    // Create shifts for next 7 days
    for (let day = 0; day < 7; day++) {
      const shiftDate = new Date(today);
      shiftDate.setDate(today.getDate() + day);

      stations.forEach((station, stationIndex) => {
        // Morning shift: 6 AM - 2 PM
        shifts.push({
          shift_id: uuidv4(),
          admin_id: admins[0].account_id,
          staff_id: staff[stationIndex % staff.length].account_id,
          station_id: station.station_id,
          start_time: new Date(shiftDate.setHours(6, 0, 0)),
          end_time: new Date(shiftDate.setHours(14, 0, 0)),
          status: day === 0 ? 'confirmed' : 'assigned'
        });

        // Afternoon shift: 2 PM - 10 PM
        shifts.push({
          shift_id: uuidv4(),
          admin_id: admins[0].account_id,
          staff_id: staff[(stationIndex + 1) % staff.length].account_id,
          station_id: station.station_id,
          start_time: new Date(shiftDate.setHours(14, 0, 0)),
          end_time: new Date(