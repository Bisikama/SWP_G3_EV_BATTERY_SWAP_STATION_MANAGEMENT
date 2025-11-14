const { where } = require('sequelize');
const db = require('../models');
const { Invoice, Subscription, SubscriptionPlan, Account, Vehicle } = db;

/**
 * Tạo hóa đơn mới từ vehicle_id và plan_id
 * Input: { vehicle_id, plan_id }
 * Output: Invoice record mới được tạo với status = 'unpaid'
 * 
 * Mỗi lần gọi API sẽ tạo 1 hóa đơn mới với invoice_id là khóa chính
 */
async function createInvoiceFromSubscription(req, res) {
  const { vehicle_id, plan_id } = req.body;
  
  try {
    // Validate input
    if (!vehicle_id || !plan_id) {
      return res.status(400).json({
        success: false,
        message: 'vehicle_id and plan_id are required'
      });
    }

    // Tìm thông tin vehicle
    const vehicle = await Vehicle.findByPk(vehicle_id,
       {
      include: [
        {
          model: Account,
          as: 'driver',
          attributes: ['account_id', 'email', 'fullname', 'phone_number']
        }
      ]
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Tìm thông tin subscription plan
    const plan = await SubscriptionPlan.findByPk(plan_id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found'
      });
    }

    // Kiểm tra xe có đang có subscription nào đang hoạt động không (bất kể plan nào)
    // Subscription đang hoạt động = end_date >= ngày hiện tại
    const existingActiveSubscription = await Subscription.findOne({
      where: {
        vehicle_id: vehicle_id,
        end_date: { [db.Sequelize.Op.gte]: new Date() }, // Còn hiệu lực
        status: 'active'
      },
      include: [
        {
          model: SubscriptionPlan,
          as: 'plan',
          attributes: ['plan_id', 'plan_name']
        }
      ]
    });

    // Nếu xe ĐANG CÓ subscription hoạt động → YÊU CẦU hủy trước khi tạo hóa đơn mới
    if (existingActiveSubscription) {
      return res.status(409).json({
        success: false,
        message: 'This vehicle currently has an active subscription. Please cancel the existing subscription before creating a new invoice.',
        existing_subscription: {
          subscription_id: existingActiveSubscription.subscription_id,
          plan_id: existingActiveSubscription.plan_id,
          plan_name: existingActiveSubscription.plan?.plan_name,
          start_date: existingActiveSubscription.start_date,
          end_date: existingActiveSubscription.end_date,
          status: existingActiveSubscription.status
        }
      });
    }

    // Nếu xe KHÔNG CÓ subscription hoạt động → CHO PHÉP tạo hóa đơn
    
    // ===== BƯỚC 1: Tính toán các loại phí =====
    console.log('\n💰 ========== CALCULATING INVOICE FEES ==========');
    
    // 1.1: subscription_fee (plan_fee) - Phí gói mới
    const subscription_fee = parseFloat(plan.plan_fee);
    console.log(`📋 Subscription Fee (from new plan ${plan.plan_name}): ${subscription_fee}`);

    // 1.2: Tìm subscription gần nhất của vehicle (đã hết hạn hoặc inactive)
    const previousSubscription = await Subscription.findOne({
      where: {
        vehicle_id: vehicle_id
      },
      include: [
        {
          model: SubscriptionPlan,
          as: 'plan',
          attributes: ['plan_id', 'plan_name', 'swap_fee']
        }
      ],
      order: [['end_date', 'DESC']], // Lấy subscription gần nhất
      limit: 1
    });

    let total_swap_fee = 0;

    if (previousSubscription) {
      console.log(`📦 Found previous subscription: ${previousSubscription.subscription_id}`);
      console.log(`   - Plan: ${previousSubscription.plan?.plan_name}`);
      console.log(`   - Period: ${previousSubscription.start_date} → ${previousSubscription.end_date}`);

      // 1.3: Đếm số lần đổi pin trong kỳ subscription trước
      const { SwapRecord } = require('../models');
      const swap_count = await SwapRecord.count({
        where: {
          vehicle_id: vehicle_id,
          swap_time: {
            [db.Sequelize.Op.between]: [
              new Date(previousSubscription.start_date),
              new Date(previousSubscription.end_date)
            ]
          }
        }
      });
      console.log(`   - Swap Count: ${swap_count} times`);

      // 1.4: Tính total_swap_fee = swap_count × swap_fee của gói cũ
      const swap_fee_per_swap = parseFloat(previousSubscription.plan?.swap_fee || 0);
      total_swap_fee = swap_count * swap_fee_per_swap;
      console.log(`🔄 Total Swap Fee: ${swap_count} × ${swap_fee_per_swap} = ${total_swap_fee}`);

      
    } else {
      console.log('📦 No previous subscription found → No swap fee & penalty fee');
    }

    // 1.6: Tính tổng total_fee
    const total_fee = subscription_fee + total_swap_fee;
    console.log(`\n💵 TOTAL FEE BREAKDOWN:`);
    console.log(`   - Subscription Fee: ${subscription_fee}`);
    console.log(`   - Total Swap Fee: ${total_swap_fee}`);
    console.log(`   - TOTAL: ${total_fee}`);
    console.log('✅ ========== FEE CALCULATION COMPLETED ==========\n');

    // ===== BƯỚC 2: Tạo Invoice =====
    // Generate invoice number (format: INV-YYYYMMDD-XXXXX)
    const timestamp = new Date();
    const dateStr = timestamp.toISOString().slice(0, 10).replace(/-/g, '');
    const randomNum = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    const invoice_number = `INV-${dateStr}-${randomNum}`;

    // Tạo invoice mới với các phí đã tính toán
    const newInvoice = await Invoice.create({
      driver_id: vehicle.driver_id,
      invoice_number: invoice_number,
      create_date: new Date(),
      due_date: null, // due_date = null, sẽ được set khi thanh toán (pay_date + 1 tháng)
      pay_date: null, // Chưa thanh toán
      plan_fee: subscription_fee,
      total_swap_fee: total_swap_fee,
      total_fee: total_fee,
      payment_status: 'unpaid'
    });

    // Fetch lại invoice với đầy đủ thông tin để trả về
    const completeInvoice = await Invoice.findByPk(newInvoice.invoice_id, {
      include: [
        {
          model: Account,
          as: 'driver',
          attributes: ['account_id', 'email', 'fullname', 'phone_number']
        }
      ]
    });

    // Trả về response với thông tin hóa đơn, gói và xe
    return res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: {
        invoice: {
          invoice_id: completeInvoice.invoice_id,
          invoice_number: completeInvoice.invoice_number,
          create_date: completeInvoice.create_date,
          pay_date: completeInvoice.pay_date,
          due_date: completeInvoice.due_date,
          plan_fee: completeInvoice.plan_fee,
          total_swap_fee: completeInvoice.total_swap_fee,
          total_fee: completeInvoice.total_fee,
          payment_status: completeInvoice.payment_status,
          driver: {
            driver_id: completeInvoice.driver?.account_id,
            fullname: completeInvoice.driver?.fullname,
            email: completeInvoice.driver?.email,
            phone_number: completeInvoice.driver?.phone_number
          }
        },
        new_plan: {
          plan_id: plan.plan_id,
          plan_name: plan.plan_name,
          plan_fee: plan.plan_fee,
          swap_fee: plan.swap_fee,
          description: plan.description,
        },
        previous_subscription: previousSubscription ? {
          subscription_id: previousSubscription.subscription_id,
          plan_name: previousSubscription.plan?.plan_name,
          start_date: previousSubscription.start_date,
          end_date: previousSubscription.end_date
        } : null,
        vehicle: {
          vehicle_id: vehicle.vehicle_id,
          license_plate: vehicle.license_plate,
          color: vehicle.color,
          model_id: vehicle.model_id
        }
      }
    });

  } catch (error) {
    console.error('Error creating invoice:', error);

    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors.map(e => ({
          field: e.path,
          message: e.message
        }))
      });
    }

    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Foreign key constraint error'
      });
    }

    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        message: 'Invoice number already exists'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}

/**
 * Lấy danh sách tất cả invoices (optional - để test)
 */
async function getAllInvoices(req, res) {
  try {
    const invoices = await Invoice.findAll({
      include: [
        {
          model: Account,
          as: 'driver',
          attributes: ['account_id', 'fullname', 'email']
        },
        {
          model: Subscription,
          as: 'subscription',
          include: [
            {
              model: SubscriptionPlan,
              as: 'plan',
              attributes: ['plan_id', 'plan_name', 'plan_fee', 'swap_fee', 'description'],
              where: {
                is_active: true
              }
            }
          ]
        }
      ],
      order: [['create_date', 'DESC']]
    });

    return res.status(200).json({
      success: true,
      message: 'Invoices retrieved successfully',
      data: invoices,
      total: invoices.length
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}

/**
 * Lấy invoice theo ID
 */
async function getInvoiceById(req, res) {
  const { invoice_id } = req.params;

  try {
    const invoice = await Invoice.findByPk(invoice_id, {
      include: [
        {
          model: Account,
          as: 'driver',
          attributes: ['account_id', 'fullname', 'email', 'phone_number']
        },
        {
          model: Subscription,
          as: 'subscription',
          include: [
            {
              model: SubscriptionPlan,
              as: 'plan'
            },
            {
              model: Vehicle,
              as: 'vehicle'
            }
          ]
        }
      ]
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Invoice retrieved successfully',
      data: invoice
    });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}

/**
 * Lấy lịch sử thanh toán theo vehicle_id
 * GET /api/invoices/payment-history/:vehicle_id
 * Chỉ hiển thị invoice có status = 'paid'
 * Liên kết thông tin từ 4 bảng: Vehicle, Subscription, Invoice, PaymentRecord
 */
async function getPaymentHistoryByVehicle(req, res) {
  try {
    const { vehicle_id } = req.params;

    if (!vehicle_id) {
      return res.status(400).json({
        success: false,
        message: 'vehicle_id is required'
      });
    }

    console.log(`\n🔍 ========== FETCHING PAYMENT HISTORY ==========`);
    console.log(`Vehicle ID: ${vehicle_id}`);

    // Kiểm tra vehicle có tồn tại không
    const vehicle = await Vehicle.findByPk(vehicle_id, {
      attributes: ['vehicle_id', 'license_plate', 'model_id', 'driver_id'],
      include: [
        {
          model: db.VehicleModel,
          as: 'model',
          attributes: ['model_id', 'name', 'battery_type_id', 'battery_slot']
        },
        {
          model: Account,
          as: 'driver',
          attributes: ['account_id', 'email', 'fullname', 'phone_number']
        }
      ]
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    console.log(`✅ Vehicle found: ${vehicle.license_plate}`);

    // Lấy tất cả subscription của vehicle
    const subscriptions = await Subscription.findAll({
      where: {
        vehicle_id: vehicle_id
      },
      include: [
        {
          model: SubscriptionPlan,
          as: 'plan',
          attributes: ['plan_id', 'plan_name', 'plan_fee', 'duration_days']
        },
        {
          model: Invoice,
          as: 'invoice',
          where: {
            payment_status: 'paid' // Chỉ lấy invoice đã thanh toán
          },
          required: true, // INNER JOIN - chỉ lấy subscription có invoice paid
          include: [
            {
              model: db.PaymentRecord,
              as: 'payments',
              attributes: [
                'payment_id',
                'invoice_id',
                'payment_method',
                'amount',
                'payment_date',
                'transaction_num',
                'status'
              ]
            }
          ]
        }
      ],
      order: [
        [{ model: Invoice, as: 'invoice' }, 'create_date', 'DESC'],
        [{ model: Invoice, as: 'invoice' }, { model: db.PaymentRecord, as: 'payments' }, 'payment_date', 'DESC']
      ]
    });

    console.log(`✅ Found ${subscriptions.length} subscriptions with paid invoices`);

    // Tính tổng số tiền đã thanh toán
    const totalAmountPaid = subscriptions.reduce((sum, sub) => {
      const invoiceAmount = parseFloat(sub.invoice?.plan_fee || 0) + 
                            parseFloat(sub.invoice?.total_swap_fee || 0);
      return sum + invoiceAmount;
    }, 0);

    // Format dữ liệu response
    const paymentHistory = subscriptions.map(sub => {
      const invoice = sub.invoice;
      const totalAmount = parseFloat(invoice.plan_fee || 0) + 
                         parseFloat(invoice.total_swap_fee || 0);

      return {
        invoice_id: invoice.invoice_id,
        invoice_number: invoice.invoice_number,
        create_date: invoice.create_date,
        plan_fee: parseFloat(invoice.plan_fee),
        total_swap_fee: parseFloat(invoice.total_swap_fee),
        total_amount: totalAmount,
        payment_status: invoice.payment_status,
        
        // Subscription info
        subscription: {
          subscription_id: sub.subscription_id,
          plan_name: sub.plan?.plan_name,
          plan_fee: parseFloat(sub.plan?.plan_fee || 0),
          duration_days: sub.plan?.duration_days,
          start_date: sub.start_date,
          end_date: sub.end_date,
          subscription_status: sub.status,
          swap_count: sub.swap_count
        },
        
        // Payment records
        payment_records: invoice.payments.map(payment => ({
          payment_id: payment.payment_id,
          payment_method: payment.payment_method,
          amount: parseFloat(payment.amount),
          payment_date: payment.payment_date,
          transaction_num: payment.transaction_num,
          payment_status: payment.status
        }))
      };
    });

    console.log(`✅ ========== PAYMENT HISTORY FETCHED ==========\n`);

    return res.status(200).json({
      success: true,
      message: 'Payment history retrieved successfully',
      data: {
        vehicle: {
          vehicle_id: vehicle.vehicle_id,
          license_plate: vehicle.license_plate,
          model_name: vehicle.model?.name,
          battery_type_id: vehicle.model?.battery_type_id,
          battery_slot: vehicle.model?.battery_slot,
          driver: {
            account_id: vehicle.driver?.account_id,
            fullname: vehicle.driver?.fullname,
            email: vehicle.driver?.email,
            phone_number: vehicle.driver?.phone_number
          }
        },
        summary: {
          total_paid_invoices: subscriptions.length,
          total_amount_paid: totalAmountPaid
        },
        payment_history: paymentHistory
      }
    });

  } catch (error) {
    console.error('❌ Error fetching payment history:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}

/**
 * Lấy lịch sử thanh toán của tất cả xe theo driver_id
 * GET /api/invoices/payment-history/driver/:driver_id
 * Chỉ hiển thị invoice có status = 'paid'
 * Liên kết thông tin từ 4 bảng: Account, Vehicle, Subscription, Invoice, PaymentRecord
 */
async function getPaymentHistoryByDriver(req, res) {
  try {
    const { driver_id } = req.params;

    if (!driver_id) {
      return res.status(400).json({
        success: false,
        message: 'driver_id is required'
      });
    }

    console.log(`\n🔍 ========== FETCHING PAYMENT HISTORY FOR DRIVER ==========`);
    console.log(`Driver ID: ${driver_id}`);

    // Kiểm tra driver có tồn tại không
    const driver = await Account.findByPk(driver_id, {
      attributes: ['account_id', 'email', 'fullname', 'phone_number', 'role']
    });

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    if (driver.role !== 'driver') {
      return res.status(403).json({
        success: false,
        message: 'Account is not a driver'
      });
    }

    console.log(`✅ Driver found: ${driver.fullname}`);

    // Lấy tất cả vehicle của driver
    const vehicles = await Vehicle.findAll({
      where: {
        driver_id: driver_id,
        status: 'active'
      },
      attributes: ['vehicle_id', 'license_plate', 'model_id'],
      include: [
        {
          model: db.VehicleModel,
          as: 'model',
          attributes: ['model_id', 'name', 'battery_type_id', 'battery_slot']
        }
      ]
    });

    if (vehicles.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No vehicles found for this driver',
        data: {
          driver: {
            account_id: driver.account_id,
            fullname: driver.fullname,
            email: driver.email,
            phone_number: driver.phone_number
          },
          total_vehicles: 0,
          summary: {
            total_paid_invoices: 0,
            total_amount_paid: 0
          },
          vehicles_payment_history: []
        }
      });
    }

    console.log(`✅ Found ${vehicles.length} vehicles for driver`);

    // Lấy vehicle_ids
    const vehicleIds = vehicles.map(v => v.vehicle_id);

    // Lấy tất cả subscription của các vehicles
    const subscriptions = await Subscription.findAll({
      where: {
        vehicle_id: vehicleIds,
        status: 'active'
      },
      include: [
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['vehicle_id', 'license_plate', 'model_id'],
          include: [
            {
              model: db.VehicleModel,
              as: 'model',
              attributes: ['model_id', 'name', 'battery_type_id', 'battery_slot']
            }
          ]
        },
        {
          model: SubscriptionPlan,
          as: 'plan',
          attributes: ['plan_id', 'plan_name', 'plan_fee', 'duration_days']
        },
        {
          model: Invoice,
          as: 'invoice',
          where: {
            payment_status: 'paid' // Chỉ lấy invoice đã thanh toán
          },
          required: true, // INNER JOIN - chỉ lấy subscription có invoice paid
          include: [
            {
              model: db.PaymentRecord,
              as: 'payments',
              attributes: [
                'payment_id',
                'invoice_id',
                'payment_method',
                'amount',
                'payment_date',
                'transaction_num',
                'status'
              ]
            }
          ]
        }
      ],
      order: [
        [{ model: Invoice, as: 'invoice' }, 'create_date', 'DESC'],
        [{ model: Invoice, as: 'invoice' }, { model: db.PaymentRecord, as: 'payments' }, 'payment_date', 'DESC']
      ]
    });

    console.log(`✅ Found ${subscriptions.length} subscriptions with paid invoices`);

    // Tính tổng số tiền đã thanh toán
    let totalAmountPaid = 0;
    const vehiclesPaymentMap = new Map();

    // Nhóm subscriptions theo vehicle
    subscriptions.forEach(sub => {
      const invoice = sub.invoice;
      const invoiceAmount = parseFloat(invoice.plan_fee || 0) + 
                            parseFloat(invoice.total_swap_fee || 0);
      
      totalAmountPaid += invoiceAmount;

      const vehicleId = sub.vehicle_id;
      if (!vehiclesPaymentMap.has(vehicleId)) {
        vehiclesPaymentMap.set(vehicleId, {
          vehicle: sub.vehicle,
          subscriptions: [],
          vehicle_total_paid: 0
        });
      }

      const vehicleData = vehiclesPaymentMap.get(vehicleId);
      vehicleData.subscriptions.push(sub);
      vehicleData.vehicle_total_paid += invoiceAmount;
    });

    // Format dữ liệu response
    const vehiclesPaymentHistory = Array.from(vehiclesPaymentMap.values()).map(vehicleData => {
      const paymentHistory = vehicleData.subscriptions.map(sub => {
        const invoice = sub.invoice;
        const totalAmount = parseFloat(invoice.plan_fee || 0) + 
                           parseFloat(invoice.total_swap_fee || 0);

        return {
          invoice_id: invoice.invoice_id,
          invoice_number: invoice.invoice_number,
          create_date: invoice.create_date,
          plan_fee: parseFloat(invoice.plan_fee),
          total_swap_fee: parseFloat(invoice.total_swap_fee),
          total_amount: totalAmount,
          payment_status: invoice.payment_status,
          
          // Subscription info
          subscription: {
            subscription_id: sub.subscription_id,
            plan_name: sub.plan?.plan_name,
            plan_fee: parseFloat(sub.plan?.plan_fee || 0),
            duration_days: sub.plan?.duration_days,
            start_date: sub.start_date,
            end_date: sub.end_date,
            subscription_status: sub.status,
            swap_count: sub.swap_count
          },
          
          // Payment records
          payment_records: invoice.payments.map(payment => ({
            payment_id: payment.payment_id,
            payment_method: payment.payment_method,
            amount: parseFloat(payment.amount),
            payment_date: payment.payment_date,
            transaction_num: payment.transaction_num,
            payment_status: payment.status
          }))
        };
      });

      return {
        vehicle: {
          vehicle_id: vehicleData.vehicle.vehicle_id,
          license_plate: vehicleData.vehicle.license_plate,
          model_name: vehicleData.vehicle.model?.name,
          battery_type_id: vehicleData.vehicle.model?.battery_type_id,
          battery_slot: vehicleData.vehicle.model?.battery_slot
        },
        vehicle_summary: {
          total_paid_invoices: vehicleData.subscriptions.length,
          total_amount_paid: vehicleData.vehicle_total_paid
        },
        payment_history: paymentHistory
      };
    });

    console.log(`✅ ========== PAYMENT HISTORY FOR DRIVER FETCHED ==========\n`);

    return res.status(200).json({
      success: true,
      message: 'Payment history for all vehicles retrieved successfully',
      data: {
        driver: {
          account_id: driver.account_id,
          fullname: driver.fullname,
          email: driver.email,
          phone_number: driver.phone_number
        },
        total_vehicles: vehicles.length,
        summary: {
          total_paid_invoices: subscriptions.length,
          total_amount_paid: totalAmountPaid
        },
        vehicles_payment_history: vehiclesPaymentHistory
      }
    });

  } catch (error) {
    console.error('❌ Error fetching payment history for driver:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}

module.exports = {
  createInvoiceFromSubscription,
  getAllInvoices,
  getInvoiceById,
  getPaymentHistoryByVehicle,
  getPaymentHistoryByDriver
};
