# Battery Swap with Booking Flow (1-1)

## Tổng quan
Flow đổi pin mới với booking đặt trước, cho phép khách hàng đặt trước pin cụ thể và đổi pin theo lịch đã đặt.

**CẬP NHẬT MỚI:** Flow hiện tại hỗ trợ cả lần đầu tiên lấy pin (first-time pickup) và đổi pin thông thường với booking!

## Quy trình đổi pin với booking

### 1. Tạo booking trước (sử dụng API booking hiện có)
- Customer đặt lịch đổi pin tại trạm cụ thể
- Chọn các pin sẵn sàng (SOC >= 90%, status = 'ready')
- Booking được tạo với:
  - `status = 'pending'`
  - `scheduled_time`: Thời gian đã đặt
  - `create_time`: Thời gian tạo đơn
  - Pin được đặt lưu trong bảng `BookingBatteries`

### 2. Validate Swap với Booking (Unified Validation)

#### API Endpoint
```
POST /api/swap/validate-with-booking
```

#### Request Body
```json
{
  "booking_id": "uuid",
  "driver_id": "uuid",
  "vehicle_id": "uuid",
  "station_id": 1,
  "battery_type_id": 1,
  "batteriesIn": [  // ← Optional nếu là lần đầu tiên
    { "slot_id": 1, "battery_id": "uuid-old-1" },
    { "slot_id": 2, "battery_id": "uuid-old-2" }
  ]
}
```

#### Validation Steps

**Bước 1: Check Active Subscription**
- ✅ Kiểm tra vehicle có subscription hợp lệ không
- ✅ `status = 'active'` và `end_date >= now`

**Bước 2: Check If First-Time**
- ✅ Đếm số lần swap trong `SwapRecord` cho vehicle này
- ✅ Nếu `count = 0` → `is_first_time = true`
- ✅ Nếu `count > 0` → `is_first_time = false`

**Bước 3: Validate Booking**
- ✅ Booking tồn tại với `booking_id`, `vehicle_id`, `station_id`
- ✅ Booking có `status = 'pending'`
- ✅ Thời gian hiện tại nằm trong khoảng: `create_time <= now <= scheduled_time`

**Bước 4: Get Booked Batteries**
- ✅ Lấy danh sách pin đã đặt từ bảng `BookingBatteries`

**Bước 5: Validate Batteries IN (Conditional - Only if NOT first-time)**
- ✅ **Chỉ validate nếu `is_first_time = false`**
- ✅ Pin có tồn tại không
- ✅ Pin có thuộc về `vehicle_id` không (kiểm tra `battery.vehicle_id = vehicle_id`)
- ✅ Slot nhận pin có đang `empty` không
- ⚠️ **Không cho phép đổi pin của xe khác**

**Bước 6: Validate Booked Batteries Availability**
- ✅ Pin đã đặt có còn ở trạng thái `ready` không
- ✅ Pin đã đặt có còn trong slot không

#### Response
```json
{
  "success": true,
  "message": "Validation thành công! Sẵn sàng để thực hiện swap với booking",
  "is_first_time": false,  // ← Flag để frontend biết gọi API nào
  "data": {
    "validation_summary": {
      "is_first_time": false,
      "has_active_subscription": true,
      "booking_valid": true,
      "booking_id": "uuid",
      "booked_batteries_count": 2,
      "batteries_in_valid": true,  // Only present if NOT first-time
      "all_booked_batteries_available": true
    },
    "booked_batteries": [...],  // Pin đã đặt
    "valid_batteries_in": [...]  // Only present if NOT first-time
  }
}
```

### 3. Execute Swap (Phân nhánh dựa vào `is_first_time`)

#### 3.1. Nếu `is_first_time = true` → Gọi API First-Time Pickup

**API Endpoint:**
```
POST /api/swap/execute-first-time-with-booking
```

**Request Body:**
```json
{
  "booking_id": "uuid",
  "driver_id": "uuid",
  "vehicle_id": "uuid",
  "station_id": 1,
  "battery_type_id": 1,
  "bookedBatteries": [  // Lấy từ response validate
    { "slot_id": 1, "battery_id": "uuid-new-1" },
    { "slot_id": 2, "battery_id": "uuid-new-2" }
  ]
}
```

**Process:**
1. Không xử lý `batteriesIn` (không có pin cũ)
2. Chỉ xử lý `batteriesOut` từ booking
3. Tạo `SwapRecord` với `battery_id_in = null`, `soh_in = 0`
4. Update `vehicle.take_first = true`
5. Update `booking.status = 'completed'`

#### 3.2. Nếu `is_first_time = false` → Gọi API Regular Swap

**API Endpoint:**
```
POST /api/swap/execute-with-booking
```

**Request Body:**
```json
{
  "booking_id": "uuid",
  "driver_id": "uuid",
  "vehicle_id": "uuid",
  "station_id": 1,
  "battery_type_id": 1,
  "batteriesIn": [  // Pin cũ của xe
    { "slot_id": 3, "battery_id": "uuid-old-1" },
    { "slot_id": 4, "battery_id": "uuid-old-2" }
  ],
  "batteriesOut": [  // Từ booking (lấy từ validation response)
    { "slot_id": 1, "battery_id": "uuid-new-1" },
    { "slot_id": 2, "battery_id": "uuid-new-2" }
  ]
}
```

**Process:**
1. Xử lý `batteriesIn`: Update slot status (charging/faulty), gán slot_id
2. Xử lý `batteriesOut`: Gán pin mới cho xe, update slot = empty
3. Tạo `SwapRecord` với đầy đủ battery_id_in và battery_id_out
4. Update `booking.status = 'completed'`

### 4. Execute Swap Process Details

#### Step 1: Process Batteries IN (Only for regular swap)
```javascript
for (batteryIn of batteriesIn) {
  // Update slot status dựa vào SOH
  newSlotStatus = battery.soh < 15 ? 'faulty' : 'charging'
  
  // Update battery: slot_id = slot_id, vehicle_id = null
  // Update slot: status = newSlotStatus
}
```

#### Step 2: Process Batteries OUT (from Booking)
```javascript
for (bookedBattery of bookedBatteries) {
  // Tìm slot chứa pin đã đặt
  slot = findSlotByBatteryId(bookedBattery.battery_id)
  
  // Update slot: status = 'empty'
  // Update battery: slot_id = null, vehicle_id = vehicle_id
}
```

#### Step 3: Check First-time Swap (For regular swap only)
```javascript
existingSwapCount = countSwapRecords(vehicle_id, battery_id_in != null)
isFirstTimeSwap = (existingSwapCount === 0)
```

#### Step 4: Create Swap Records with booking_id
```javascript
for (i = 0; i < batteriesIn.length; i++) {
  // Create SwapRecord với booking_id
  swapRecord = createSwapRecord({
    driver_id,
    vehicle_id,
    station_id,
    booking_id,  // ← QUAN TRỌNG: Ghi nhận booking_id
    battery_id_in: batteriesIn[i].battery_id,
    battery_id_out: bookedBatteries[i].battery_id,
    soh_in: batteryInData.soh,
    soh_out: batteryOutData.soh
  })
  
  // Tính SOH usage (nếu không phải lần đầu)
  if (!isFirstTimeSwap) {
    previousSwap = findPreviousSwap(vehicle_id, battery_id_in)
    sohUsage += (swapRecord.soh_in - previousSwap.soh_out)
  }
}
```

#### Step 5: Update Subscription SOH Usage
```javascript
if (!isFirstTimeSwap && sohUsage !== 0) {
  subscription = findActiveSubscription(vehicle_id)
  subscription.soh_usage += sohUsage
}

if (isFirstTimeSwap) {
  vehicle.take_first = true
}
```

#### Step 6: Update Booking Status
```javascript
booking.status = 'completed'
```

## So sánh với Flow truyền thống

| Feature | Traditional Swap | Booking Swap |
|---------|-----------------|--------------|
| **Đặt trước** | ❌ Không | ✅ Có |
| **Pin OUT** | 🔄 Tìm pin available động | 📌 Pin đã được đặt trước |
| **Validation** | Pin ownership | Pin ownership + Booking validity |
| **Booking ID** | ❌ Không có | ✅ Lưu trong SwapRecord |
| **Booking Status** | N/A | pending → completed |

## Database Changes

### Migration: Add booking_id to SwapRecords
```javascript
// File: 20251025000000-add-booking-id-to-swap-record.js
await queryInterface.addColumn('SwapRecords', 'booking_id', {
  type: Sequelize.UUID,
  allowNull: true,
  references: {
    model: 'Bookings',
    key: 'booking_id'
  }
});
```

### Model Updates
```javascript
// SwapRecord model
booking_id: {
  type: DataTypes.UUID,
  allowNull: true,  // Nullable vì không phải swap nào cũng có booking
  references: {
    model: 'Bookings',
    key: 'booking_id'
  }
}

// Association
this.belongsTo(models.Booking, { as: 'booking', foreignKey: 'booking_id' });
```

## Error Handling

### 400 Bad Request Errors
1. **Missing booking_id**: "booking_id là bắt buộc"
2. **Booking not found**: "Không tìm thấy booking hợp lệ với vehicle_id và station_id đã cho"
3. **Booking time invalid**: "Booking không còn trong khoảng thời gian hợp lệ"
4. **No booked batteries**: "Booking không có pin nào được đặt trước"
5. **Battery count mismatch**: "Số lượng pin đưa vào không khớp với số lượng pin đã đặt"
6. **Invalid battery ownership**: "Battery không thuộc về xe này"
7. **Booked battery not ready**: "Pin đã đặt không còn sẵn sàng"

### 404 Not Found
- Booking không tồn tại
- Battery không tồn tại
- Slot không tìm thấy

### 500 Server Error
- Database transaction failed
- Unexpected errors

## Testing Guide

### Test Case 1: Happy Path
```json
// 1. Create booking
POST /api/bookings
{
  "driver_id": "driver-uuid",
  "vehicle_id": "vehicle-uuid",
  "station_id": 1,
  "scheduled_time": "2025-10-25T14:00:00Z",
  "batteries": ["battery-out-1", "battery-out-2"]
}

// 2. Swap with booking
POST /api/swap/validate-with-booking
{
  "booking_id": "booking-uuid",
  "driver_id": "driver-uuid",
  "vehicle_id": "vehicle-uuid",
  "station_id": 1,
  "battery_type_id": 1,
  "batteriesIn": [
    { "slot_id": 5, "battery_id": "battery-in-1" },
    { "slot_id": 6, "battery_id": "battery-in-2" }
  ]
}

// Expected: 200 OK, swap completed, booking status = 'completed'
```

### Test Case 2: Invalid Ownership
```json
// Swap với pin không thuộc vehicle
POST /api/swap/validate-with-booking
{
  "booking_id": "booking-uuid",
  "batteriesIn": [
    { "slot_id": 5, "battery_id": "other-vehicle-battery" }  // ❌
  ]
}

// Expected: 400 Bad Request - "Battery không thuộc về xe này"
```

### Test Case 3: Booking Expired
```json
// Thời gian hiện tại > scheduled_time
// Expected: 400 Bad Request - "Booking không còn trong khoảng thời gian hợp lệ"
```

### Test Case 4: Booked Battery Not Ready
```json
// Pin đã đặt bị lấy bởi người khác hoặc không còn ready
// Expected: 400 Bad Request - "Pin đã đặt không còn sẵn sàng"
```

## Service Functions

### New Functions
```javascript
// swap_battery.service.js
async function createSwapRecordWithBooking(swapData, transaction)

// Parameters: { driver_id, vehicle_id, station_id, booking_id, 
//              battery_id_in, battery_id_out, soh_in, soh_out }
```

### Updated Functions (with transaction support)
```javascript
async function updateSlotStatus(slot_id, status, transaction)
async function updateOldBatteryToSlot(battery_id, slot_id, transaction)
async function updateNewBatteryToVehicle(battery_id, vehicle_id, transaction)
async function createSwapRecord(swapData, transaction)
```

## Benefits

1. ✅ **Guaranteed Battery**: Customer được đảm bảo có pin đã chọn
2. ✅ **Scheduled Swap**: Đổi pin theo thời gian đã đặt
3. ✅ **Ownership Security**: Không cho phép đổi pin của xe khác
4. ✅ **Tracking**: Có thể trace swap records với booking
5. ✅ **Fair Queue**: Ưu tiên cho người đặt trước

## Notes

- ⚠️ Booking phải được tạo trước khi swap
- ⚠️ Pin đưa vào phải thuộc về vehicle (kiểm tra ownership nghiêm ngặt)
- ⚠️ Thời gian swap phải nằm trong khoảng `create_time` đến `scheduled_time`
- ⚠️ Pin đã đặt có thể bị lấy bởi người khác nếu booking hết hạn
- ✅ Hỗ trợ transaction để đảm bảo atomic operations
