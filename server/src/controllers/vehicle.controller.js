// ========================================
// VEHICLE CONTROLLER
// ========================================
// File: src/controllers/vehicle.controller.js
// Mục đích: Xử lý các chức năng liên quan đến quản lý xe (CRUD operations)
// 
// Chức năng chính:
// 1. registerVehicle - Đăng ký xe mới cho tài xế
// 2. getMyVehicles - Lấy danh sách xe của tài xế đang đăng nhập
// 3. getVehicleByVin - Tra cứu thông tin xe theo VIN (public)
// ========================================

'use strict';
const { Vehicle, VehicleModel, Account } = require('../models');

/**
 * ========================================
 * REGISTER VEHICLE
 * ========================================
 * Endpoint: POST /api/user/vehicle/register
 * 
 * Mục đích: Đăng ký xe mới cho tài xế đã đăng nhập
 * 
 * Request body cần có:
 * - vin: string (17 ký tự, đã validate bởi validateVin middleware)
 * - model_id: number (ID của model xe, ví dụ: 1 = Tesla Model 3)
 * - license_plate: string (biển số xe, ví dụ: "30A-12345")
 * 
 * Flow hoạt động:
 * 1. Lấy thông tin từ JWT token (driver_id)
 * 2. Validate các trường bắt buộc
 * 3. Kiểm tra VIN đã tồn tại chưa (tránh trùng)
 * 4. Kiểm tra biển số đã tồn tại chưa (tránh trùng)
 * 5. Kiểm tra model_id có hợp lệ không
 * 6. Kiểm tra driver có quyền driver không
 * 7. Tạo bản ghi xe mới trong database
 * 8. Trả về thông tin xe vừa đăng ký
 * 
 * Security:
 * - driver_id lấy từ JWT token (req.user.account_id)
 * - Không cho phép user tự gửi driver_id (tránh spoofing)
 * ========================================
 */
async function registerVehicle(req, res) {
  try {
    // ===== BƯỚC 1: LẤY DỮ LIỆU TỪ REQUEST =====
    
    // Lấy thông tin từ request body
    const { vin, model_id, license_plate } = req.body;
    
    // Lấy driver_id từ JWT token (đã decode bởi verifyToken middleware)
    // req.user được tạo bởi middleware verifyToken
    // req.user chứa: { account_id, email, permission }
    const driver_id = req.user.account_id;

    // ===== BƯỚC 2: VALIDATE CÁC TRƯỜNG BẮT BUỘC =====
    
    // Kiểm tra VIN có tồn tại không
    // VIN đã được validate format bởi validateVin middleware
    // Ở đây chỉ cần kiểm tra có tồn tại không
    if (!vin) {
      return res.status(400).json({ message: 'VIN is required' });
    }

    // Kiểm tra model_id có tồn tại không
    // model_id là ID của model xe (1=Tesla Model 3, 2=VinFast VF8, ...)
    if (!model_id) {
      return res.status(400).json({ message: 'Vehicle model_id is required' });
    }

    // Kiểm tra biển số xe có tồn tại không
    if (!license_plate) {
      return res.status(400).json({ message: 'License plate is required' });
    }

    // ===== BƯỚC 3: KIỂM TRA VIN ĐÃ ĐĂNG KÝ CHƯA =====
    
    // Tìm kiếm xe có VIN này trong database
    // findOne: tìm 1 bản ghi khớp điều kiện
    const existingVehicleByVin = await Vehicle.findOne({ where: { vin } });
    
    // Nếu tìm thấy → VIN đã được đăng ký rồi
    if (existingVehicleByVin) {
      // HTTP 409 Conflict: tài nguyên đã tồn tại
      return res.status(409).json({ 
        message: 'VIN already registered',
        vin: vin
      });
    }

    // ===== BƯỚC 4: KIỂM TRA BIỂN SỐ ĐÃ ĐĂNG KÝ CHƯA =====
    
    // Tìm kiếm xe có biển số này trong database
    const existingVehicleByPlate = await Vehicle.findOne({ where: { license_plate } });
    
    // Nếu tìm thấy → biển số đã được đăng ký rồi
    if (existingVehicleByPlate) {
      return res.status(409).json({ 
        message: 'License plate already registered',
        license_plate: license_plate
      });
    }

    // ===== BƯỚC 5: KIỂM TRA MODEL_ID CÓ TỒN TẠI KHÔNG =====
    
    // Tìm kiếm model xe theo primary key (model_id)
    // findByPk: find by primary key
    const vehicleModel = await VehicleModel.findByPk(model_id);
    
    // Nếu không tìm thấy → model_id không hợp lệ
    if (!vehicleModel) {
      // HTTP 404 Not Found: không tìm thấy tài nguyên
      return res.status(404).json({ 
        message: 'Vehicle model not found',
        model_id: model_id
      });
    }

    // ===== BƯỚC 6: KIỂM TRA QUYỀN DRIVER =====
    
    // Tìm tài khoản driver theo driver_id
    const driver = await Account.findByPk(driver_id);
    
    // Kiểm tra:
    // - Tài khoản có tồn tại không
    // - Permission có phải là 'driver' không (không phải admin/staff)
    if (!driver || driver.permission !== 'driver') {
      // HTTP 403 Forbidden: không có quyền thực hiện hành động này
      return res.status(403).json({ 
        message: 'Only drivers can register vehicles'
      });
    }

    // ===== BƯỚC 7: TẠO BẢN GHI XE MỚI =====
    
    // Tạo xe mới trong database
    // create(): insert vào bảng Vehicles
    const newVehicle = await Vehicle.create({
      driver_id,      // ID tài xế (từ JWT token)
      model_id,       // ID model xe (từ request body)
      vin,            // VIN (đã validate)
      license_plate   // Biển số xe
    });

    // ===== BƯỚC 8: TRẢ VỀ THÔNG TIN XE VỪA TẠO =====
    
    // Lấy lại thông tin xe vừa tạo kèm theo thông tin model
    // include: join bảng VehicleModels
    const vehicleWithModel = await Vehicle.findByPk(newVehicle.vehicle_id, {
      include: [
        { 
          model: VehicleModel,  // Bảng cần join
          as: 'model',          // Alias (tên thay thế)
          // Chỉ lấy các trường cần thiết (tránh lấy hết)
          attributes: ['model_id', 'name', 'brand', 'avg_energy_usage']
        }
      ]
    });

    // Trả về response thành công
    // HTTP 201 Created: tạo tài nguyên mới thành công
    return res.status(201).json({
      message: 'Vehicle registered successfully',
      vehicle: vehicleWithModel
    });

  } catch (error) {
    // ===== XỬ LÝ LỖI =====
    
    console.error('Register vehicle error:', error);
    
    // Xử lý lỗi unique constraint từ Sequelize
    // Ví dụ: VIN hoặc license_plate trùng (bị bắt bởi database constraint)
    if (error.name === 'SequelizeUniqueConstraintError') {
      // Lấy tên field bị trùng
      const field = error.errors[0].path;
      
      return res.status(409).json({ 
        message: `${field} already exists`,
        field: field
      });
    }

    // Lỗi không xác định khác
    // HTTP 500 Internal Server Error
    return res.status(500).json({ 
      message: 'Internal server error',
      // Chỉ hiển thị chi tiết lỗi khi đang development
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}


/**
 * ========================================
 * GET MY VEHICLES
 * ========================================
 * Endpoint: GET /api/user/vehicle/my-vehicles
 * 
 * Mục đích: Lấy danh sách tất cả xe của tài xế đang đăng nhập
 * 
 * Yêu cầu:
 * - Phải đăng nhập (có JWT token)
 * - Middleware verifyToken đã chạy trước
 * 
 * Request body: Không cần (thông tin driver_id lấy từ JWT token)
 * 
 * Response:
 * - message: thông báo
 * - count: số lượng xe
 * - vehicles: mảng các xe (kèm thông tin model)
 * 
 * Use case:
 * - Tài xế xem danh sách xe đã đăng ký
 * - Hiển thị trên màn hình "Xe của tôi"
 * ========================================
 */
async function getMyVehicles(req, res) {
  try {
    // ===== BƯỚC 1: LẤY DRIVER_ID TỪ JWT TOKEN =====
    
    // req.user được tạo bởi middleware verifyToken
    // req.user chứa: { account_id, email, permission }
    const driver_id = req.user.account_id;

    // ===== BƯỚC 2: TÌM TẤT CẢ XE CỦA DRIVER =====
    
    // findAll: tìm tất cả bản ghi khớp điều kiện
    // where: { driver_id } → chỉ lấy xe của driver này
    const vehicles = await Vehicle.findAll({
      where: { driver_id },
      
      // include: join bảng liên quan để lấy thông tin model xe
      include: [
        { 
          model: VehicleModel,  // Bảng VehicleModels
          as: 'model',          // Alias: vehicle.model (thay vì vehicle.VehicleModel)
          
          // Chỉ lấy các trường cần thiết (tối ưu performance)
          attributes: ['model_id', 'name', 'brand', 'avg_energy_usage']
          
          // Kết quả: mỗi vehicle sẽ có property 'model' chứa thông tin model
          // Ví dụ: vehicle.model.name = "Tesla Model 3"
        }
      ]
    });

    // ===== BƯỚC 3: TRẢ VỀ KẾT QUẢ =====
    
    // HTTP 200 OK: thành công
    return res.status(200).json({
      message: 'Vehicles retrieved successfully',
      count: vehicles.length,  // Số lượng xe (dùng để hiển thị "Bạn có 3 xe")
      vehicles                  // Mảng các xe
    });

  } catch (error) {
    // ===== XỬ LÝ LỖI =====
    
    console.error('Get my vehicles error:', error);
    
    // HTTP 500 Internal Server Error
    return res.status(500).json({ message: 'Internal server error' });
  }
}


/**
 * ========================================
 * GET VEHICLE BY VIN
 * ========================================
 * Endpoint: GET /api/user/vehicle/:vin
 * 
 * Mục đích: Tra cứu thông tin chi tiết xe theo VIN
 * 
 * Đặc điểm:
 * - Public endpoint (không cần đăng nhập)
 * - Dùng để kiểm tra xe có tồn tại không
 * - Trả về thông tin xe + model + driver
 * 
 * Request params:
 * - vin: VIN của xe (17 ký tự)
 * 
 * Use case:
 * - Staff tra cứu xe khi khách hàng đến swap pin
 * - Admin kiểm tra thông tin xe
 * - Public API để verify VIN
 * 
 * Security note:
 * - Hiển thị thông tin driver (fullname, email, phone)
 * - Nếu cần bảo mật hơn → thêm middleware verifyToken
 * ========================================
 */
async function getVehicleByVin(req, res) {
  try {
    // ===== BƯỚC 1: LẤY VIN TỪ URL PARAMS =====
    
    // req.params.vin: lấy từ URL /api/user/vehicle/:vin
    // Ví dụ: URL = /api/user/vehicle/1HGBH41JXMN109186
    //        → req.params.vin = "1HGBH41JXMN109186"
    const { vin } = req.params;

    // ===== BƯỚC 2: TÌM XE THEO VIN =====
    
    // findOne: tìm 1 bản ghi khớp điều kiện
    const vehicle = await Vehicle.findOne({
      // where: điều kiện tìm kiếm
      // vin.toUpperCase(): chuẩn hóa VIN thành chữ HOA (tránh case-sensitive)
      where: { vin: vin.toUpperCase() },
      
      // include: join 2 bảng liên quan
      include: [
        { 
          // Bảng 1: VehicleModels (thông tin model xe)
          model: VehicleModel, 
          as: 'model',
          attributes: ['model_id', 'name', 'brand', 'avg_energy_usage']
          // Kết quả: vehicle.model.name = "Tesla Model 3"
        },
        {
          // Bảng 2: Accounts (thông tin chủ xe)
          model: Account,
          as: 'driver',
          attributes: ['account_id', 'fullname', 'email', 'phone_number']
          // Kết quả: vehicle.driver.fullname = "Nguyễn Văn A"
        }
      ]
    });

    // ===== BƯỚC 3: KIỂM TRA XE CÓ TỒN TẠI KHÔNG =====
    
    // Nếu không tìm thấy xe
    if (!vehicle) {
      // HTTP 404 Not Found: không tìm thấy tài nguyên
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    // ===== BƯỚC 4: TRẢ VỀ THÔNG TIN XE =====
    
    // HTTP 200 OK: thành công
    return res.status(200).json({
      message: 'Vehicle found',
      vehicle  // Thông tin xe đầy đủ (bao gồm model và driver)
      
      // Cấu trúc response:
      // {
      //   message: "Vehicle found",
      //   vehicle: {
      //     vehicle_id: "uuid...",
      //     vin: "1HGBH41JXMN109186",
      //     license_plate: "30A-12345",
      //     model: {
      //       name: "Tesla Model 3",
      //       brand: "Tesla",
      //       avg_energy_usage: 15.5
      //     },
      //     driver: {
      //       fullname: "Nguyễn Văn A",
      //       email: "a@example.com",
      //       phone_number: "0123456789"
      //     }
      //   }
      // }
    });

  } catch (error) {
    // ===== XỬ LÝ LỖI =====
    
    console.error('Get vehicle by VIN error:', error);
    
    // HTTP 500 Internal Server Error
    return res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * ========================================
 * DELETE VEHICLE
 * ========================================
 * Endpoint: DELETE /api/user/vehicle/:vehicle_id
 * 
 * Mục đích: Xóa xe đã đăng ký của tài xế
 * 
 * Yêu cầu:
 * - Phải đăng nhập (có JWT token)
 * - Chỉ xóa được xe của chính mình
 * - Không thể xóa xe của người khác
 * 
 * Request params:
 * - vehicle_id: UUID của xe cần xóa
 * 
 * Flow hoạt động:
 * 1. Lấy driver_id từ JWT token
 * 2. Tìm xe theo vehicle_id
 * 3. Kiểm tra xe có tồn tại không
 * 4. Kiểm tra xe có phải của driver này không
 * 5. Xóa xe khỏi database
 * 6. Trả về thông báo thành công
 * 
 * Use case:
 * - Tài xế bán xe, không dùng nữa
 * - Tài xế đăng ký nhầm
 * - Tài xế muốn đăng ký lại với thông tin mới
 * 
 * Security:
 * - Chỉ xóa được xe của chính mình (check driver_id)
 * - Không thể xóa xe của người khác
 * ========================================
 */
async function deleteVehicle(req, res) {
  try {
    // ===== BƯỚC 1: LẤY THÔNG TIN TỪ REQUEST =====
    
    // Lấy vehicle_id từ URL params
    // Ví dụ: DELETE /api/user/vehicle/550e8400-e29b-41d4-a716-446655440000
    //        → req.params.vehicle_id = "550e8400-e29b-41d4-a716-446655440000"
    const { vehicle_id } = req.params;
    
    // Lấy driver_id từ JWT token (đã decode bởi verifyToken middleware)
    // req.user chứa: { account_id, email, permission }
    const driver_id = req.user.account_id;

    // ===== BƯỚC 2: TÌM XE THEO VEHICLE_ID =====
    
    // Tìm xe trong database
    // findByPk: find by primary key (vehicle_id)
    const vehicle = await Vehicle.findByPk(vehicle_id);
    
    // ===== BƯỚC 3: KIỂM TRA XE CÓ TỒN TẠI KHÔNG =====
    
    // Nếu không tìm thấy xe
    if (!vehicle) {
      // HTTP 404 Not Found: không tìm thấy tài nguyên
      return res.status(404).json({ 
        message: 'Vehicle not found',
        vehicle_id: vehicle_id
      });
    }

    // ===== BƯỚC 4: KIỂM TRA XE CÓ PHẢI CỦA DRIVER NÀY KHÔNG =====
    
    // So sánh driver_id của xe với driver_id từ token
    // Nếu khác nhau → Xe không phải của driver này
    if (vehicle.driver_id !== driver_id) {
      // HTTP 403 Forbidden: không có quyền thực hiện hành động này
      return res.status(403).json({ 
        message: 'You can only delete your own vehicles',
        hint: 'This vehicle belongs to another driver'
      });
    }

    // ===== BƯỚC 5: XÓA XE KHỎI DATABASE =====
    
    // Lưu thông tin xe trước khi xóa (để trả về response)
    const deletedVehicleInfo = {
      vehicle_id: vehicle.vehicle_id,
      vin: vehicle.vin,
      license_plate: vehicle.license_plate
    };
    
    // Xóa xe khỏi database
    // destroy(): xóa bản ghi khỏi database
    await vehicle.destroy();

    // ===== BƯỚC 6: TRẢ VỀ THÔNG BÁO THÀNH CÔNG =====
    
    // HTTP 200 OK: xóa thành công
    return res.status(200).json({
      message: 'Vehicle deleted successfully',
      deleted_vehicle: deletedVehicleInfo
    });

  } catch (error) {
    // ===== XỬ LÝ LỖI =====
    
    console.error('Delete vehicle error:', error);
    
    // Xử lý lỗi foreign key constraint
    // Nếu xe đang được sử dụng trong bảng khác (SwapRecords, Bookings...)
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(409).json({ 
        message: 'Cannot delete vehicle',
        reason: 'Vehicle is being used in swap records or bookings',
        hint: 'Please contact admin to delete this vehicle'
      });
    }
    
    // Lỗi không xác định khác
    // HTTP 500 Internal Server Error
    return res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// ========================================
// EXPORT FUNCTIONS
// ========================================
// Export các function để sử dụng trong routes
module.exports = {
  registerVehicle,   // POST /api/user/vehicle/register
  getMyVehicles,     // GET /api/user/vehicle/my-vehicles
  getVehicleByVin,   // GET /api/user/vehicle/:vin
  deleteVehicle      // DELETE /api/user/vehicle/:vehicle_id
};
