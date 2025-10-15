const subscriptionService = require('../services/subscription.service');

async function findAll(req, res) {
	try {
		const subs = await subscriptionService.findAll();
		return res.status(200).json({ success: true, payload: { subscriptions: subs } });
	} catch (err) {
		console.error('Find subscriptions error', err);
		return res.status(500).json({ message: 'Internal server error' });
	}
}

async function findById(req, res) {
	try {
		const { id } = req.params;
		if (!id) return res.status(400).json({ message: 'Id is required' });
		const sub = await subscriptionService.findById(id);
		if (!sub) return res.status(404).json({ message: 'Subscription not found' });
		return res.status(200).json({ success: true, payload: { subscription: sub } });
	} catch (err) {
		console.error('Find subscription by id error', err);
		return res.status(500).json({ message: 'Internal server error' });
	}
}

async function findByVehicle(req, res) {
	try {
		const { vehicle_id } = req.params;
		if (!vehicle_id) return res.status(400).json({ message: 'vehicle_id is required' });
		const sub = await subscriptionService.findByVehicle(vehicle_id);
		if (!sub) return res.status(404).json({ message: 'Subscription not found for vehicle' });
		return res.status(200).json({ success: true, payload: { subscription: sub } });
	} catch (err) {
		console.error('Find subscription by vehicle error', err);
		return res.status(500).json({ message: 'Internal server error' });
	}
}

async function findByDriver(req, res) {
	try {
		const { driver_id } = req.params;
		if (!driver_id) return res.status(400).json({ message: 'driver_id is required' });
		const sub = await subscriptionService.findByDriver(driver_id);
		if (!sub) return res.status(404).json({ message: 'Subscription not found for driver' });
		return res.status(200).json({ success: true, payload: { subscription: sub } });
	} catch (err) {
		console.error('Find subscription by driver error', err);
		return res.status(500).json({ message: 'Internal server error' });
	}
}

async function create(req, res) {
	try {
		const created = await subscriptionService.createSubscription({
			user: req.user,
			vehicle_id: req.body.vehicle_id,
			plan_id: req.body.plan_id,
			start_date: req.body.start_date,
			end_date: req.body.end_date
		});
		return res.status(201).json({ success: true, payload: { subscription: created } });
	} catch (err) {
		console.error('Create subscription error', err);
		if (err && err.status) return res.status(err.status).json({ message: err.message });
		return res.status(500).json({ message: 'Internal server error' });
	}
}

async function cancel(req, res) {
  try {
    const { id } = req.params;
    const cancelled = await subscriptionService.cancelSubscription({
      subscription_id: id,
      user: req.user
    });
    return res.status(200).json({ success: true, payload: { subscription: cancelled } });
  } catch (err) {
    console.error('Cancel subscription error', err);
    return res.status(err?.status || 500).json({ message: err.message || 'Internal server error' });
  }
}

module.exports = { findAll, findById, findByVehicle, findByDriver, create, cancel };
