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

/**
 * Controller: Get vehicles without active subscription
 * Driver CHỈ CẦN BẤM NÚT - không cần nhập gì
 * GET /api/subscription/vehicles-without-subscription
 * 
 * @access Private - Driver only
 * @param {Request} req - Express request (user.account_id tự động từ JWT)
 * @param {Response} res - Express response
 * @returns {Object} { success, payload: { vehicles, count, message } }
 */
async function getVehiclesWithoutSubscription(req, res) {
  const driver_id = req.user.account_id; // Lấy driver_id từ token - TỰ ĐỘNG!
  
  const vehicles = await subscriptionService.getVehiclesWithoutSubscription(driver_id);
  
  return res.status(200).json({ 
    success: true, 
    payload: { 
      vehicles,
      count: vehicles.length,
      message: vehicles.length > 0 
        ? `You have ${vehicles.length} vehicle(s) without active subscription`
        : 'All your vehicles have active subscriptions'
    } 
  });
}

module.exports = { findAll, findById, findByVehicle, findByDriver, findActiveByVehicle, create, cancel, getVehiclesWithoutSubscription };
