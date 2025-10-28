const db = require('../models');
const ApiError = require('../utils/ApiError');

// async function updateSlot(slot_id, battery_id) {
// 	const slot = await db.CabinetSlot.findByPk(slot_id);
// 	if (!slot) throw new ApiError(400, 'Cabinet Slot not found');

// 	const battery = await db.Battery.findByPk(battery_id);
// 	if (!battery) throw new ApiError(400, 'Battery not found');

// 	if ()
// }