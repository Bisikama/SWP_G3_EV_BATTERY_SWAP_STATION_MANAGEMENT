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
 * /api/swap/empty-slots:
 *   get:
 *     summary: Lấy danh sách các ô pin đang trống
 *     tags: [Battery Swap]
 *     parameters:
 *       - in: query
 *         name: station_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của trạm
 *       - in: query
 *         name: cabinet_id
 *         schema:
 *           type: integer
 *         description: ID của tủ pin (optional)
 *     responses:
 *       200:
 *         description: Danh sách ô pin trống
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     station_id:
 *                       type: integer
 *                     cabinet_id:
 *                       type: integer
 *                     empty_slots_count:
 *                       type: integer
 *                     empty_slots:
 *                       type: array
 *                       items:
 *                         type: object
 *       400:
 *         description: Thiếu tham số bắt buộc
 *       500:
 *         description: Lỗi server
 */
router.get('/empty-slots', swapBatteryController.getEmptySlots);

/**
 * @swagger
 * /api/swap/available-batteries:
 *   get:
 *     summary: Kiểm tra pin sẵn sàng để đổi
 *     tags: [Battery Swap]
 *     parameters:
 *       - in: query
 *         name: station_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của trạm
 *       - in: query
 *         name: battery_type_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID loại pin
 *       - in: query
 *         name: quantity
 *         required: true
 *         schema:
 *           type: integer
 *         description: Số lượng pin cần
 *     responses:
 *       200:
 *         description: Danh sách pin sẵn sàng
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     station_id:
 *                       type: integer
 *                     battery_type_id:
 *                       type: integer
 *                     requested_quantity:
 *                       type: integer
 *                     available_quantity:
 *                       type: integer
 *                     has_enough:
 *                       type: boolean
 *                     available_batteries:
 *                       type: array
 *                       items:
 *                         type: object
 *       400:
 *         description: Thiếu tham số
 *       500:
 *         description: Lỗi server
 */
router.get('/available-batteries', swapBatteryController.getAvailableBatteries);

/**
 * @swagger
 * /api/swap/validate-insertion:
 *   post:
 *     summary: Xác nhận pin được đưa vào các slot
 *     tags: [Battery Swap]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - slotUpdates
 *             properties:
 *               slotUpdates:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     slot_id:
 *                       type: integer
 *                       description: ID của slot
 *                     battery_id:
 *                       type: string
 *                       format: uuid
 *                       description: ID của battery
 *           example:
 *             slotUpdates:
 *               - slot_id: 1
 *                 battery_id: "550e8400-e29b-41d4-a716-446655440000"
 *               - slot_id: 2
 *                 battery_id: "550e8400-e29b-41d4-a716-446655440001"
 *     responses:
 *       200:
 *         description: Tất cả pin hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     allValid:
 *                       type: boolean
 *                     results:
 *                       type: array
 *                       items:
 *                         type: object
 *       400:
 *         description: Có pin không hợp lệ
 *       500:
 *         description: Lỗi server
 */
router.post('/validate-insertion', swapBatteryController.validateBatteryInsertion);

/**
 * @swagger
 * /api/swap/execute:
 *   post:
 *     summary: Thực hiện đổi pin (transaction)
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
 *               - batteriesIn
 *               - batteriesOut
 *             properties:
 *               driver_id:
 *                 type: string
 *                 format: uuid
 *                 description: ID của driver
 *               vehicle_id:
 *                 type: string
 *                 format: uuid
 *                 description: ID của xe
 *               station_id:
 *                 type: integer
 *                 description: ID của trạm
 *               batteriesIn:
 *                 type: array
 *                 description: Pin cũ đưa vào
 *                 items:
 *                   type: object
 *                   properties:
 *                     slot_id:
 *                       type: integer
 *                     battery_id:
 *                       type: string
 *                       format: uuid
 *               batteriesOut:
 *                 type: array
 *                 description: Pin mới lấy ra
 *                 items:
 *                   type: object
 *                   properties:
 *                     slot_id:
 *                       type: integer
 *                     battery_id:
 *                       type: string
 *                       format: uuid
 *           example:
 *             driver_id: "550e8400-e29b-41d4-a716-446655440000"
 *             vehicle_id: "550e8400-e29b-41d4-a716-446655440001"
 *             station_id: 1
 *             batteriesIn:
 *               - slot_id: 1
 *                 battery_id: "old-battery-uuid-1"
 *               - slot_id: 2
 *                 battery_id: "old-battery-uuid-2"
 *             batteriesOut:
 *               - slot_id: 3
 *                 battery_id: "new-battery-uuid-1"
 *               - slot_id: 4
 *                 battery_id: "new-battery-uuid-2"
 *     responses:
 *       200:
 *         description: Đổi pin thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     driver_id:
 *                       type: string
 *                     vehicle_id:
 *                       type: string
 *                     station_id:
 *                       type: integer
 *                     swap_summary:
 *                       type: object
 *                     swap_results:
 *                       type: array
 *                     swap_records:
 *                       type: array
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       500:
 *         description: Lỗi server
 */
router.post('/execute', swapBatteryController.executeSwap);

module.exports = router;
