const analysisService = require('../services/analysis.service');
const ApiError = require('../utils/ApiError');

function parseDateRange(req) {
  const { startDate, endDate, groupDate } = req.query;
  return { startDate, endDate, groupDate };
}

async function analyzeBooking(req, res) {
  const params = parseDateRange(req);
  const result = await analysisService.analyzeBooking(params);

  return res.status(200).json({
    success: true,
    payload: result,
  });
}

async function analyzeRevenue(req, res) {
  const params = parseDateRange(req);
  const result = await analysisService.analyzeRevenue(params);

  return res.status(200).json({
    success: true,
    payload: result,
  });
}

async function analyzeSwap(req, res) {
  const params = parseDateRange(req);
  const result = await analysisService.analyzeSwap(params);

  return res.status(200).json({
    success: true,
    payload: result,
  });
}

async function analyzeSubscription(req, res) {
  const params = parseDateRange(req);
  const result = await analysisService.analyzeSubscription(params);

  return res.status(200).json({
    success: true,
    payload: result,
  });
}

/**
 * Export Analysis to Excel
 * GET /api/analysis/export?startDate=2024-01-01&endDate=2024-12-31
 * 
 * Generates Excel file with all analysis data (bookings, revenue, swaps, subscriptions).
 * Returns binary Excel file for download.
 * 
 * Access: Admin only
 */
async function exportAnalysis(req, res) {
  try {
    const { startDate, endDate } = req.query;

    console.log('[ANALYSIS EXPORT] Generating Excel report');
    console.log('[ANALYSIS EXPORT]   Start Date:', startDate || 'All time');
    console.log('[ANALYSIS EXPORT]   End Date:', endDate || 'All time');

    // Check data first
    console.log('[ANALYSIS EXPORT] Checking available data...');
    const [bookings, revenue, swaps, subscriptions] = await Promise.all([
      analysisService.analyzeBooking({ startDate, endDate }),
      analysisService.analyzeRevenue({ startDate, endDate }),
      analysisService.analyzeSwap({ startDate, endDate }),
      analysisService.analyzeSubscription({ startDate, endDate })
    ]);

    // Log data availability
    console.log('[ANALYSIS EXPORT] Data found:');
    console.log('[ANALYSIS EXPORT]   - Bookings:', bookings?.totalBookings || 0);
    console.log('[ANALYSIS EXPORT]   - Revenue:', revenue?.totalRevenue || 0, 'VND');
    console.log('[ANALYSIS EXPORT]   - Swaps:', Array.isArray(swaps) ? swaps.length : 0, 'stations');
    console.log('[ANALYSIS EXPORT]   - Subscriptions:', Array.isArray(subscriptions) ? subscriptions.length : 0, 'plans');

    const excelBuffer = await analysisService.exportAnalysisToExcel({
      startDate,
      endDate
    });

    const filename = `analysis-report-${Date.now()}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', excelBuffer.length);

    console.log('[ANALYSIS EXPORT] Excel file generated successfully');
    console.log('[ANALYSIS EXPORT]   Filename:', filename);
    console.log('[ANALYSIS EXPORT]   Size:', (excelBuffer.length / 1024).toFixed(2), 'KB');

    return res.send(excelBuffer);
    
  } catch (error) {
    console.error('[ANALYSIS EXPORT] Error generating Excel:', error.message);
    console.error('[ANALYSIS EXPORT] Stack trace:', error.stack);
    
    return res.status(500).json({
      success: false,
      message: 'Failed to generate Excel report',
      error: error.message
    });
  }
}

module.exports = {
  analyzeBooking,
  analyzeRevenue,
  analyzeSwap,
  analyzeSubscription,
  exportAnalysis
};
