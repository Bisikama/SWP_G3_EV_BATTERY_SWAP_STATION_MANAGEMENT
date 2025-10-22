User: 
file này có ý nghĩa gì và nó đang thực hiện việc nào

AI:
Đây là file định nghĩa model Sequelize cho bảng Account (server/src/models/account.js). Nó thực hiện các việc chính sau:

- Đăng ký class Account extends Model và khởi tạo (Account.init) các trường dữ liệu:
  - account_id, username, password_hash, fullname, phone_number, email, status, permission
- Định nghĩa các quan hệ (associations) giữa Account và các model khác (được gọi trong models/index):
  - Vai trò Admin: hasMany SubscriptionPlan, SupportTicket, Shift (foreignKey: admin_id)
  - Warehouse Manager: hasMany TransferRecord, hasOne Warehouse (foreignKey: manager_id)
  - Station Staff: hasMany TransferRecord, hasOne Shift (foreignKey: staff_id)
  - EV Driver: hasMany SupportTicket, Booking, Invoice, Subscription, Vehicle, SwapRecord (foreignKey: driver_id)
- Mục đích: cung cấp cấu trúc và quan hệ để Sequelize tạo truy vấn, eager-loading và ràng buộc khóa ngoại giữa các bảng.

Lưu ý / khả năng cần sửa:
- DataTypes.ENUM được khai báo nhưng không có danh sách giá trị — cần truyền các giá trị hợp lệ.
- account_id là UUID nhưng chưa được đặt primaryKey hoặc defaultValue (ví dụ DataTypes.UUIDV4).
- Có thể cần thêm ràng buộc unique/allowNull cho username/email và kiểu dữ liệu/độ dài phù hợp.
- Kiểm tra các model liên quan để đảm bảo foreignKey trùng khớp với 'as' bạn đã dùng.

Ví dụ sửa nhanh để đặt account_id là khóa chính và khai báo ENUM (chỉ ví dụ — chỉnh giá trị enum theo yêu cầu):

````javascript
// ...existing code...
  Account.init({
-    account_id: DataTypes.UUID,
-    username: DataTypes.STRING,
-    password_hash: DataTypes.STRING,
-    fullname: DataTypes.STRING,
-    phone_number: DataTypes.STRING,
-    email: DataTypes.STRING,
-    status: DataTypes.ENUM,
-    permission: DataTypes.ENUM
+    account_id: {
+      type: DataTypes.UUID,
+      defaultValue: DataTypes.UUIDV4,
+      primaryKey: true
+    },
+    username: { type: DataTypes.STRING, allowNull: false, unique: true },
+    password_hash: { type: DataTypes.STRING, allowNull: false },
+    fullname: DataTypes.STRING,
+    phone_number: DataTypes.STRING,
+    email: { type: DataTypes.STRING, allowNull: false, unique: true },
+    status: { type: DataTypes.ENUM('active', 'inactive', 'banned'), defaultValue: 'active' },
+    permission: { type: DataTypes.ENUM('admin', 'manager', 'staff', 'driver'), allowNull: false }
   }, {
     sequelize,
     modelName: 'Account',
   });
// ...existing code...
````

Muốn mình cập nhật file theo gợi ý trên không?

User:
lỗi này là sao PS D:\session5\1_SWP391\SWP_BACKEND\SWP_G3_EV_BATTERY_SWAP_STATION_MANAGEMENT\server> node server.js
[dotenv@17.2.3] injecting env (0) from .env -- tip: 📡 add observability to secrets: https://dotenvx.com/ops
Server running at http://localhost:undefined

AI:
Lỗi này do process.env.PORT là undefined — dotenv đã load nhưng bạn không có biến PORT trong .env (hoặc không có giá trị). Vì vậy console in ra "http://localhost:undefined".

Sửa nhanh: cung cấp giá trị mặc định hoặc thêm PORT vào file .env.

1) Thay server.js để dùng giá trị mặc định (ví dụ 3000):

````javascript
// ...existing code...
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerDocs = require('./src/config/swagger.config');
require('dotenv').config();

const userRoutes = require('./src/routes/user.route');

const app = express();
app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// routes
app.use('/api/user', userRoutes);

// start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
// ...existing code...
````

2) Hoặc thêm file .env ở thư mục server (hoặc gốc project nếu đó là nơi bạn load dotenv) với nội dung:
PORT=3000

Trên PowerShell tạm thời bạn cũng có thể chạy:
$env:PORT=3000; node server.js

Chọn 1 trong 2 cách trên; muốn mình cập nhật file server.js cho bạn không?

---

## 📧 EMAIL VERIFICATION SYSTEM - SIMPLIFIED 6-DIGIT CODE FLOW

### User (October 17, 2025):
Bây giờ mình muốn làm đơn giản hơn, cả reset password và validate email thì gọi api. Sẽ tạo ra 1 con số ngẫu nhiên gồm 6 chữ số và gửi qua gmail

### AI:
Hiểu rồi! Bạn muốn đơn giản hóa flow:
- **Trước đây**: Tạo 3 mã số, user chọn 1 trong 3
- **Bây giờ**: Chỉ tạo 1 mã 6 chữ số và gửi qua Gmail

Tôi sẽ cập nhật:

1. **Email Verification (Register)**:
   - Request verification → Tạo 1 mã 6 số → Gửi qua email
   - User nhập mã → Verify

2. **Password Reset**:
   - Request reset → Tạo 1 mã 6 số → Gửi qua email  
   - User nhập mã + new password → Reset

#### Thay đổi code:

**1. emailService.js - Tạo mã 6 chữ số:**
```javascript
// Tạo mã xác thực 6 chữ số
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Gửi email verification với 1 mã
const sendVerificationEmail = async (toEmail, code) => {
  const mailOptions = {
    from: `"VinStation Support" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: '🔑 Mã xác thực đăng ký tài khoản',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Xác thực email của bạn</h2>
        <p>Mã xác thực của bạn là:</p>
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    color: white; 
                    font-size: 32px; 
                    font-weight: bold; 
                    padding: 20px; 
                    text-align: center; 
                    border-radius: 10px; 
                    letter-spacing: 8px;">
          ${code}
        </div>
        <p style="margin-top: 20px;">Mã có hiệu lực trong <strong>10 phút</strong>.</p>
        <p>Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email.</p>
      </div>
    `
  };
  
  const info = await transporter.sendMail(mailOptions);
  return info;
};

// Gửi email reset password với 1 mã
const sendPasswordResetEmail = async (toEmail, code) => {
  const mailOptions = {
    from: `"VinStation Support" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: '🔐 Đặt lại mật khẩu',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Yêu cầu đặt lại mật khẩu</h2>
        <p>Mã xác thực đặt lại mật khẩu của bạn là:</p>
        <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); 
                    color: white; 
                    font-size: 32px; 
                    font-weight: bold; 
                    padding: 20px; 
                    text-align: center; 
                    border-radius: 10px; 
                    letter-spacing: 8px;">
          ${code}
        </div>
        <p style="margin-top: 20px;">Mã có hiệu lực trong <strong>10 phút</strong>.</p>
        <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email.</p>
      </div>
    `
  };
  
  const info = await transporter.sendMail(mailOptions);
  return info;
};
```

**2. user.controller.js - Request Email Verification:**
```javascript
const requestEmailVerification = async (req, res) => {
  try {
    const { email } = req.body;
    
    // Tạo mã 6 số
    const code = generateVerificationCode();
    const hashedCode = hashCode(code);
    
    // Xóa các challenge cũ cho email này
    await EmailChallenge.destroy({
      where: { email, purpose: 'register' }
    });
    
    // Tạo challenge mới
    await EmailChallenge.create({
      challenge_id: uuidv4(),
      email,
      hashed_code: hashedCode,
      expires_at: new Date(Date.now() + 10 * 60 * 1000), // 10 phút
      purpose: 'register'
    });
    
    // Gửi email
    await sendVerificationEmail(email, code);
    
    res.json({
      message: 'Mã xác thực đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
```

**3. user.controller.js - Request Password Reset:**
```javascript
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    
    const account = await Account.findOne({ where: { email } });
    if (!account) {
      return res.status(404).json({ message: 'Email không tồn tại' });
    }
    
    // Tạo mã 6 số
    const code = generateVerificationCode();
    const hashedCode = hashCode(code);
    
    // Xóa các challenge cũ
    await EmailChallenge.destroy({
      where: { email, purpose: 'reset_password' }
    });
    
    // Tạo challenge mới
    await EmailChallenge.create({
      challenge_id: uuidv4(),
      email,
      hashed_code: hashedCode,
      expires_at: new Date(Date.now() + 10 * 60 * 1000),
      purpose: 'reset_password'
    });
    
    // Gửi email
    await sendPasswordResetEmail(email, code);
    
    res.json({
      message: 'Mã xác thực đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
```

**4. user.controller.js - Reset Password (với mã):**
```javascript
const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    
    const hashedCode = hashCode(code);
    
    // Tìm challenge
    const challenge = await EmailChallenge.findOne({
      where: {
        email,
        hashed_code: hashedCode,
        purpose: 'reset_password',
        used: false,
        expires_at: { [Op.gt]: new Date() }
      }
    });
    
    if (!challenge) {
      return res.status(400).json({ 
        message: 'Mã xác thực không hợp lệ hoặc đã hết hạn' 
      });
    }
    
    // Validate password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ 
        message: passwordValidation.errors.join(', ') 
      });
    }
    
    // Update password
    const account = await Account.findOne({ where: { email } });
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await account.update({ password_hash: hashedPassword });
    
    // Đánh dấu challenge đã dùng
    await challenge.update({ used: true });
    
    // Gửi email xác nhận
    await sendPasswordChangeConfirmation(email);
    
    res.json({ message: 'Đặt lại mật khẩu thành công' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
```

**5. Swagger Documentation Updates:**
```javascript
/**
 * @swagger
 * /api/user/request-verification:
 *   post:
 *     summary: Yêu cầu mã xác thực email
 *     description: Gửi 1 mã 6 chữ số qua email để xác thực
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Mã đã được gửi
 */

/**
 * @swagger
 * /api/user/verify-email:
 *   post:
 *     summary: Xác thực email bằng mã 6 số
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               code:
 *                 type: string
 *                 description: Mã 6 chữ số
 */

/**
 * @swagger
 * /api/user/forgot-password:
 *   post:
 *     summary: Yêu cầu mã đặt lại mật khẩu
 *     description: Gửi mã 6 số qua email
 */

/**
 * @swagger
 * /api/user/reset-password:
 *   post:
 *     summary: Đặt lại mật khẩu bằng mã
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               code:
 *                 type: string
 *               newPassword:
 *                 type: string
 */
```

### Key Changes Summary:
✅ **Single 6-digit code** instead of 3 options
✅ **Same flow** for both email verification and password reset
✅ **Email templates** with beautiful gradient backgrounds
✅ **10-minute expiry** for all codes
✅ **One-time use** - codes marked as used after verification
✅ **SHA256 hashing** for security

### Testing Flow:

**Email Verification:**
1. POST `/api/user/request-verification` → Nhận mã qua email
2. Nhập mã → POST `/api/user/verify-email`
3. POST `/api/user/register` → Hoàn tất đăng ký

**Password Reset:**
1. POST `/api/user/forgot-password` → Nhận mã qua email
2. Nhập mã + mật khẩu mới → POST `/api/user/reset-password`

Muốn tôi implement những thay đổi này không?

---

### Implementation Complete ✅

All changes have been implemented successfully:

**Files Modified:**
- ✅ `server/src/utils/emailService.js` - Simplified to single 6-digit code
- ✅ `server/src/controllers/user.controller.js` - Updated all verification flows
- ✅ `server/src/routes/user.route.js` - Updated Swagger documentation
- ✅ Fixed shuffle function error
- ✅ Server running successfully on port 3000
- ✅ Email verification tested and working
- ✅ Password reset tested and working

**Test Results:**
- Password reset email sent: `<875d68a8-47bc-267c-3713-b3da98e8e341@gmail.com>`
- Verification email sent: `<43f1b447-135c-81fc-9b65-b7f72d0765f5@gmail.com>`
- Password change confirmation: `<284fb346-48e5-5bc6-ed14-9a8af495ee75@gmail.com>`

**Documentation:**
- Created `TEST_NEW_FLOW.md` with complete API documentation
- Includes frontend integration examples
- UI component examples for 6-digit code input
- Security notes and best practices





const swapBatteryService = require('../services/swap_battery.service');
const db = require('../models');

/**
 * API 4: Validate và lấy danh sách ô pin trống + kiểm tra pin đưa vào
 * POST /api/swap/validate-and-prepare
 * Body:
 * {
 *   "station_id": 1,
 *   "battery_type_id": 1,
 *   "requested_quantity": 2,
 *   "batteriesIn": [
 *     { "slot_id": 1, "battery_id": "uuid-old-1" },
 *     { "slot_id": 2, "battery_id": "uuid-old-2" }
 *   ]
 * }
 */
async function validateAndPrepareSwap(req, res) {
  try {
    const { station_id, battery_type_id, requested_quantity, batteriesIn } = req.body;

    // Validation input
    if (!station_id || !battery_type_id || !requested_quantity) {
      return res.status(400).json({
        success: false,
        message: 'station_id, battery_type_id, requested_quantity là bắt buộc'
      });
    }

    if (!batteriesIn || !Array.isArray(batteriesIn) || batteriesIn.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'batteriesIn phải là mảng không rỗng'
      });
    }

    // Kiểm tra số lượng pin đưa vào không vượt quá số lượng yêu cầu
    if (batteriesIn.length > requested_quantity) {
      return res.status(400).json({
        success: false,
        message: `Số lượng pin đưa vào (${batteriesIn.length}) vượt quá số lượng đã chọn đổi (${requested_quantity})`,
        data: {
          batteries_in_count: batteriesIn.length,
          requested_quantity: requested_quantity
        }
      });
    }

    console.log(`\n🔍 ========== VALIDATING SWAP PREPARATION ==========`);
    console.log(`Station: ${station_id}`);
    console.log(`Battery Type: ${battery_type_id}`);
    console.log(`Requested Quantity: ${requested_quantity}`);
    console.log(`Batteries IN: ${batteriesIn.length}`);

    // Bước 1: Lấy danh sách ô pin trống
    console.log('\n📍 Step 1: Getting empty slots...');
    const emptySlots = await swapBatteryService.getEmptySlots(parseInt(station_id));
    console.log(`✅ Found ${emptySlots.length} empty slot(s)`);

    // Bước 2: Validate pin đưa vào
    console.log('\n🔍 Step 2: Validating batteries IN...');
    const validation = await swapBatteryService.validateBatteryInsertion(batteriesIn);

    // Lọc ra các pin hợp lệ
    const validBatteries = validation.results.filter(r => r.valid);
    const invalidBatteries = validation.results.filter(r => !r.valid);

    console.log(`✅ Valid batteries: ${validBatteries.length}/${batteriesIn.length}`);
    if (invalidBatteries.length > 0) {
      console.log(`❌ Invalid batteries: ${invalidBatteries.length}`);
    }

    // Bước 3: Kiểm tra pin sẵn sàng để đổi
    console.log('\n🔋 Step 3: Checking available batteries for swap...');
    const availableSlots = await swapBatteryService.getAvailableBatteriesForSwap(
      parseInt(station_id),
      parseInt(battery_type_id),
      validBatteries.length // Chỉ cần đủ số lượng pin hợp lệ
    );

    console.log(`✅ Available batteries (SOC >= 90%): ${availableSlots.length}/${validBatteries.length}`);

    // Kiểm tra các điều kiện
    const hasEnoughValidBatteries = validBatteries.length === requested_quantity;
    const hasEnoughAvailableBatteries = availableSlots.length >= validBatteries.length;
    const canProceed = validBatteries.length > 0 && hasEnoughAvailableBatteries;

    // Xác định message và status
    let responseStatus = 200;
    let responseMessage = '';
    let requireConfirmation = false;

    if (validBatteries.length === 0) {
      // Không có pin hợp lệ
      responseStatus = 400;
      responseMessage = 'Không có viên pin nào hợp lệ. Vui lòng kiểm tra lại các pin đưa vào.';
    } else if (!hasEnoughAvailableBatteries) {
      // Không đủ pin để đổi
      responseStatus = 400;
      responseMessage = `Không đủ pin sẵn sàng để đổi. Cần ${validBatteries.length} pin, chỉ có ${availableSlots.length} pin (SOC >= 90%)`;
    } else if (!hasEnoughValidBatteries) {
      // Có pin hợp lệ nhưng ít hơn số lượng yêu cầu
      responseStatus = 200;
      requireConfirmation = true;
      responseMessage = `Chỉ có ${validBatteries.length}/${requested_quantity} viên pin hợp lệ. Bạn có muốn tiếp tục đổi ${validBatteries.length} pin?`;
    } else {
      // Tất cả đều hợp lệ
      responseStatus = 200;
      responseMessage = `Tất cả ${validBatteries.length} pin đều hợp lệ và có đủ pin sẵn sàng để đổi.`;
    }

    console.log(`\n📊 Validation Result: ${responseMessage}`);
    console.log(`✅ ========== VALIDATION COMPLETE ==========\n`);

    return res.status(responseStatus).json({
      success: canProceed,
      message: responseMessage,
      require_confirmation: requireConfirmation,
      data: {
        station_id: parseInt(station_id),
        battery_type_id: parseInt(battery_type_id),
        requested_quantity: requested_quantity,
        validation_summary: {
          total_batteries_in: batteriesIn.length,
          valid_batteries: validBatteries.length,
          invalid_batteries: invalidBatteries.length,
          available_batteries_out: availableSlots.length,
          can_proceed: canProceed
        },
        empty_slots: emptySlots.map(slot => ({
          slot_id: slot.slot_id,
          slot_number: slot.slot_number,
          cabinet_id: slot.cabinet_id,
          cabinet_name: slot.cabinet?.cabinet_name
        })),
        valid_batteries_in: validBatteries.map(v => ({
          slot_id: v.slot_id,
          battery_id: v.battery_id,
          battery_soh: v.battery_soh,
          battery_soc: v.battery_soc,
          new_slot_status: v.new_slot_status
        })),
        invalid_batteries_in: invalidBatteries.map(v => ({
          slot_id: v.slot_id,
          battery_id: v.battery_id,
          error: v.error
        })),
        available_batteries_out: availableSlots.map(slot => ({
          slot_id: slot.slot_id,
          slot_number: slot.slot_number,
          battery_id: slot.battery.battery_id,
          battery_serial: slot.battery.battery_serial,
          current_soc: slot.battery.current_soc,
          current_soh: slot.battery.current_soh
        }))
      }
    });
  } catch (error) {
    console.error('❌ Error in validateAndPrepareSwap:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi validate và chuẩn bị đổi pin',
      error: error.message
    });
  }
}

/**
 * API 5: Thực hiện swap pin (transaction)
 * POST /api/swap/execute
 * Body:
 * {
 *   "driver_id": "uuid",
 *   "vehicle_id": "uuid",
 *   "station_id": 1,
 *   "battery_type_id": 1,
 *   "batteriesIn": [
 *     { "slot_id": 1, "battery_id": "uuid-old-1" },
 *     { "slot_id": 2, "battery_id": "uuid-old-2" }
 *   ]
 * }
 */
async function executeSwap(req, res) {
  const transaction = await db.sequelize.transaction();

  try {
    const {
      driver_id,
      vehicle_id,
      station_id,
      battery_type_id,  // Loại pin cần lấy
      batteriesIn       // Pin cũ đưa vào
    } = req.body;

    // Validation
    if (!driver_id || !vehicle_id || !station_id || !battery_type_id) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'driver_id, vehicle_id, station_id, battery_type_id là bắt buộc'
      });
    }

    if (!batteriesIn || !Array.isArray(batteriesIn) || batteriesIn.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'batteriesIn phải là mảng không rỗng'
      });
    }

    console.log(`\n🔄 ========== EXECUTING BATTERY SWAP ==========`);
    console.log(`Driver: ${driver_id}`);
    console.log(`Vehicle: ${vehicle_id}`);
    console.log(`Station: ${station_id}`);
    console.log(`Battery Type: ${battery_type_id}`);
    console.log(`Batteries IN: ${batteriesIn.length}`);

    const swapResults = [];

    // Bước 1: Xử lý pin cũ đưa vào (batteriesIn)
    console.log('\n📥 Step 1: Processing batteries IN (old batteries)...');
    for (const batteryIn of batteriesIn) {
      const { slot_id, battery_id } = batteryIn;

      // Lấy thông tin battery để check SOH
      const battery = await db.Battery.findByPk(battery_id, { transaction });
      if (!battery) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: `Battery ${battery_id} không tồn tại`
        });
      }

      const soh_in = battery.current_soh;

      // Xác định status của slot dựa vào SOH
      const newSlotStatus = soh_in < 15 ? 'faulty' : 'charging';

      console.log(`  📦 Battery ${battery_id} (SOH: ${soh_in}%) → Slot ${slot_id} (status: ${newSlotStatus})`);

      // Cập nhật slot status
      await swapBatteryService.updateSlotStatus(slot_id, newSlotStatus);

      // Cập nhật battery: gán vào slot, remove khỏi vehicle
      await swapBatteryService.updateOldBatteryToSlot(battery_id, slot_id);

      swapResults.push({
        type: 'IN',
        battery_id,
        slot_id,
        soh: soh_in,
        slot_status: newSlotStatus
      });
    }

    // Bước 2: TỰ ĐỘNG lấy pin mới từ DB (không nhận từ frontend)
    console.log('\n� Step 2: Finding available batteries to swap OUT...');
    
    // Tìm pin sẵn sàng từ DB: current_soc >= 90%, đúng loại pin, đủ số lượng
    const requiredQuantity = batteriesIn.length;
    const availableSlots = await swapBatteryService.getAvailableBatteriesForSwap(
      parseInt(station_id),
      parseInt(battery_type_id),
      requiredQuantity
    );

    if (availableSlots.length < requiredQuantity) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Không đủ pin để đổi. Cần ${requiredQuantity} pin, chỉ có ${availableSlots.length} pin sẵn sàng (SOC >= 90%)`,
        data: {
          required: requiredQuantity,
          available: availableSlots.length
        }
      });
    }

    console.log(`✅ Found ${availableSlots.length} available batteries (SOC >= 90%)`);

    // Bước 3: Xử lý pin mới lấy ra (batteriesOut - tự động từ DB)
    console.log('\n📤 Step 3: Processing batteries OUT (new batteries from DB)...');
    const batteriesOut = [];
    
    for (const slot of availableSlots) {
      const battery_id = slot.battery.battery_id;
      const slot_id = slot.slot_id;
      const soh_out = slot.battery.current_soh;
      const soc_out = slot.battery.current_soc;

      console.log(`  📦 Battery ${battery_id} (SOC: ${soc_out}%, SOH: ${soh_out}%) ← Slot ${slot_id}`);

      // Cập nhật slot thành empty
      await swapBatteryService.updateSlotStatus(slot_id, 'empty');

      // Cập nhật battery: gán cho vehicle, remove khỏi slot
      await swapBatteryService.updateNewBatteryToVehicle(battery_id, vehicle_id);

      batteriesOut.push({
        slot_id,
        battery_id,
        soc: soc_out,
        soh: soh_out
      });

      swapResults.push({
        type: 'OUT',
        battery_id,
        slot_id,
        soc: soc_out,
        soh: soh_out,
        slot_status: 'empty'
      });
    }

    // Bước 4: Tạo swap records
    console.log('\n📝 Step 4: Creating swap records...');
    const swapRecords = [];

    // Tạo swap record cho từng cặp pin (1-1)
    for (let i = 0; i < batteriesIn.length; i++) {
      const batteryIn = batteriesIn[i];
      const batteryOut = batteriesOut[i];

      const batteryInData = await db.Battery.findByPk(batteryIn.battery_id, { transaction });
      const batteryOutData = await db.Battery.findByPk(batteryOut.battery_id, { transaction });

      const swapRecord = await swapBatteryService.createSwapRecord({
        driver_id,
        vehicle_id,
        station_id,
        battery_id_in: batteryIn.battery_id,
        battery_id_out: batteryOut.battery_id,
        soh_in: batteryInData.current_soh,
        soh_out: batteryOutData.current_soh
      });

      swapRecords.push(swapRecord);
      console.log(`  ✅ Swap record created: ${swapRecord.swap_id}`);
    }

    await transaction.commit();

    console.log('\n✅ ========== SWAP COMPLETED SUCCESSFULLY ==========\n');

    return res.status(200).json({
      success: true,
      message: 'Đổi pin thành công',
      data: {
        driver_id,
        vehicle_id,
        station_id,
        battery_type_id,
        swap_summary: {
          batteries_in: batteriesIn.length,
          batteries_out: batteriesOut.length,
          swap_records: swapRecords.length
        },
        batteries_out_info: batteriesOut, // Thông tin pin mới đã lấy
        swap_results: swapResults,
        swap_records: swapRecords
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('\n❌ Error in executeSwap:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi thực hiện đổi pin',
      error: error.message
    });
  }
}

/**
 * API 5: Lấy danh sách pin sẵn sàng để đổi
 * GET /api/swap/available-batteries
 * Query params:
 *   - station_id: ID của trạm (required)
 *   - battery_type_id: ID của loại pin (required)
 *   - quantity: Số lượng pin cần (required)
 */
async function getAvailableBatteries(req, res) {
  try {
    const { station_id, battery_type_id, quantity } = req.query;

    if (!station_id || !battery_type_id || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'station_id, battery_type_id, quantity là bắt buộc'
      });
    }

    console.log(`\n🔋 Getting available batteries: station=${station_id}, type=${battery_type_id}, qty=${quantity}`);

    const availableSlots = await swapBatteryService.getAvailableBatteriesForSwap(
      parseInt(station_id),
      parseInt(battery_type_id),
      parseInt(quantity)
    );

    const hasEnough = availableSlots.length >= parseInt(quantity);

    console.log(`✅ Found ${availableSlots.length}/${quantity} available batteries`);

    return res.status(200).json({
      success: true,
      message: hasEnough
        ? `Đủ pin để đổi (${availableSlots.length}/${quantity})`
        : `Không đủ pin để đổi (${availableSlots.length}/${quantity})`,
      data: {
        station_id: parseInt(station_id),
        battery_type_id: parseInt(battery_type_id),
        requested_quantity: parseInt(quantity),
        available_quantity: availableSlots.length,
        has_enough: hasEnough,
        available_batteries: availableSlots.map(slot => ({
          slot_id: slot.slot_id,
          slot_number: slot.slot_number,
          battery_id: slot.battery.battery_id,
          battery_serial: slot.battery.battery_serial,
          current_soc: slot.battery.current_soc,
          current_soh: slot.battery.current_soh,
          cabinet: slot.cabinet
        }))
      }
    });
  } catch (error) {
    console.error('❌ Error in getAvailableBatteries:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách pin sẵn sàng',
      error: error.message
    });
  }
}

module.exports = {
  validateAndPrepareSwap,
  executeSwap,
  getAvailableBatteries
};
