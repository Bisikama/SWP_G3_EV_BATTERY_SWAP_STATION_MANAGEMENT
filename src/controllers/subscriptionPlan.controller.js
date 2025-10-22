const subscriptionPlanService = require('../services/subscriptionPlan.service');
const ApiError = require('../utils/ApiError');

async function findAll(req, res) {
	const plans = await subscriptionPlanService.findAll();
	return res.status(200).json({ success: true, payload: { subscriptionPlans: plans } });
}

async function findById(req, res) {
	const { id } = req.params;
	const plan = await subscriptionPlanService.findById(id);
	if (!plan) throw new ApiError(404, 'Subscription plan not found');
	return res.status(200).json({ success: true, payload: { subscriptionPlan: plan } });
}

async function create(req, res) {
	const data = req.body || {};
	const created = await subscriptionPlanService.createSubscriptionPlan(req.user, data);
	return res.status(201).json({ success: true, payload: { subscriptionPlan: created } });
}

async function update(req, res) {
	const { id } = req.params;
	const data = req.body || {};
	const updated = await subscriptionPlanService.updateSubscriptionPlan(req.user, id, data);
	return res.status(200).json({ success: true, payload: { subscriptionPlan: updated } });
}

async function updateStatus(req, res) {
	const { id } = req.params;
	const updated = await subscriptionPlanService.updateSubscriptionPlanStatus(req.user, id);
	return res.status(200).json({ success: true, payload: { subscriptionPlan: updated } });
}

async function remove(req, res) {
	const { id } = req.params;
	await subscriptionPlanService.deleteSubscriptionPlan(req.user, id);
	return res.status(200).json({ success: true });
}

module.exports = { findAll, findById, create, update, updateStatus, remove };
