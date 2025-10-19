const { Subscription, SubscriptionPlan, Vehicle, Sequelize, sequelize } = require('../models');
const { Op } = Sequelize;

async function findAll() {
  return Subscription.findAll();
}

async function findById(id) {
  if (!id) return null;
  return Subscription.findByPk(id);
}

async function findByVehicle(vehicle_id) {
  if (!vehicle_id) return null;
  return Subscription.findOne({ where: { vehicle_id } });
}

async function findByDriver(driver_id) {
  if (!driver_id) return null;
  return Subscription.findOne({ where: { driver_id } });
}

async function createSubscription({ user, vehicle_id, plan_id, start_date, end_date }) {
  if (!vehicle_id || plan_id == null) {
    const err = new Error('Vehicle ID and Subscription Plan ID are required');
    err.status = 400;
    throw err;
  }

  const vehicle = await Vehicle.findByPk(vehicle_id);
  if (!vehicle) {
    const err = new Error('Vehicle not found');
    err.status = 404;
    throw err;
  }

  const plan = await SubscriptionPlan.findByPk(plan_id);
  if (!plan) {
    const err = new Error('Subscription Plan not found');
    err.status = 404;
    throw err;
  }

  if (!vehicle.driver_id) {
    const err = new Error('Vehicle has not been assigned to any driver');
    err.status = 400;
    throw err;
  }

  if (vehicle.driver_id !== user.account_id) {
    const err = new Error('You are not authorized to create subscription for this vehicle');
    err.status = 403;
    throw err;
  }

  // Check existing active subscription
  const today = new Date().toISOString().split('T')[0];
  const existingActive = await Subscription.findOne({
    where: {
      vehicle_id,
      cancel_time: null,
      end_date: { [Op.gte]: today }
    }
  });
  if (existingActive) {
    const err = new Error('This vehicle already has an active subscription');
    err.status = 409;
    throw err;
  }

  const subscription_interval_days = 30;
  const start = start_date ? new Date(start_date) : new Date();
  const end = end_date ? new Date(end_date) : new Date(start);
  end.setDate(start.getDate() + subscription_interval_days);
  if (start >= end) {
    const err = new Error('Start date must be earlier than end date');
    err.status = 400;
    throw err;
  }
  
  const payload = {
    driver_id: user.account_id,
    vehicle_id,
    plan_id,
    start_date: start,
    end_date: end,
    cancel_time: null
  };
  const created = await Subscription.create(payload);
  return created;
}

async function cancelSubscription({ user, subscription_id }) {
  if (!subscription_id) {
    const err = new Error('Subscription ID are required');
    err.status = 400;
    throw err;
  }

  const subscription = await Subscription.findByPk(subscription_id);
  if (!subscription) {
    const err = new Error('Subscription not found');
    err.status = 404;
    throw err;
  }

  if (subscription.driver_id !== user.account_id) {
    const err = new Error('You are not authorized to cancel this subscription');
    err.status = 403;
    throw err;
  }

  if (subscription.cancel_time) {
    const err = new Error('Subscription is already cancelled');
    err.status = 400;
    throw err;
  }

  subscription.cancel_time = new Date();
  await subscription.save();

  return subscription;
}

module.exports = { findAll, findById, findByVehicle, findByDriver, createSubscription, cancelSubscription };