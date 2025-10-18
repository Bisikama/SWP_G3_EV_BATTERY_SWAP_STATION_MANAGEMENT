const shiftService = require('../services/shift.service');
const ApiError = require('../utils/ApiError');

async function findAll(req, res) {
  const shifts = await shiftService.findAll();
  return res.status(200).json({ success: true, payload: { shifts: shifts } });
}

async function findById(req, res) {
  const { id } = req.params;
  const shift = await shiftService.findById(id);
  if (!shift) throw new ApiError(404, 'Shift not found');
  return res.status(200).json({ success: true, payload: { shift: shift } });
}

async function create(req, res) {
  const data = req.body || {};
  const created = await shiftService.createShift(req.user, data);
  return res.status(201).json({ success: true, payload: { shift: created } });
}

async function update(req, res) {
  const { id } = req.params;
  const data = req.body || {};
  const updated = await shiftService.updateShift(req.user, id, data);
  return res.status(200).json({ success: true, payload: { shift: updated } });
}

async function cancel(req, res) {
  const { id } = req.params;
  const updated = await shiftService.cancelShift(req.user, id);
  return res.status(200).json({ success: true, payload: { shift: updated } });
}

async function confirm(req, res) {
  const { id } = req.params;
  const updated = await shiftService.confirmShift(req.user, id);
  return res.status(200).json({ success: true, payload: { shift: updated } });
}

module.exports = { findAll, findById, create, update, cancel, confirm };
