const cabinetService = require('../services/cabinet.service');
const ApiError = require('../utils/ApiError');

async function findAll(req, res) {
  const page = parseInt(req.query.page) || 1;
	const pageSize = parseInt(req.query.pageSize) || 10;
	const filters = { ...req.query };
	delete filters.page;
	delete filters.pageSize;

  const cabinets = await cabinetService.findAll(filters, page, pageSize);
  return res.status(200).json({ success: true, payload: { cabinets } });
}

async function findById(req, res) {
  const { id } = req.params;
  const cabinet = await cabinetService.findById(id);
  if (!cabinet) throw new ApiError(404, 'Cabinet not found');
  return res.status(200).json({ success: true, payload: { cabinet } });
}

async function create(req, res) {
  const { station_id, battery_capacity, power_capacity_kw } = req.body;
  const cabinet = await cabinetService.createCabinet({ station_id, battery_capacity, power_capacity_kw });

  return res.status(201).json({
    success: true,
    payload: { cabinet }
  });
}

async function chargeFull(req, res) {
  const { id } = req.params;
  const result = await cabinetService.chargeFull(id);
  return res.status(200).json({
    success: true,
    payload: { message: 'Cabinet batteries charged to full', result }
  });
}

module.exports = { findAll, findById, create, chargeFull };
