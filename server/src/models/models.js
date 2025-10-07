const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// Account Model
const Account = sequelize.define('Account', {
  accountId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: DataTypes.STRING,
  password_hash: DataTypes.STRING,
  fullName: DataTypes.STRING,
  phone_number: DataTypes.STRING,
  email: DataTypes.STRING,
  status: DataTypes.STRING
});

// SubscriptionPlan Model
const SubscriptionPlan = sequelize.define('SubscriptionPlan', {
  planId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  battery_limit: DataTypes.INTEGER,
  description: DataTypes.TEXT,
  is_active: DataTypes.BOOLEAN
});

// Admin Model
const Admin = sequelize.define('Admin', {
  adminId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  }
}, { timestamps: false });

// Staff Model
const Staff = sequelize.define('Staff', {
  staffId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  }
}, { timestamps: false });

// WarehouseManager Model
const WarehouseManager = sequelize.define('WarehouseManager', {
  managerId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  }
}, { timestamps: false });

// Driver Model
const Driver = sequelize.define('Driver', {
  driverId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  }
}, { timestamps: false });

// Vehicle Model
const Vehicle = sequelize.define('Vehicle', {
  vehicleId: DataTypes.INTEGER,
  license_plate: DataTypes.STRING,
  vin: DataTypes.STRING,
  name: DataTypes.STRING,
  brand: DataTypes.STRING,
  book: DataTypes.STRING
});

// Battery Model
const Battery = sequelize.define('Battery', {
  battery_serial: DataTypes.STRING,
  capacity: DataTypes.INTEGER,
  soc: DataTypes.FLOAT,
  soh: DataTypes.FLOAT,
  voltage: DataTypes.FLOAT,
  last_check: DataTypes.DATE
});

// BatteryType Model
const BatteryType = sequelize.define('BatteryType', {
  typeId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: DataTypes.STRING,
  weight: DataTypes.FLOAT
});

// SwapHistory Model
const SwapHistory = sequelize.define('SwapHistory', {
  swapId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  swap_time: DataTypes.DATE,
  total_battery: DataTypes.INTEGER
});

// Invoice Model
const Invoice = sequelize.define('Invoice', {
  invoiceId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  invoice_number: DataTypes.STRING,
  create_date: DataTypes.DATE,
  due_date: DataTypes.DATE,
  penalty_fee: DataTypes.FLOAT,
  total_fee: DataTypes.FLOAT
});

// Subscription Model
const Subscription = sequelize.define('Subscription', {
  subscriptionId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  start_date: DataTypes.DATE,
  end_date: DataTypes.DATE,
  status: DataTypes.STRING
});

// PaymentHistory Model
const PaymentHistory = sequelize.define('PaymentHistory', {
  paymentId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  transactionId: DataTypes.STRING,
  payment_date: DataTypes.DATE,
  payment_method: DataTypes.STRING,
  amount: DataTypes.FLOAT,
  status: DataTypes.STRING
});

// SupportTicket Model
const SupportTicket = sequelize.define('SupportTicket', {
  ticketId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  subject: DataTypes.STRING,
  description: DataTypes.TEXT,
  status: DataTypes.STRING,
  create_time: DataTypes.DATE,
  resolve_time: DataTypes.DATE
});

// Shift Model
const Shift = sequelize.define('Shift', {
  shiftId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  shift_date: DataTypes.DATE,
  start_time: DataTypes.TIME,
  end_time: DataTypes.TIME,
  status: DataTypes.STRING
});

// Station Model
const Station = sequelize.define('Station', {
  stationId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  station_name: DataTypes.STRING,
  address: DataTypes.STRING,
  latitude: DataTypes.FLOAT,
  longitude: DataTypes.FLOAT,
  status: DataTypes.STRING
});

// Dock Model
const Dock = sequelize.define('Dock', {
  dockId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  voltage_limit: DataTypes.FLOAT
});

// Compartment Model
const Compartment = sequelize.define('Compartment', {
  compartmentId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  compartment_num: DataTypes.INTEGER,
  total_slot: DataTypes.INTEGER,
  current: DataTypes.FLOAT,
  voltage: DataTypes.FLOAT,
  temperature: DataTypes.FLOAT,
  status: DataTypes.STRING
});

// Transfer Model
const Transfer = sequelize.define('Transfer', {
  transferId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  create_time: DataTypes.DATE,
  arrive_time: DataTypes.DATE,
  status: DataTypes.STRING,
  notes: DataTypes.TEXT
});

// Warehouse Model
const Warehouse = sequelize.define('Warehouse', {
  warehouseId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  warehouse_name: DataTypes.STRING,
  address: DataTypes.STRING,
  capacity: DataTypes.INTEGER,
  stock: DataTypes.INTEGER
});

// Relationships
Account.hasMany(SubscriptionPlan, { foreignKey: 'planId' });
SubscriptionPlan.belongsTo(Account, { foreignKey: 'accountId' });

Admin.hasMany(SupportTicket, { foreignKey: 'ticketId' });
SupportTicket.belongsTo(Admin, { foreignKey: 'adminId' });

Staff.hasMany(Shift, { foreignKey: 'shiftId' });
Shift.belongsTo(Staff, { foreignKey: 'staffId' });

WarehouseManager.hasMany(Transfer, { foreignKey: 'transferId' });
Transfer.belongsTo(WarehouseManager, { foreignKey: 'managerId' });

Driver.hasMany(Vehicle, { foreignKey: 'vehicleId' });
Vehicle.belongsTo(Driver, { foreignKey: 'driverId' });

Vehicle.hasMany(Battery, { foreignKey: 'battery_serial' });
Battery.belongsTo(Vehicle, { foreignKey: 'vehicleId' });

BatteryType.hasMany(Battery, { foreignKey: 'battery_serial' });
Battery.belongsTo(BatteryType, { foreignKey: 'typeId' });

SwapHistory.hasMany(Battery, { foreignKey: 'battery_serial' });
Battery.belongsTo(SwapHistory, { foreignKey: 'swapId' });

Invoice.hasMany(Subscription, { foreignKey: 'subscriptionId' });
Subscription.belongsTo(Invoice, { foreignKey: 'invoiceId' });

PaymentHistory.hasMany(Invoice, { foreignKey: 'invoiceId' });
Invoice.belongsTo(PaymentHistory, { foreignKey: 'paymentId' });

SupportTicket.hasMany(Admin, { foreignKey: 'adminId' });
Admin.belongsTo(SupportTicket, { foreignKey: 'ticketId' });

Station.hasMany(Dock, { foreignKey: 'dockId' });
Dock.belongsTo(Station, { foreignKey: 'stationId' });

Compartment.hasMany(Battery, { foreignKey: 'battery_serial' });
Battery.belongsTo(Compartment, { foreignKey: 'compartmentId' });

Transfer.hasMany(Warehouse, { foreignKey: 'warehouseId' });
Warehouse.belongsTo(Transfer, { foreignKey: 'transferId' });

module.exports = {
  Account,
  SubscriptionPlan,
  Admin,
  Staff,
  WarehouseManager,
  Driver,
  Vehicle,
  Battery,
  BatteryType,
  SwapHistory,
  Invoice,
  Subscription,
  PaymentHistory,
  SupportTicket,
  Shift,
  Station,
  Dock,
  Compartment,
  Transfer,
  Warehouse
};