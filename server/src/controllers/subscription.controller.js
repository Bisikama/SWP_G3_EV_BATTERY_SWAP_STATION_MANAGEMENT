const subscriptionService = require('../services/subscription.service');

async function findAll(req, res) {
  const subs = await subscriptionService.findAll();
  return res.status(200).json({ success: true, payload: { subscriptions: subs } });
}

async function findById(req, res) {
  const { id } = req.params;
  const sub = await subscriptionService.findById(id);
  if (!sub) throw new Error('Subscription not found');
  return res.status(200).json({ success: true, payload: { subscription: sub } });
}

async function findByVehicle(req, res) {
  const { vehicle_id } = req.params;
  const sub = await subscriptionService.findByVehicle(vehicle_id);
  if (!sub) throw new Error('Subscription not found for vechicle');
  return res.status(200).json({ success: true, payload: { subscription: sub } });
}

async function findByDriver(req, res) {
  const { driver_id } = req.params;
  const subs = await subscriptionService.findByDriver(driver_id);
  if (!subs || subs.length === 0) throw new Error('Subscription not found for driver');
  return res.status(200).json({ success: true, payload: { subscription: subs } });
}

async function findActiveByVehicle(req, res) {
  const { vehicle_id } = req.params;
  const sub = await subscriptionService.findActiveSubscriptionByVehicle(req.user, vehicle_id);
  if (!sub) throw new Error('No active subscription found for this vehicle');
  return res.status(200).json({ success: true, payload: { subscription: sub } });
}

async function create(req, res) {
  const created = await subscriptionService.createSubscription(req.user, {
    vehicle_id: req.body.vehicle_id,
    plan_id: req.body.plan_id,
  });
  return res.status(201).json({ success: true, payload: { subscription: created } });
}

async function cancel(req, res) {
  const { id } = req.params;
  const cancelled = await subscriptionService.cancelSubscription({
    subscription_id: id,
    user: req.user
  });
  return res.status(200).json({ success: true, payload: { subscription: cancelled } });
}

module.exports = { findAll, findById, findByVehicle, findByDriver, findActiveByVehicle, create, cancel };
