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

module.exports = {
  analyzeBooking,
  analyzeRevenue,
  analyzeSwap,
  analyzeSubscription,
};
