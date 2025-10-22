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
 *     summary: Validate và chuẩn bị đổi pin (Kết hợp lấy empty slots + validate batteries)
 *     description: |
 *       API tổng hợp 3 chức năng:
 *       1. Lấy danh sách ô pin trống tại trạm
 *       2. Validate các pin đưa vào (kiểm tra có phải pin từ DB hay không)
 *       3. Kiểm tra có đủ pin sẵn sàng để đổi không (SOC >= 90%)
 *       
 *       **Trả về valid_batteries_in để dùng cho API execute**
 *     tags: [Battery Swap]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - station_id
 *               - battery_type_id
 *               - requested_quantity
 *               - batteriesIn
 *             properties:
 *               station_id:
 *                 type: integer
 *                 description: ID của trạm
 *               battery_type_id:
 *                 type: integer
 *                 description: ID loại pin
 *               requested_quantity:
 *                 type: integer
 *                 description: Số lượng pin muốn đổi
 *               batteriesIn:
 *                 type: array
 *                 description: Danh sách pin cũ đưa vào
 *                 items:
 *                   type: object
 *                   properties:
 *                     slot_id:
 *                       type: integer
 *                     battery_id:
 *                       type: string
 *                       format: uuid
 *           example:
 *             station_id: 1
 *             battery_type_id: 1
 *             requested_quantity: 2
 *             batteriesIn:
 *               - slot_id: 1
 *                 battery_id: "old-battery-uuid-1"
 *               - slot_id: 2
 *                 battery_id: "old-battery-uuid-2"
 *     responses:
 *       200:
 *         description: Validation thành công
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
 *                   description: Có cần xác nhận không (khi số pin hợp lệ < requested_quantity)
 *                 data:
 *                   type: object
 *                   properties:
 *                     validation_summary:
 *                       type: object
 *                     empty_slots:
 *                       type: array
 *                     valid_batteries_in:
 *                       type: array
 *                       description: Danh sách pin hợp lệ (dùng cho API execute)
 *                     invalid_batteries_in:
 *                       type: array
 *                     available_batteries_out:
 *                       type: array
 *       400:
 *         description: Validation thất bại
 *       500:
 *         description: Lỗi server
 */
router.post('/validate-and-prepare', swapBatteryController.validateAndPrepareSwap);

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
 * /api/swap/execute:
 *   post:
 *     summary: Thực hiện đổi pin (transaction) - Nhận kết quả từ validate
 *     description: |
 *       API sử dụng kết quả từ `/validate-and-prepare`:
 *       - Nhận `valid_batteries_in` (pin đã validate)
 *       - Tự động tìm pin mới từ DB (SOC >= 90%)
 *       - Thực hiện swap trong transaction
 *       
 *       **Frontend gọi validate trước, sau đó gọi execute với kết quả validate**
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
 *               - valid_batteries_in
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
 *               battery_type_id:
 *                 type: integer
 *                 description: ID của loại pin
 *               valid_batteries_in:
 *                 type: array
 *                 description: Danh sách pin hợp lệ (từ kết quả validate-and-prepare)
 *                 items:
 *                   type: object
 *                   properties:
 *                     slot_id:
 *                       type: integer
 *                     battery_id:
 *                       type: string
 *                       format: uuid
 *                     battery_soh:
 *                       type: number
 *                     battery_soc:
 *                       type: number
 *                     new_slot_status:
 *                       type: string
 *                       enum: [charging, faulty]
 *           example:
 *             driver_id: "550e8400-e29b-41d4-a716-446655440000"
 *             vehicle_id: "550e8400-e29b-41d4-a716-446655440001"
 *             station_id: 1
 *             battery_type_id: 1
 *             valid_batteries_in:
 *               - slot_id: 1
 *                 battery_id: "old-battery-uuid-1"
 *                 battery_soh: 85.5
 *                 battery_soc: 20.3
 *                 new_slot_status: "charging"
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
 *                     swap_summary:
 *                       type: object
 *                     batteries_out_info:
 *                       type: array
 *                       description: Pin mới đã cấp (tự động từ DB)
 *                     swap_results:
 *                       type: array
 *                     swap_records:
 *                       type: array
 *       400:
 *         description: Không đủ pin hoặc dữ liệu không hợp lệ
 *       500:
 *         description: Lỗi server
 */
router.post('/execute', swapBatteryController.executeSwap);

module.exports = router;
