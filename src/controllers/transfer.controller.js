const transferService = require('../services/transfer.service');

async function findAll(req, res) {
	const transfers = await transferService.findAll();
	return res.status(200).json({ success: true, payload: { transfers } });
}

async function findById(req, res) {
  const { id } = req.params;
  const transfer = await transferService.findById(id);
  if (!transfer) throw new ApiError(404, 'Transfer not found');
  return res.status(200).json({ success: true, payload: { transfer } });
}

async function request(req, res) {
	const { request_quantity, notes } = req.body;
	const transferReq = await transferService.requestTransfer(req.user, request_quantity, notes);
	return res.status(200).json({ success: true, payload: { transferReq } });
}

async function approve(req, res) {
	const { transfer_request_id } = req.params;
	const { transfer_details } = req.body;
	const transfer = await transferService.approveTransfer(req.user, transfer_request_id, transfer_details);
	return res.status(200).json({ success: true, payload: { transfer } });
}

async function confirm(req, res) {
	const { transfer_detail_id } = req.params;
	const transferDetail = await transferService.confirmTransfer(req.user, transfer_detail_id);
	return res.status(200).json({ success: true, payload: { transferDetail } });
}

module.exports = { findAll, findById, request, approve, confirm };
