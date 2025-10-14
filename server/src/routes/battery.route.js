const express = require('express');
const router = express.Router();
const batteryController = require('../controllers/battery.controller');

// GET batteries filter by station name and battery type name
router.get('/filterCount', batteryController.countByStationAndType);

// GET all batteries
router.get('/all', batteryController.getAll);

module.exports = router;