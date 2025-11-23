# Battery Swap Flow - Separated Validate & Execute

## Tổng quan
Flow đổi pin mới với validate và execute tách biệt, frontend có quyền quyết định có execute hay không sau khi validate.

---

## 🔄 Flow 1: Traditional Swap (Không có booking)

### Step 1: Validate
**API**: `POST /api/swap/validate-and-prepare`

**Request**:
```json
{
  "driver_id": "uuid",
  "vehicle_id": "uuid",
  "station_id": 1,
  "battery_type_id": 1,
  "requested_quantity": 2,
  "batteriesIn": [
    { "slot_id": 5, "battery_id": "old-battery-1" },
    { "slot_id": 6, "battery_id": "old-battery-2" }
  ]
}
```

**Response** (Success - Ready to Execute):
```json
{
  "success": true,
  "message": "Tất cả 2 pin đều hợp lệ. Sẵn sàng để đổi pin.",
  "require_confirmation": false,
  "ready_to_execute": true,  // ← Frontend check flag này
  "data": {
    "driver_id": "uuid",
    "vehicle_id": "uuid",
    "station_id": 1,
    "battery_type_id": 1,
    "requested_quantity": 2,
    "validation_summary": {
      "total_batteries_in": 2,
      "valid_batteries": 2,
      "invalid_batteries": 0,
      "available_batteries_out": 2,
      "can_proceed": true
    },
    "valid_batteries_in": [...],
    "invalid_batteries_in": [],
    "available_batteries_out": [...]
  }
}
```

**Response** (Need Confirmation):
```json
{
  "success": true,
  "message": "Chỉ có 1/2 viên pin hợp lệ. Bạn có muốn tiếp tục đổi 1 pin?",
  "require_confirmation": true,   // ← Frontend hiện dialog confirm
  "ready_to_execute": true,       // ← Có thể execute nếu user confirm
  "data": { ... }
}
```

**Response** (Error - Cannot Execute):
```json
{
  "success": false,
  "message": "Không có viên pin nào hợp lệ. Vui lòng kiểm tra lại các pin đưa vào.",
  "require_confirmation": false,
  "ready_to_execute": false,  // ← Không thể execute
  "data": { ... }
}
```

### Step 2: Execute (sau khi frontend quyết định)
**API**: `POST /api/swap/execute`

**Request** (Sử dụng data từ validate response):
```json
{
  "driver_id": "uuid",
  "vehicle_id": "uuid",
  "station_id": 1,
  "battery_type_id": 1,
  "batteriesIn": [
    { "slot_id": 5, "battery_id": "old-battery-1" },
    { "slot_id": 6, "battery_id": "old-battery-2" }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "message": "Đổi pin thành công",
  "data": {
    "driver_id": "uuid",
    "vehicle_id": "uuid",
    "station_id": 1,
    "battery_type_id": 1,
    "swap_summary": {
      "batteries_in": 2,
      "batteries_out": 2,
      "swap_records": 2
    },
    "batteries_out_info": [...],
    "swap_results": [...],
    "swap_records": [...]
  }
}
```

---

## 📅 Flow 2: Booking Swap (Có đặt trước)

### Step 1: Validate Booking
**API**: `POST /api/swap/validate-with-booking`

**Request**:
```json
{
  "booking_id": "booking-uuid",
  "driver_id": "uuid",
  "vehicle_id": "uuid",
  "station_id": 1,
  "battery_type_id": 1,
  "batteriesIn": [
    { "slot_id": 5, "battery_id": "old-battery-1" },
    { "slot_id": 6, "battery_id": "old-battery-2" }
  ]
}
```

**Validations Performed**:
1. ✅ Booking tồn tại với status = 'pending'
2. ✅ Thời gian: `create_time <= now <= scheduled_time`
3. ✅ Pin đưa vào thuộc về vehicle (ownership check)
4. ✅ Số lượng pin đưa vào = số lượng pin đã đặt
5. ✅ Pin đã đặt còn sẵn sàng (status = 'ready')

**Response** (Success):
```json
{
  "success": true,
  "message": "Validation thành công. Sẵn sàng để thực hiện đổi pin với booking.",
  "ready_to_execute": true,  // ← Frontend check flag này
  "data": {
    "booking_id": "booking-uuid",
    "driver_id": "uuid",
    "vehicle_id": "uuid",
    "station_id": 1,
    "battery_type_id": 1,
    "validation_summary": {
      "total_batteries_in": 2,
      "valid_batteries": 2,
      "booked_batteries_out": 2
    },
    "valid_batteries_in": [
      {
        "slot_id": 5,
        "battery_id": "old-battery-1",
        "battery_soh": 75.5,
        "battery_soc": 25.0,
        "new_slot_status": "charging"
      }
    ],
    "booked_batteries_out": [
      {
        "battery_id": "new-battery-1",
        "current_soc": 95.0,
        "current_soh": 98.5,
        "battery_serial": "BAT-2024-001"
      }
    ],
    "booking_info": {
      "booking_id": "booking-uuid",
      "status": "pending",
      "create_time": "2025-10-25T10:00:00Z",
      "scheduled_time": "2025-10-25T14:00:00Z"
    }
  }
}
```

**Response** (Error Examples):

1. **Booking không hợp lệ**:
```json
{
  "success": false,
  "message": "Không tìm thấy booking hợp lệ với vehicle_id và station_id đã cho, hoặc booking không còn ở trạng thái pending"
}
```

2. **Thời gian không hợp lệ**:
```json
{
  "success": false,
  "message": "Booking không còn trong khoảng thời gian hợp lệ. Thời gian đổi pin phải nằm giữa thời gian tạo đơn và thời gian đã đặt lịch.",
  "data": {
    "create_time": "2025-10-25T10:00:00Z",
    "scheduled_time": "2025-10-25T14:00:00Z",
    "current_time": "2025-10-25T15:00:00Z"
  }
}
```

3. **Pin không thuộc vehicle**:
```json
{
  "success": false,
  "message": "Có pin không hợp lệ trong danh sách pin đưa vào",
  "data": {
    "invalid_batteries": [
      {
        "battery_id": "wrong-battery",
        "slot_id": 5,
        "error": "Battery không thuộc về xe này (vehicle_id hiện tại: other-vehicle-id)"
      }
    ]
  }
}
```

4. **Pin đã đặt không còn sẵn sàng**:
```json
{
  "success": false,
  "message": "Pin đã đặt battery-id không còn sẵn sàng hoặc không ở trạng thái 'ready'",
  "data": {
    "battery_id": "battery-id",
    "battery_serial": "BAT-2024-001"
  }
}
```

### Step 2: Execute Booking Swap
**API**: `POST /api/swap/execute-with-booking`

**Request** (Sử dụng data từ validate response):
```json
{
  "booking_id": "booking-uuid",
  "driver_id": "uuid",
  "vehicle_id": "uuid",
  "station_id": 1,
  "battery_type_id": 1,
  "batteriesIn": [
    { "slot_id": 5, "battery_id": "old-battery-1" },
    { "slot_id": 6, "battery_id": "old-battery-2" }
  ],
  "batteriesOut": [
    { "battery_id": "new-battery-1" },
    { "battery_id": "new-battery-2" }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "message": "Đổi pin thành công với booking",
  "data": {
    "booking_id": "booking-uuid",
    "driver_id": "uuid",
    "vehicle_id": "uuid",
    "station_id": 1,
    "battery_type_id": 1,
    "swap_summary": {
      "batteries_in": 2,
      "batteries_out": 2,
      "swap_records": 2
    },
    "batteries_out_info": [...],
    "swap_results": [...],
    "swap_records": [
      {
        "swap_id": "uuid",
        "booking_id": "booking-uuid",  // ← Có booking_id
        "battery_id_in": "old-battery-1",
        "battery_id_out": "new-battery-1",
        "soh_in": 75.5,
        "soh_out": 98.5,
        "swap_time": "2025-10-25T13:45:00Z"
      }
    ]
  }
}
```

**Side Effects**:
- ✅ Booking status: `pending` → `completed`
- ✅ SOH usage được tính và cập nhật vào subscription (nếu không phải lần đầu)
- ✅ Vehicle.take_first = true (nếu là lần đầu)

---

## 🎯 Frontend Implementation Guide

### Traditional Swap Flow

```javascript
// Step 1: Validate
const validateResponse = await fetch('/api/swap/validate-and-prepare', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    driver_id,
    vehicle_id,
    station_id,
    battery_type_id,
    requested_quantity,
    batteriesIn
  })
});

const validateData = await validateResponse.json();

// Step 2: Check flags
if (!validateData.success) {
  // Hiển thị lỗi
  alert(validateData.message);
  return;
}

if (!validateData.ready_to_execute) {
  // Không thể execute (không đủ pin, etc.)
  alert(validateData.message);
  return;
}

// Step 3: Confirm (nếu cần)
if (validateData.require_confirmation) {
  const userConfirmed = confirm(validateData.message);
  if (!userConfirmed) {
    return; // User không muốn tiếp tục
  }
}

// Step 4: Execute
const executeResponse = await fetch('/api/swap/execute', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    driver_id: validateData.data.driver_id,
    vehicle_id: validateData.data.vehicle_id,
    station_id: validateData.data.station_id,
    battery_type_id: validateData.data.battery_type_id,
    batteriesIn: validateData.data.valid_batteries_in.map(b => ({
      slot_id: b.slot_id,
      battery_id: b.battery_id
    }))
  })
});

const executeData = await executeResponse.json();

if (executeData.success) {
  alert('Đổi pin thành công!');
  // Redirect hoặc refresh
}
```

### Booking Swap Flow

```javascript
// Step 1: Validate booking
const validateResponse = await fetch('/api/swap/validate-with-booking', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    booking_id,
    driver_id,
    vehicle_id,
    station_id,
    battery_type_id,
    batteriesIn
  })
});

const validateData = await validateResponse.json();

// Step 2: Check validation
if (!validateData.success || !validateData.ready_to_execute) {
  alert(validateData.message);
  return;
}

// Step 3: Show confirmation (optional)
const confirmed = confirm(
  `Xác nhận đổi ${validateData.data.validation_summary.total_batteries_in} pin với booking?\n` +
  `Booking ID: ${validateData.data.booking_id}`
);

if (!confirmed) return;

// Step 4: Execute booking swap
const executeResponse = await fetch('/api/swap/execute-with-booking', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    booking_id: validateData.data.booking_id,
    driver_id: validateData.data.driver_id,
    vehicle_id: validateData.data.vehicle_id,
    station_id: validateData.data.station_id,
    battery_type_id: validateData.data.battery_type_id,
    batteriesIn: validateData.data.valid_batteries_in.map(b => ({
      slot_id: b.slot_id,
      battery_id: b.battery_id
    })),
    batteriesOut: validateData.data.booked_batteries_out.map(b => ({
      battery_id: b.battery_id
    }))
  })
});

const executeData = await executeResponse.json();

if (executeData.success) {
  alert('Đổi pin với booking thành công!');
  // Redirect
}
```

---

## 📊 API Summary

| API | Method | Purpose | Auto Execute |
|-----|--------|---------|--------------|
| `/api/swap/validate-and-prepare` | POST | Validate traditional swap | ❌ No |
| `/api/swap/execute` | POST | Execute traditional swap | N/A |
| `/api/swap/validate-with-booking` | POST | Validate booking swap | ❌ No |
| `/api/swap/execute-with-booking` | POST | Execute booking swap | N/A |
| `/api/swap/available-batteries` | GET | Get available batteries | N/A |
| `/api/swap/first-time-pickup` | POST | First-time battery pickup | Auto |

---

## 🔑 Key Differences

### Old Flow (Auto Execute)
```
Validate → ✅ Success → 🚀 Auto Execute → Response
```

### New Flow (Manual Execute)
```
Validate → ✅ Success → Return data → Frontend decide → Call Execute → Response
```

---

## ✅ Benefits

1. **Frontend Control**: Frontend có quyền quyết định có execute hay không
2. **Better UX**: Có thể hiển thị loading state giữa validate và execute
3. **Confirmation**: Dễ dàng thêm bước confirmation cho user
4. **Error Handling**: Tách biệt error của validation và execution
5. **Flexible**: Có thể cache validation result hoặc retry execute riêng

---

## ⚠️ Important Notes

- ⚠️ Validate result **không được cache lâu** (pin có thể bị lấy bởi người khác)
- ⚠️ Nên call execute **ngay sau validate** để tránh race condition
- ⚠️ Nếu execute fail, **phải validate lại** trước khi retry
- ✅ Response của validate chứa **đầy đủ data** cần thiết cho execute
- ✅ Execute API **không validate lại**, tin tưởng vào frontend đã validate
