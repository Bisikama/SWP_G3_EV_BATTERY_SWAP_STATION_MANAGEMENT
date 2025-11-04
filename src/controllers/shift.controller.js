const shiftService = require('../services/shift.service');
const ApiError = require('../utils/ApiError');

async function findAll(req, res) {
  const { page, pageSize, ...rest } = req.query;
  const shifts = await shiftService.findAll(rest, page, pageSize);
  return res.status(200).json({ success: true, payload: { shifts } });
}

async function findById(req, res) {
  const { id } = req.params;
  const shift = await shiftService.findById(id);
  if (!shift) throw new ApiError(404, 'Shift not found');
  return res.status(200).json({ success: true, payload: { shift } });
}

async function findCurrent(req, res) {
  const query = req.query;
  const shift = await shiftService.findCurrentShift(query);
  return res.status(200).json({ success: true, payload: { shift } });
}

async function create(req, res) {
  const data = req.body || {};
  const createdShift = await shiftService.createShift(req.user, data);
  return res.status(201).json({ success: true, payload: { shift: createdShift } });
}

async function update(req, res) {
  const { id } = req.params;
  const data = req.body || {};
  const updatedShift = await shiftService.updateShift(req.user, id, data);
  return res.status(200).json({ success: true, payload: { shift: updatedShift } });
}

async function remove(req, res) {
  const { id } = req.params;
  await shiftService.removeShift(req.user, id);
  return res.status(200).json({ success: true });
}

module.exports = {
  findAll,
  findById,
  findCurrent,
  create,
  update,
  remove
};
