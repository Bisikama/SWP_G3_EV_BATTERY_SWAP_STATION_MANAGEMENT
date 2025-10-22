const express = require('express');
const router = express.Router();
const swapBatteryController = require('../controllers/swap_battery.controller');

/**
 * @swagger
 * tags:
 *   name: Battery Swap
 *   description: API quản lý đổi pin tại trạm
 */

/**
 * @swagger
 * /api/swap/validate-and-prepare:
 *   post:
 *     summary: Validate và tự động thực hiện đổi pin
 *     tags: [Battery Swap]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - driver_id
 *               - vehicle_id
 *               - station_id
 *               - battery_type_id
 *               - requested_quantity
 *               - batteriesIn
 *     responses:
 *       200:
 *         description: Thành công
 *       400:
 *         description: Lỗi
 */
router.post('/validate-and-prepare', swapBatteryController.validateAndPrepareSwap);

/**
 * @swagger
 * /api/swap/execute:
 *   post:
 *     summary: Thực hiện swap thủ công
 *     tags: [Battery Swap]
 */
router.post('/execute', swapBatteryController.executeSwap);

/**
 * @swagger
 * /api/swap/available-batteries:
 *   get:
 *     summary: Kiểm tra pin sẵn sàng
 *     tags: [Battery Swap]
 */
router.get('/available-batteries', swapBatteryController.getAvailableBatteries);

/**
 * @swagger
 * /api/swap/first-time-pickup:
 *   post:
 *     summary: Lấy pin lần đầu cho xe mới
 *     tags: [Battery Swap]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - driver_id
 *               - vehicle_id
 *               - station_id
 *             properties:
 *               driver_id:
 *                 type: string
 *                 format: uuid
 *               vehicle_id:
 *                 type: string
 *                 format: uuid
 *               station_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Lấy pin lần đầu thành công
 *       400:
 *         description: Lỗi input hoặc xe đã lấy pin
 *       500:
 *         description: Lỗi server
 */
router.post('/first-time-pickup', swapBatteryController.firstTimeBatteryPickup);

module.exports = router;
