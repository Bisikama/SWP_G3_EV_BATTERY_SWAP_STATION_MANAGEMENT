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
    const period = literal(`DATE_TRUNC('${groupDate}', "${dateColumn}" AT TIME ZONE 'UTC+7')`);
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
        [fn('COUNT', col('bookingBatteries.battery_id')), 'totalBatteries'],
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

analyzeBooking({ startDate:'2025-10-25', endDate:'2025-10-31', groupDate:'day' })
  .then(result => console.log(result))
  .catch(err => console.error(err));

analyzeRevenue()
  .then(result => console.log(result))
  .catch(err => console.error(err));

analyzeSwap()
  .then(result => console.log(result))
  .catch(err => console.error(err));