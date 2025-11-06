const db = require('./src/models');

async function checkInvoices() {
  try {
    // Check total invoices
    const total = await db.Invoice.count();
    console.log('Total invoices:', total);

    // Check by payment status
    const paid = await db.Invoice.count({ where: { payment_status: 'paid' } });
    const unpaid = await db.Invoice.count({ where: { payment_status: 'unpaid' } });
    
    console.log('Paid invoices:', paid);
    console.log('Unpaid invoices:', unpaid);

    // Check date range
    const invoices = await db.Invoice.findAll({
      attributes: ['create_date', 'payment_status', 'plan_fee', 'total_swap_fee', 'total_penalty_fee'],
      limit: 5
    });
    
    console.log('\nSample invoices:');
    invoices.forEach(inv => {
      console.log(JSON.stringify(inv.toJSON(), null, 2));
    });

    // Test revenue calculation
    const { fn, col, literal } = require('sequelize');
    const revenue = await db.Invoice.findOne({
      attributes: [
        [fn('SUM', literal('"plan_fee" + "total_swap_fee" + "total_penalty_fee"')), 'totalRevenue'],
        [fn('SUM', col('plan_fee')), 'totalPlanFee'],
        [fn('SUM', col('total_swap_fee')), 'totalSwapFee'],
        [fn('SUM', col('total_penalty_fee')), 'totalPenaltyFee']
      ],
      where: {
        payment_status: 'paid'
      },
      raw: true
    });

    console.log('\nRevenue calculation result:');
    console.log(JSON.stringify(revenue, null, 2));

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkInvoices();
