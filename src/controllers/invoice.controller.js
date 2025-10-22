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
    const vehicle = await Vehicle.findByPk(vehicle_id, {
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
        sub_status: 'active'
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
          sub_status: existingActiveSubscription.sub_status
        }
      });
    }

    // Nếu xe KHÔNG CÓ subscription hoạt động → CHO PHÉP tạo hóa đơn
    // Generate invoice number (format: INV-YYYYMMDD-XXXXX)
    const timestamp = new Date();
    const dateStr = timestamp.toISOString().slice(0, 10).replace(/-/g, '');
    const randomNum = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    const invoice_number = `INV-${dateStr}-${randomNum}`;

    // Tạo invoice mới (không cần subscription_id vì subscription sẽ được tạo SAU khi thanh toán)
    const newInvoice = await Invoice.create({
      driver_id: vehicle.driver_id,
      invoice_number: invoice_number,
      create_date: new Date(),
      due_date: new Date(new Date().setDate(new Date().getDate() + 30)), // Hạn thanh toán = 1 tháng kể từ ngày tạo
      subscription_fee: parseInt(plan.plan_fee),
      penalty_fee: 0,
      swap_fee: 0,
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
          total_fee: completeInvoice.total_fee,
          payment_status: completeInvoice.payment_status,
          driver: {
            driver_id: completeInvoice.driver?.account_id,
            fullname: completeInvoice.driver?.fullname,
            email: completeInvoice.driver?.email,
            phone_number: completeInvoice.driver?.phone_number
          }
        },
        plan: {
          plan_id: plan.plan_id,
          plan_name: plan.plan_name,
          plan_fee: plan.plan_fee,
          battery_cap: plan.battery_cap,
          usage_cap: plan.usage_cap,
          description: plan.description
        },
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
              attributes: ['plan_id', 'plan_name', 'plan_fee', 'battery_cap']
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

module.exports = {
  createInvoiceFromSubscription,
  getAllInvoices,
  getInvoiceById
};
