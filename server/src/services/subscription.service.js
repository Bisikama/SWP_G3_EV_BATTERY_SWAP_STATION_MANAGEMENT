const db = require('../models');
const ApiError = require('../utils/ApiError');

async function findAll() {
  return db.Subscription.findAll();
}

async function findById(id) {
  return db.Subscription.findByPk(id);
}

async function findByVehicle(vehicle_id) {
  return db.Subscription.findAll({ where: { vehicle_id } });
}

async function findByDriver(driver_id) {
  return db.Subscription.findAll({ where: { driver_id } });
}

async function findActiveSubscriptionByVehicle(user, vehicle_id) {
  const vehicle = await db.Vehicle.findByPk(vehicle_id);
  if (!vehicle) throw new ApiError(404, 'Vehicle not found');
  if (vehicle.driver_id !== user.account_id) throw new ApiError(403, 'You are not authorized to access this vehicle');
  const today = new Date();
  return db.Subscription.findOne({
    where: {
      vehicle_id,
      cancel_time: null,
      start_date: { [db.Sequelize.Op.lte]: today },
      end_date: { [db.Sequelize.Op.gte]: today },
    },
  });
}

async function createSubscription(user, { vehicle_id, plan_id } ) {
  const plan = await db.SubscriptionPlan.findByPk(plan_id);
  if (!plan) throw new ApiError(404, 'Subscription plan not found');

  // Check existing active subscription
  const existingActive = await findActiveSubscriptionByVehicle(user, vehicle_id);
  if (existingActive) throw new ApiError(409, 'This vehicle already has an active subscription');

  const planDurationDays = plan.duration_days;
  const start = new Date();
  const end = new Date(start);
  end.setDate(start.getDate() + planDurationDays);
  
  const payload = {
    driver_id: user.account_id,
    vehicle_id,
    plan_id,
    start_date: start,
    end_date: end,
    cancel_time: null
  };
  const created = await db.Subscription.create(payload);
  return created;
}

async function cancelSubscription({ user, subscription_id }) {
  const subscription = await db.Subscription.findByPk(subscription_id);
  if (!subscription) throw new ApiError(404, 'Subscription not found');
  if (subscription.driver_id !== user.account_id) throw new ApiError(403, 'You are not authorized to cancel this subscription');

  if (subscription.cancel_time) throw new ApiError(400, 'Subscription is already cancelled');
  subscription.cancel_time = new Date();
  await subscription.save();

  return subscription;
}

module.exports = { findAll, findById, findByVehicle, findByDriver, findActiveSubscriptionByVehicle, createSubscription, cancelSubscription };