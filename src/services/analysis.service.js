const db = require('../models');
const { fn, col, literal, Op } = require('sequelize');

// helper query builder
async function analyzeModel({
  model,
  dateColumn,
  startDate = null,
  endDate = null,
  groupDate = null,
  query = {}
}) {
  const where = { ...(query.where || {}) };

  if (startDate && endDate) {
    where[dateColumn] = { [Op.between]: [startDate, endDate] };
  } else if (startDate) {
    where[dateColumn] = { [Op.gte]: startDate };
  } else if (endDate) {
    where[dateColumn] = { [Op.lte]: endDate };
  }

  const group = [...(query.group || [])];
  const order = [...(query.order || [])];
  const attributes = [...(query.attributes || [])];

  if (groupDate) {
    const period = literal(`DATE_TRUNC('${groupDate}', timezone('Asia/Bangkok', "${dateColumn}"))`);
    attributes.unshift([period, 'period']);
    group.unshift(period);
    order.unshift([period, 'ASC']);
  }

  const queryOptions = {
    raw: true,
    ...query,
    attributes,
    where,
  };

  if (group.length) queryOptions.group = group;
  if (order.length) queryOptions.order = order;

  const results = await model.findAll(queryOptions);
  return group.length ? results : results?.[0] || null;
}

function analyzeBooking({ startDate, endDate, groupDate } = {}) {
  return analyzeModel({
    model: db.Booking,
    dateColumn: 'scheduled_time',
    startDate,
    endDate,
    groupDate,
    query: {
      attributes: [
        [fn('COUNT', fn('DISTINCT', col('Booking.booking_id'))), 'totalBookings'],
        [fn('COUNT', fn('DISTINCT', col('bookingBatteries.battery_id'))), 'totalBatteries'],
        [fn('COUNT', literal(`CASE WHEN status = 'completed' THEN 1 END`)), 'completedBookings'],
        [fn('COUNT', literal(`CASE WHEN status = 'cancelled' THEN 1 END`)), 'cancelledBookings']
      ],
      include: [
        { model: db.BookingBattery, as: 'bookingBatteries', attributes: [] }
      ]
    }
  });
}

function analyzeRevenue({ startDate, endDate, groupDate } = {}) {
  return analyzeModel({
    model: db.Invoice,
    dateColumn: 'create_date',
    startDate,
    endDate,
    groupDate,
    query: {
      attributes: [
        [fn('SUM', literal('"plan_fee" + "total_swap_fee" + "total_penalty_fee"')), 'totalRevenue'],
        [fn('SUM', col('plan_fee')), 'totalPlanFee'],
        [fn('SUM', col('total_swap_fee')), 'totalSwapFee'],
        [fn('SUM', col('total_penalty_fee')), 'totalPenaltyFee']
      ],
      where: {
        payment_status: 'paid'
      }
    }
  });
}

function analyzeSwap({ startDate, endDate, groupDate } = {}) {
  return analyzeModel({
    model: db.SwapRecord,
    dateColumn: 'swap_time',
    startDate,
    endDate,
    groupDate,
    query: {
      attributes: [
        [col('station.station_id'), 'station_id'],
        [col('station.station_name'), 'station_name'],
        [fn('COUNT', col('SwapRecord.swap_id')), 'totalSwaps']
      ],
      include: [
        { model: db.Station, as: 'station', attributes: [] }
      ],
      group: ['station.station_id', 'station.station_name']
    }
  });
}

function analyzeSubscription({ startDate, endDate, groupDate } = {}) {
  return analyzeModel({
    model: db.Subscription,
    dateColumn: 'start_date',
    startDate,
    endDate,
    groupDate,
    query: {
      attributes: [
        [col('plan.plan_id'), 'plan_id'],
        [col('plan.plan_name'), 'plan_name'],
        [fn('COUNT', col('subscription_id')), 'totalSubscriptions'],
        [fn('SUM', col('soh_usage')), 'totalSohUsage'],
        [fn('AVG', col('soh_usage')), 'avgSohUsage'],
        [fn('SUM', col('swap_count')), 'totalSwapCount'],
        [fn('COUNT', literal(`CASE WHEN status = 'active' THEN 1 END`)), 'activeSubscriptions'],
        [fn('COUNT', literal(`CASE WHEN status = 'inactive' THEN 1 END`)), 'inactiveSubscriptions']
      ],
      include: [
        { model: db.SubscriptionPlan, as: 'plan', attributes: [] }
      ],
      group: ['plan.plan_id', 'plan.plan_name']
    }
  });
}

module.exports = {
  analyzeBooking,
  analyzeRevenue,
  analyzeSwap,
  analyzeSubscription
}

analyzeBooking({
  startDate: '2025-10-25T00:00:00.000+07:00',
  endDate: '2025-10-31T00:00:00.000+07:00',
  groupDate: 'day'
})
.then(result => console.log(result))
.catch(err => console.error(err));

analyzeRevenue()
  .then(result => console.log(result))
  .catch(err => console.error(err));

analyzeSwap()
  .then(result => console.log(result))
  .catch(err => console.error(err));

analyzeSubscription()
  .then(result => console.log(result))
  .catch(err => console.error(err));