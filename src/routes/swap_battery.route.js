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
 * components:
 *   schemas:
 *     BatteryIn:
 *       type: object
 *       required:
 *         - slot_id
 *         - battery_id
 *       properties:
 *         slot_id:
 *           type: integer
 *           example: 5
 *         battery_id:
 *           type: string
 *           format: uuid
 *           example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *     
 *     ValidBatteryResult:
 *       type: object
 *       properties:
 *         slot_id:
 *           type: integer
 *           example: 5
 *         battery_id:
 *           type: string
 *           format: uuid
 *         battery_soh:
 *           type: number
 *           example: 85.5
 *         battery_soc:
 *           type: number
 *           example: 25.0
 *         new_slot_status:
 *           type: string
 *           enum: [charging, faulty]
 *           example: "charging"
 *     
 *     InvalidBatteryResult:
 *       type: object
 *       properties:
 *         slot_id:
 *           type: integer
 *         battery_id:
 *           type: string
 *           format: uuid
 *         error:
 *           type: string
 *     
 *     AvailableBatteryOut:
 *       type: object
 *       properties:
 *         slot_id:
 *           type: integer
 *         battery_id:
 *           type: string
 *           format: uuid
 *         current_soc:
 *           type: number
 *         current_soh:
 *           type: number
 *     
 *     SwapResult:
 *       type: object
 *       properties:
 *         type:
 *           type: string
 *           enum: [IN, OUT]
 *         battery_id:
 *           type: string
 *           format: uuid
 *         slot_id:
 *           type: integer
 *         soc:
 *           type: number
 *         soh:
 *           type: number
 *     
 *     SwapRecord:
 *       type: object
 *       properties:
 *         swap_id:
 *           type: string
 *           format: uuid
 *         driver_id:
 *           type: string
 *           format: uuid
 *         vehicle_id:
 *           type: string
 *           format: uuid
 *         station_id:
 *           type: integer
 *         battery_id_in:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         battery_id_out:
 *           type: string
 *           format: uuid
 *         soh_in:
 *           type: number
 *         soh_out:
 *           type: number
 *         swap_time:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/swap/validate-and-prepare:
 *   post:
 *     summary: Validate và tự động thực hiện đổi pin
 *     tags: [Battery Swap]
 *     description: API validate pin cũ và tự động execute nếu thành công
 *     security:
 *       - bearerAuth: []
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
 *             properties:
 *               driver_id:
 *                 type: string
 *                 format: uuid
 *               vehicle_id:
 *                 type: string
 *                 format: uuid
 *               station_id:
 *                 type: integer
 *               battery_type_id:
 *                 type: integer
 *               requested_quantity:
 *                 type: integer
 *                 minimum: 1
 *               batteriesIn:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/BatteryIn'
 *     responses:
 *       200:
 *         description: Success - Auto execute hoặc require confirmation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 require_confirmation:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/swap/execute:
 *   post:
 *     summary: Thực hiện đổi pin thủ công
 *     tags: [Battery Swap]
 *     description: Execute swap sau khi user confirm
 *     security:
 *       - bearerAuth: []
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
 *               - batteriesIn
 *             properties:
 *               driver_id:
 *                 type: string
 *                 format: uuid
 *               vehicle_id:
 *                 type: string
 *                 format: uuid
 *               station_id:
 *                 type: integer
 *               battery_type_id:
 *                 type: integer
 *               batteriesIn:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/BatteryIn'
 *     responses:
 *       200:
 *         description: Đổi pin thành công
 *       400:
 *         description: Không đủ pin
 *       404:
 *         description: Battery not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/swap/available-batteries:
 *   get:
 *     summary: Kiểm tra pin sẵn sàng
 *     tags: [Battery Swap]
 *     description: Lấy danh sách pin có SOC >= 90% tại trạm
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: station_id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: battery_type_id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: quantity
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Danh sách pin sẵn sàng
 *       400:
 *         description: Missing parameters
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/swap/first-time-pickup:
 *   post:
 *     summary: Lấy pin lần đầu cho xe mới
 *     tags: [Battery Swap]
 *     description: Lấy pin lần đầu (không có pin cũ trả vào)
 *     security:
 *       - bearerAuth: []
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
 *         description: Lấy pin thành công
 *       400:
 *         description: Vehicle already picked first batteries
 *       404:
 *         description: Vehicle not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/swap/validate-and-prepare:
 *   post:
 *     summary: Validate và chuẩn bị đổi pin (không có booking)
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
 *             properties:
 *               driver_id:
 *                 type: string
 *                 format: uuid
 *               vehicle_id:
 *                 type: string
 *                 format: uuid
 *               station_id:
 *                 type: integer
 *               battery_type_id:
 *                 type: integer
 *               requested_quantity:
 *                 type: integer
 *               batteriesIn:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/BatteryIn'
 *     responses:
 *       200:
 *         description: Validation thành công
 *       400:
 *         description: Validation thất bại
 */

/**
 * @swagger
 * /api/swap/validate-with-booking:
 *   post:
 *     summary: Validate đổi pin với booking (hỗ trợ cả first-time)
 *     tags: [Battery Swap]
 *     description: Kiểm tra xe đã lấy pin lần đầu chưa, trả về is_first_time flag
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - booking_id
 *               - driver_id
 *               - vehicle_id
 *               - station_id
 *               - battery_type_id
 *             properties:
 *               booking_id:
 *                 type: string
 *                 format: uuid
 *               driver_id:
 *                 type: string
 *                 format: uuid
 *               vehicle_id:
 *                 type: string
 *                 format: uuid
 *               station_id:
 *                 type: integer
 *               battery_type_id:
 *                 type: integer
 *               batteriesIn:
 *                 type: array
 *                 description: Optional nếu first-time
 *                 items:
 *                   $ref: '#/components/schemas/BatteryIn'
 *     responses:
 *       200:
 *         description: Validation thành công, is_first_time flag included
 *       400:
 *         description: Validation thất bại
 */

/**
 * @swagger
 * /api/swap/execute:
 *   post:
 *     summary: Thực hiện đổi pin (sau khi validate)
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
 *               - batteriesIn
 *             properties:
 *               driver_id:
 *                 type: string
 *                 format: uuid
 *               vehicle_id:
 *                 type: string
 *                 format: uuid
 *               station_id:
 *                 type: integer
 *               battery_type_id:
 *                 type: integer
 *               batteriesIn:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/BatteryIn'
 *     responses:
 *       200:
 *         description: Đổi pin thành công
 *       400:
 *         description: Lỗi validation
 */

/**
 * @swagger
 * /api/swap/execute-with-booking:
 *   post:
 *     summary: Thực hiện đổi pin với booking (regular swap)
 *     tags: [Battery Swap]
 *     description: Dùng khi is_first_time = false
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - booking_id
 *               - driver_id
 *               - vehicle_id
 *               - station_id
 *               - battery_type_id
 *               - batteriesIn
 *               - batteriesOut
 *             properties:
 *               booking_id:
 *                 type: string
 *                 format: uuid
 *               driver_id:
 *                 type: string
 *                 format: uuid
 *               vehicle_id:
 *                 type: string
 *                 format: uuid
 *               station_id:
 *                 type: integer
 *               battery_type_id:
 *                 type: integer
 *               batteriesIn:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/BatteryIn'
 *               batteriesOut:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     battery_id:
 *                       type: string
 *                       format: uuid
 *     responses:
 *       200:
 *         description: Đổi pin thành công
 *       400:
 *         description: Lỗi validation
 */

/**
 * @swagger
 * /api/swap/execute-first-time-with-booking:
 *   post:
 *     summary: Lấy pin lần đầu với booking
 *     tags: [Battery Swap]
 *     description: Dùng khi is_first_time = true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - booking_id
 *               - driver_id
 *               - vehicle_id
 *               - station_id
 *               - bookedBatteries
 *             properties:
 *               booking_id:
 *                 type: string
 *                 format: uuid
 *               driver_id:
 *                 type: string
 *                 format: uuid
 *               vehicle_id:
 *                 type: string
 *                 format: uuid
 *               station_id:
 *                 type: integer
 *               bookedBatteries:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     slot_id:
 *                       type: integer
 *                     battery_id:
 *                       type: string
 *                       format: uuid
 *     responses:
 *       200:
 *         description: Lấy pin lần đầu thành công
 *       400:
 *         description: Lỗi validation
 */

// Routes
router.post('/validate-and-prepare', swapBatteryController.validateAndPrepareSwap);
router.post('/validate-with-booking', swapBatteryController.validateAndPrepareSwapWithBooking);
router.post('/execute', swapBatteryController.executeSwap);
router.post('/execute-with-booking', swapBatteryController.executeSwapWithBooking);
router.post('/execute-first-time-with-booking', swapBatteryController.executeFirstTimePickupWithBooking); // ← THÊM MỚI
router.get('/available-batteries', swapBatteryController.getAvailableBatteries);
router.post('/first-time-pickup', swapBatteryController.firstTimeBatteryPickup);

module.exports = router;