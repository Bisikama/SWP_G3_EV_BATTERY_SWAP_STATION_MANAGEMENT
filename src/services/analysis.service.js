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

  // Convert local date strings (YYYY-MM-DD) to full datetime range
  if (startDate && endDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0); // Start of day
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // End of day
    
    where[dateColumn] = { [Op.between]: [start, end] };
  } else if (startDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    where[dateColumn] = { [Op.gte]: start };
  } else if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    where[dateColumn] = { [Op.lte]: end };
  }

  const group = [...(query.group || [])];
  const order = [...(query.order || [])];
  const attributes = [...(query.attributes || [])];

  if (groupDate) {
    const period = literal(`DATE_TRUNC('${groupDate}', "${dateColumn}")`);
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
    dateColumn: 'create_time',
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

/**
 * Export Analysis to Excel
 * 
 * Generates an Excel file with 4 sheets containing analysis data:
 *   - Bookings: Total bookings, batteries, completion rates
 *   - Revenue: Total revenue breakdown by fee types
 *   - Swaps: Swap activity grouped by station
 *   - Subscriptions: Subscription statistics by plan
 * 
 * @param {string} startDate - Start date for analysis period (ISO format)
 * @param {string} endDate - End date for analysis period (ISO format)
 * @returns {Promise<Buffer>} Excel file buffer
 */
async function exportAnalysisToExcel({ startDate, endDate } = {}) {
  const ExcelJS = require('exceljs');
  
  // Fetch all analysis data in parallel
  const [bookingData, revenueData, swapData, subscriptionData] = await Promise.all([
    analyzeBooking({ startDate, endDate }),
    analyzeRevenue({ startDate, endDate }),
    analyzeSwap({ startDate, endDate }),
    analyzeSubscription({ startDate, endDate })
  ]);

  // Create new workbook
  const workbook = new ExcelJS.Workbook();
  
  workbook.creator = 'VinStation System';
  workbook.created = new Date();
  workbook.modified = new Date();

  // Sheet 1: Bookings Analysis
  const bookingSheet = workbook.addWorksheet('Bookings Analysis');
  
  bookingSheet.columns = [
    { header: 'Metric', key: 'metric', width: 30 },
    { header: 'Value', key: 'value', width: 20 }
  ];

  if (bookingData) {
    bookingSheet.addRows([
      { metric: 'Total Bookings', value: bookingData.totalBookings || 0 },
      { metric: 'Total Batteries Reserved', value: bookingData.totalBatteries || 0 },
      { metric: 'Completed Bookings', value: bookingData.completedBookings || 0 },
      { metric: 'Cancelled Bookings', value: bookingData.cancelledBookings || 0 }
    ]);
  }

  // Apply styling to booking sheet
  bookingSheet.getRow(1).font = { bold: true };
  bookingSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' }
  };

  // Sheet 2: Revenue Analysis
  const revenueSheet = workbook.addWorksheet('Revenue Analysis');
  
  revenueSheet.columns = [
    { header: 'Revenue Type', key: 'type', width: 30 },
    { header: 'Amount (VND)', key: 'amount', width: 20 }
  ];

  if (revenueData) {
    revenueSheet.addRows([
      { type: 'Total Revenue', amount: revenueData.totalRevenue || 0 },
      { type: 'Plan Fees', amount: revenueData.totalPlanFee || 0 },
      { type: 'Swap Fees', amount: revenueData.totalSwapFee || 0 },
      { type: 'Penalty Fees', amount: revenueData.totalPenaltyFee || 0 }
    ]);
  }

  // Apply styling to revenue sheet
  revenueSheet.getRow(1).font = { bold: true };
  revenueSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF70AD47' }
  };

  // Sheet 3: Swap Analysis by Station
  const swapSheet = workbook.addWorksheet('Swap Analysis');
  
  swapSheet.columns = [
    { header: 'Station ID', key: 'station_id', width: 15 },
    { header: 'Station Name', key: 'station_name', width: 30 },
    { header: 'Total Swaps', key: 'totalSwaps', width: 20 }
  ];

  if (swapData && Array.isArray(swapData)) {
    swapSheet.addRows(swapData);
  }

  // Apply styling to swap sheet
  swapSheet.getRow(1).font = { bold: true };
  swapSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFC000' }
  };

  // Sheet 4: Subscription Analysis by Plan
  const subscriptionSheet = workbook.addWorksheet('Subscription Analysis');
  
  subscriptionSheet.columns = [
    { header: 'Plan ID', key: 'plan_id', width: 15 },
    { header: 'Plan Name', key: 'plan_name', width: 30 },
    { header: 'Total Subscriptions', key: 'totalSubscriptions', width: 20 },
    { header: 'Active', key: 'activeSubscriptions', width: 15 },
    { header: 'Inactive', key: 'inactiveSubscriptions', width: 15 },
    { header: 'Total SOH Usage', key: 'totalSohUsage', width: 20 },
    { header: 'Avg SOH Usage', key: 'avgSohUsage', width: 20 },
    { header: 'Total Swap Count', key: 'totalSwapCount', width: 20 }
  ];

  if (subscriptionData && Array.isArray(subscriptionData)) {
    subscriptionSheet.addRows(subscriptionData);
  }

  // Apply styling to subscription sheet
  subscriptionSheet.getRow(1).font = { bold: true };
  subscriptionSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF5B9BD5' }
  };

  // Add summary info sheet
  const summarySheet = workbook.addWorksheet('Summary');
  
  summarySheet.columns = [
    { header: 'Field', key: 'field', width: 30 },
    { header: 'Value', key: 'value', width: 50 }
  ];

  summarySheet.addRows([
    { field: 'Report Generated', value: new Date().toLocaleString('vi-VN') },
    { field: 'Period Start', value: startDate || 'All time' },
    { field: 'Period End', value: endDate || 'All time' },
    { field: 'Total Sheets', value: 4 }
  ]);

  summarySheet.getRow(1).font = { bold: true };
  summarySheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFC5C5C5' }
  };

  // Generate Excel file buffer
  const buffer = await workbook.xlsx.writeBuffer();
  
  return buffer;
}

module.exports = {
  analyzeBooking,
  analyzeRevenue,
  analyzeSwap,
  analyzeSubscription,
  exportAnalysisToExcel
}