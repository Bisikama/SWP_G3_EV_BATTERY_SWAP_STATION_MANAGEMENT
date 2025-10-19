const supportTicketService = require('../services/supportTicket.service');
const ApiError = require('../utils/ApiError');

async function findAll(req, res) {
  const tickets = await supportTicketService.findAll();
  return res.status(200).json({ success: true, payload: { tickets } });
}

async function findById(req, res) {
  const { id } = req.params;
  const ticket = await supportTicketService.findById(id);
  if (!ticket) throw new ApiError(404, 'Support ticket not found');
  return res.status(200).json({ success: true, payload: { ticket } });
}

async function findByCreator(req, res) {
  const driverId = req.params.id;
  const tickets = await supportTicketService.findByCreator(driverId);
  return res.status(200).json({ success: true, payload: { tickets } });
}

async function findByResolver(req, res) {
  const adminId = req.params.id;
  const tickets = await supportTicketService.findByResolver(adminId);
  return res.status(200).json({ success: true, payload: { tickets } });
}

async function create(req, res) {
  const data = req.body || {};
  const created = await supportTicketService.createSupportTicket(req.user, data);
  return res.status(201).json({ success: true, payload: { ticket: created } });
}

async function updateStatus(req, res) {
  const { id } = req.params;
  const updated = await supportTicketService.updateSupportTicketStatus(req.user, id);
  return res.status(200).json({ success: true, payload: { ticket: updated } });
}

module.exports = { findAll, findById, findByCreator, findByResolver, create, updateStatus };
