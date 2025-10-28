const cabinetService = require('../services/cabinet.service');
const ApiError = require('../utils/ApiError');

async function findAll(req, res) {
  const cabinets = await cabinetService.findAll();
  return res.status(200).json({ success: true, payload: { cabinets } });
}

async function findById(req, res) {
  const { id } = req.params;
  const cabinet = await cabinetService.findById(id);
  if (!cabinet) throw new ApiError(404, 'Cabinet not found');
  return res.status(200).json({ success: true, payload: { cabinet } });
}

async function findByStation(req, res) {
  const { station_id } = req.params;
  const cabinets = await cabinetService.findByStation(station_id);
  return res.status(200).json({ success: true, payload: { cabinets } });
}

async function findEmptySlot(req, res) {
  const { cabinet_id } = req.params;
  const slots = await cabinetService.findEmptySlot(cabinet_id);
  return res.status(200).json({ success: true, payload: { slots } });
}

async function chargeFull(req, res) {
  const { cabinet_id } = req.params;
  const result = await cabinetService.chargeFull(cabinet_id);
  return res.status(200).json({
    success: true,
    payload: { message: 'Cabinet batteries charged to full', result }
  });
}

module.exports = { findAll, findById, findByStation, findEmptySlot, chargeFull };
