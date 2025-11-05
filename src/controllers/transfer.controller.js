const transferService = require('../services/transfer.service');
const ApiError = require('../utils/ApiError');

async function findAllRequest(req, res) {
	const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
	const filters = { ...req.query };
	delete filters.page;
	delete filters.pageSize;
	
	const transfers = await transferService.findAllRequest(filters, page, pageSize);
	return res.status(200).json({ success: true, payload: { transfers } });
}

async function findAllOrder(req, res) {
	const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
	const filters = { ...req.query };
	delete filters.page;
	delete filters.pageSize;
	
	const transfers = await transferService.findAllOrder(filters, page, pageSize);
	return res.status(200).json({ success: true, payload: { transfers } });
}

async function findRequestById(req, res) {
	const { id } = req.params;
	const transfer = await transferService.findRequestById(id);
	if (!transfer) throw new ApiError(404, 'Transfer request not found');
	return res.status(200).json({ success: true, payload: { transfer } });
}

async function findOrderById(req, res) {
	const { id } = req.params;
	const transfer = await transferService.findOrderById(id);
	if (!transfer) throw new ApiError(404, 'Transfer order not found');
	return res.status(200).json({ success: true, payload: { transfer } });
}

async function request(req, res) {
	const { request_quantity, notes } = req.body;
	const transferRequest = await transferService.requestTransfer(req.user, request_quantity, notes);
	return res.status(200).json({ success: true, payload: { transferRequest } });
}

async function approve(req, res) {
	const { transfer_request_id } = req.params;
	const { transfer_orders } = req.body;
	const transfer = await transferService.approveTransfer(req.user, transfer_orders, transfer_request_id);
	return res.status(200).json({ success: true, payload: { transfer } });
}

async function create(req, res) {
	const { transfer_orders } = req.body;
	const orders = await transferService.createTransfer(transfer_orders);
	return res.status(201).json({ success: true, payload: { orders } });
}

async function reject(req, res) {
	const { transfer_request_id } = req.params;
	const transferRequest = await transferService.rejectTransfer(req.user, transfer_request_id);
	return res.status(200).json({ success: true, payload: { transferRequest } });
}

async function confirm(req, res) {
	const { transfer_order_id } = req.params;
	const transferOrder = await transferService.confirmTransfer(req.user, transfer_order_id);
	return res.status(200).json({ success: true, payload: { transferOrder } });
}

async function cancel(req, res) {
	const { transfer_request_id } = req.params;
	const transferRequest = await transferService.cancelTransfer(req.user, transfer_request_id);
	return res.status(200).json({ success: true, payload: { transferRequest } });
}

module.exports = { findAllRequest, findAllOrder, findRequestById, findOrderById, request, approve, create, reject, confirm, cancel };
