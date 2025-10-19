const db = require('../models');
const { Invoice, Subscription, SubscriptionPlan, Account, Vehicle } = db;

/**
 * Tạo hóa đơn từ subscription_id
 * Input: { subscription_id }
 * Output: Invoice record mới được tạo
 */
async function createInvoiceFromSubscription(req, res) {
  const { subscription_id } = req.body;

  console.log(`\n📄 === Creating Invoice from Subscription ===`);
  console.log(`Subscription ID: ${subscription_id}`);

  try {
    // Validate input
    if (!subscription_id) {
      return res.status(400).json({
        success: false,
        message: 'subscription_id is required'
      });
    }

    // Fetch subscription với tất cả associations
    console.log('🔍 Step 1: Fetching subscription details...');
    const subscription = await Subscription.findByPk(subscription_id, {
      include: [
        {
          model: SubscriptionPlan,
          as: 'plan',
          attributes: ['plan_id', 'plan_name', 'plan_fee', 'battery_cap']
        },
        {
          model: Account,
          as: 'driver',
          attributes: ['account_id', 'email', 'fullname']
        },
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['vehicle_id', 'license_plate']
        }
      ]
    });

    if (!subscription) {
      console.log('❌ Subscription not found');
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    console.log(`✅ Subscription found:`, {
      subscription_id: subscription.subscription_id,
      driver: subscription.driver?.fullname,
      plan: subscription.plan?.plan_name,
      start_date: subscription.start_date,
      end_date: subscription.end_date
    });

    // Kiểm tra invoice hiện tại của subscription
    console.log('🔍 Step 2: Checking for existing invoices...');
    const existingInvoices = await Invoice.findAll({
      where: { subscription_id: subscription_id },
      order: [['create_date', 'DESC']]
    });

    if (existingInvoices.length > 0) {
      console.log(`Found ${existingInvoices.length} existing invoice(s) for this subscription`);
      
      // Check từng invoice
      for (const invoice of existingInvoices) {
        // Nếu có invoice unpaid → Reject (phải thanh toán trước mới tạo được invoice mới)
        if (invoice.payment_status === 'unpaid') {
          console.log('⚠️ Found unpaid invoice - cannot create new invoice');
          console.log(`   - Invoice: ${invoice.invoice_number}`);
          console.log(`   - Status: ${invoice.payment_status}`);
          return res.status(409).json({
            success: false,
            message: 'Cannot create new invoice. Please pay the existing unpaid invoice first.',
            existing_invoice: {
              invoice_id: invoice.invoice_id,
              invoice_number: invoice.invoice_number,
              payment_status: invoice.payment_status,
              total_fee: invoice.total_fee,
              create_date: invoice.create_date
            }
          });
        }
        
        // Nếu có invoice paid, check due_date
        if (invoice.payment_status === 'paid') {
          const today = new Date();
          const dueDate = invoice.due_date ? new Date(invoice.due_date) : null;
          
          // Nếu due_date chưa qua (hoặc chưa có) → Reject
          if (!dueDate || dueDate >= today) {
            console.log('⚠️ Found paid invoice that has not expired yet');
            console.log(`   - Invoice: ${invoice.invoice_number}`);
            console.log(`   - Due date: ${invoice.due_date || 'Not set yet'}`);
            return res.status(409).json({
              success: false,
              message: 'Cannot create new invoice. Current paid invoice has not expired yet.',
              existing_invoice: {
                invoice_id: invoice.invoice_id,
                invoice_number: invoice.invoice_number,
                payment_status: invoice.payment_status,
                pay_date: invoice.pay_date,
                due_date: invoice.due_date
              }
            });
          }
          
          // Nếu due_date đã qua → OK, có thể tạo invoice mới
          console.log('✅ Previous paid invoice has expired, can create new invoice');
          console.log(`   - Expired invoice: ${invoice.invoice_number}`);
          console.log(`   - Due date: ${invoice.due_date}`);
        }
      }
    } else {
      console.log('✅ No existing invoices found - this is the first invoice');
    }

    // Generate invoice number (format: INV-YYYYMMDD-XXXXX)
    const timestamp = new Date();
    const dateStr = timestamp.toISOString().slice(0, 10).replace(/-/g, '');
    const randomNum = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    const invoice_number = `INV-${dateStr}-${randomNum}`;

    // create_date = ngày tạo
    const create_date = new Date();
    
    // pay_date và due_date = null (sẽ được cập nhật sau khi thanh toán)
    // due_date sẽ = pay_date + 1 tháng (update trong payment IPN handler)

    // Lấy total_fee từ subscription plan_fee
    const total_fee = subscription.plan?.plan_fee || 0;

    console.log('📝 Step 3: Creating invoice with data:');
    const invoiceData = {
      driver_id: subscription.driver_id,
      subscription_id: subscription.subscription_id,
      invoice_number: invoice_number,
      create_date: create_date,
      pay_date: null,  // Sẽ update khi payment success
      due_date: null,  // Sẽ update = pay_date + 1 tháng
      total_fee: total_fee,
      payment_status: 'unpaid'
    };
    console.log(JSON.stringify(invoiceData, null, 2));

    // Tạo invoice mới
    console.log('💾 Step 4: Saving invoice to database...');
    const newInvoice = await Invoice.create(invoiceData);

    console.log('✅ Invoice created successfully!');
    console.log(`   - invoice_id: ${newInvoice.invoice_id}`);
    console.log(`   - invoice_number: ${newInvoice.invoice_number}`);
    console.log(`   - total_fee: ${newInvoice.total_fee}`);

    // Fetch lại invoice với associations để trả về đầy đủ thông tin
    console.log('🔍 Step 5: Fetching complete invoice data...');
    const completeInvoice = await Invoice.findByPk(newInvoice.invoice_id, {
      include: [
        {
          model: Subscription,
          as: 'subscription',
          include: [
            {
              model: SubscriptionPlan,
              as: 'plan',
              attributes: ['plan_id', 'plan_name', 'plan_fee', 'battery_cap']
            },
            {
              model: Vehicle,
              as: 'vehicle',
              attributes: ['vehicle_id', 'license_plate']
            }
          ]
        },
        {
          model: Account,
          as: 'driver',
          attributes: ['account_id', 'email', 'fullname', 'phone_number']
        }
      ]
    });

    console.log('✅ === Invoice Creation Complete ===\n');

    // Trả về response cho FE
    return res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: {
        invoice_id: completeInvoice.invoice_id,
        invoice_number: completeInvoice.invoice_number,
        create_date: completeInvoice.create_date,
        due_date: completeInvoice.due_date,
        total_fee: completeInvoice.total_fee,
        payment_status: completeInvoice.payment_status,
        driver: {
          driver_id: completeInvoice.driver?.account_id,
          fullname: completeInvoice.driver?.fullname,
          email: completeInvoice.driver?.email,
          phone_number: completeInvoice.driver?.phone_number
        },
        subscription: {
          subscription_id: completeInvoice.subscription?.subscription_id,
          start_date: completeInvoice.subscription?.start_date,
          end_date: completeInvoice.subscription?.end_date,
          plan: {
            plan_id: completeInvoice.subscription?.plan?.plan_id,
            plan_name: completeInvoice.subscription?.plan?.plan_name,
            plan_fee: completeInvoice.subscription?.plan?.plan_fee,
            battery_cap: completeInvoice.subscription?.plan?.battery_cap,
         
          },
          vehicle: {
            vehicle_id: completeInvoice.subscription?.vehicle?.vehicle_id,
            license_plate: completeInvoice.subscription?.vehicle?.license_plate
          }
        }
      }
    });

  } catch (error) {
    console.error('\n❌ === Error Creating Invoice ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    if (error.name === 'SequelizeValidationError') {
      console.error('Validation errors:', error.errors.map(e => ({
        field: e.path,
        message: e.message,
        value: e.value
      })));
      
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
      console.error('Foreign key constraint error');
      return res.status(400).json({
        success: false,
        message: 'Foreign key constraint error - subscription or driver may not exist'
      });
    }

    if (error.name === 'SequelizeUniqueConstraintError') {
      console.error('Unique constraint error - invoice_number may already exist');
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
