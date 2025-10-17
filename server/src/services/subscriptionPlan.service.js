const db = require('../models');
const ApiError = require('../utils/ApiError');

async function findAll() {
  return db.SubscriptionPlan.findAll();
}

async function findById(id) {
  return db.SubscriptionPlan.findByPk(id);
}

async function createSubscriptionPlan(user, data) {
	data['admin_id'] = user.account_id;
  return db.SubscriptionPlan.create(data);
}

async function updateSubscriptionPlan(user, id, data) {
  const plan = await db.SubscriptionPlan.findByPk(id);
  if (!plan) throw new ApiError(404, 'Subscription plan not found');
	if (plan.admin_id !== user.account_id)
		throw new ApiError(403, 'Only the creator admin can update this subscription plan');
  delete data['is_active'];
  await plan.update(data);
  return plan;
}

async function updateSubscriptionPlanStatus(user, id) {
  const plan = await db.SubscriptionPlan.findByPk(id);
  if (!plan) throw new ApiError(404, 'Subscription plan not found');
	if (plan.admin_id !== user.account_id)
		throw new ApiError(403, 'Only the creator admin can update this subscription plan');
  await plan.update({ is_active: !plan.is_active });
  return plan;
}

async function deleteSubscriptionPlan(user, id) {
  const plan = await db.SubscriptionPlan.findByPk(id);
  if (!plan) throw new ApiError(404, 'Subscription plan not found');
	if (plan.admin_id !== user.account_id)
		throw new ApiError(403, 'Only the creator admin can delete this subscription plan');
  await plan.destroy();
  return plan;
}

module.exports = { findAll, findById, createSubscriptionPlan, updateSubscriptionPlan, updateSubscriptionPlanStatus, deleteSubscriptionPlan };
