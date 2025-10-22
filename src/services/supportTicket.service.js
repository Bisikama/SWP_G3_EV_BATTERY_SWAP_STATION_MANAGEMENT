const db = require('../models');
const ApiError = require('../utils/ApiError');

async function findAll() {
	return db.SupportTicket.findAll();
}

async function findById(id) {
	return db.SupportTicket.findByPk(id);
}

async function findByCreator(driverId) {
  return db.SupportTicket.findAll({
    where: { driver_id: driverId },
    order: [['create_date', 'DESC']]
  });
}

async function findByResolver(adminId) {
  return db.SupportTicket.findAll({
    where: { admin_id: adminId },
    order: [['create_date', 'DESC']]
  });
}

async function createSupportTicket(user, data) {
	// same support ticket is not allowed
  const existing = await db.SupportTicket.findOne({
    where: {
      driver_id: user.account_id,
      subject: data.subject,
      description: data.description,
      status: 'pending'
    }
  });
  if (existing) throw new ApiError(400, 'You already send ticket with the same problem');

	// auto assign admin to ticket
	const admins = await db.Account.findAll({
		where: { role: 'admin' },
		include: [{
			model: db.SupportTicket,
			as: 'tickets',
			where: { status: 'pending' },
			required: false
		}]
	})
	const adminResolve = admins.sort((a, b) => (a.tickets?.length || 0) - (b.tickets?.length || 0))[0];

	if (!adminResolve) throw new ApiError(500, 'No available admin to assign this ticket');

	return db.SupportTicket.create({
    driver_id: user.account_id,
    admin_id: adminResolve.account_id,
    subject: data.subject,
    description: data.description
  });
}

async function updateSupportTicketStatus(user, id) {
	const ticket = await db.SupportTicket.findByPk(id);
	if (!ticket) throw new ApiError(404, 'Support ticket not found');
	if (ticket.admin_id !== user.account_id) {
    throw new ApiError(403, 'You cannot modify tickets assigned to another admin');
  }
	if (ticket.status !== 'pending') {
    throw new ApiError(400, 'Only pending tickets can be resolved');
  }
	ticket.status = 'resolved';
  ticket.resolve_date = new Date();
	await ticket.save();
	return ticket;
}

module.exports = { findAll, findById, findByCreator, findByResolver, createSupportTicket, updateSupportTicketStatus };
