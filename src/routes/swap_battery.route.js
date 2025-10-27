const express = require('express');
const router = express.Router();
const swapBatteryController = require('../controllers/swap_battery.controller');
const { verifyToken } = require('../middlewares/verifyTokens');
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
 *     summary: Kiểm tra pin sẵn sàng tại trạm
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
 * /api/swap/empty-slots:
 *   get:
 *     summary: Lấy danh sách slot trống tại trạm
 *     tags: [Battery Swap]
 *     description: Lấy tất cả các slot có trạng thái 'empty' tại một trạm cụ thể
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: station_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của trạm cần lấy slot trống
 *         example: 1
 *     responses:
 *       200:
 *         description: Danh sách slot trống
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Lấy danh sách slot trống thành công"
 *                 data:
 *                   type: object
 *                   properties:
 *                     station_id:
 *                       type: integer
 *                       example: 1
 *                     total_empty_slots:
 *                       type: integer
 *                       example: 5
 *                     empty_slots:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           slot_id:
 *                             type: integer
 *                             example: 10
 *                           slot_number:
 *                             type: string
 *                             example: "A-05"
 *                           slot_status:
 *                             type: string
 *                             example: "empty"
 *                           cabinet_id:
 *                             type: integer
 *                             example: 2
 *                           battery_id:
 *                             type: string
 *                             nullable: true
 *                             example: null
 *       400:
 *         description: Missing station_id parameter
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "station_id là bắt buộc"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Lỗi khi lấy danh sách slot trống"
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /api/swap/empty-slots:
 *   get:
 *     summary: Lấy danh sách slot trống tại trạm
 *     tags: [Battery Swap]
 *     description: Lấy tất cả các slot có trạng thái 'empty' tại một trạm cụ thể
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: station_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của trạm cần lấy slot trống
 *         example: 1
 *     responses:
 *       200:
 *         description: Danh sách slot trống
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Lấy danh sách slot trống thành công"
 *                 data:
 *                   type: object
 *                   properties:
 *                     station_id:
 *                       type: integer
 *                       example: 1
 *                     total_empty_slots:
 *                       type: integer
 *                       example: 5
 *                     empty_slots:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           slot_id:
 *                             type: integer
 *                             example: 10
 *                           slot_number:
 *                             type: string
 *                             example: "A-05"
 *                           slot_status:
 *                             type: string
 *                             example: "empty"
 *                           cabinet_id:
 *                             type: integer
 *                             example: 2
 *                           battery_id:
 *                             type: string
 *                             nullable: true
 *                             example: null
 *       400:
 *         description: Missing station_id parameter
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "station_id là bắt buộc"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Lỗi khi lấy danh sách slot trống"
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /api/swap/check-first-time-pickup:
 *   get:
 *     summary: Kiểm tra xe có lấy pin lần đầu chưa
 *     tags: [Battery Swap]
 *     description: Kiểm tra xem một xe đã từng thực hiện swap pin hay chưa (để xác định có phải lần đầu không)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: vehicle_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID của xe cần kiểm tra
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: Kết quả kiểm tra
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Xe chưa lấy pin lần đầu"
 *                 data:
 *                   type: object
 *                   properties:
 *                     vehicle_id:
 *                       type: string
 *                       format: uuid
 *                       example: "550e8400-e29b-41d4-a716-446655440000"
 *                     license_plate:
 *                       type: string
 *                       example: "29A-12345"
 *                     model_name:
 *                       type: string
 *                       example: "VinFast VF8"
 *                     battery_type_id:
 *                       type: integer
 *                       example: 1
 *                     battery_quantity:
 *                       type: integer
 *                       example: 2
 *                     is_first_time:
 *                       type: boolean
 *                       example: true
 *                       description: true nếu xe chưa lấy pin lần đầu, false nếu đã lấy rồi
 *                     total_swap_count:
 *                       type: integer
 *                       example: 0
 *                       description: Tổng số lần đã swap pin
 *                     status:
 *                       type: string
 *                       enum: [never_swapped, has_swapped]
 *                       example: "never_swapped"
 *                     required_action:
 *                       type: string
 *                       example: "Use POST /api/swap/first-time-pickup or POST /api/swap/execute-first-time-with-booking"
 *       400:
 *         description: Missing vehicle_id parameter
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "vehicle_id là bắt buộc"
 *       404:
 *         description: Vehicle not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Không tìm thấy xe với vehicle_id đã cho"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Lỗi khi kiểm tra trạng thái lấy pin lần đầu"
 *                 error:
 *                   type: string
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
 *     summary: Thực hiện đổi pin không có booking (sau khi validate)
 *     tags: [Battery Swap]
 *     security:
 *       - bearerAuth: []
 *     description: Dùng khi đổi pin không có booking
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vehicle_id
 *               - station_id
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
 *     summary: Thực hiện đổi pin có booking (regular swap)
 *     tags: [Battery Swap]
 *     security:
 *       - bearerAuth: []
 *     description: Dùng khi đổi pin định kỳ với booking
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
 *     security:
 *       - bearerAuth: []
 *     description: Dùng khi chưa có swap_record cho xe này
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
router.post('/execute', verifyToken, swapBatteryController.executeSwap);
router.post('/execute-with-booking', verifyToken, swapBatteryController.executeSwapWithBooking);
router.post('/execute-first-time-with-booking', verifyToken, swapBatteryController.executeFirstTimePickupWithBooking); // ← THÊM MỚI
router.get('/available-batteries', verifyToken, swapBatteryController.getAvailableBatteries);
router.get('/empty-slots', verifyToken, swapBatteryController.getEmptySlots); // ← THÊM MỚI: Lấy slot trống
router.get('/check-first-time-pickup', verifyToken, swapBatteryController.checkFirstTimePickup); // ← THÊM MỚI: Kiểm tra first-time
router.post('/first-time-pickup', verifyToken, swapBatteryController.firstTimeBatteryPickup);

module.exports = router;