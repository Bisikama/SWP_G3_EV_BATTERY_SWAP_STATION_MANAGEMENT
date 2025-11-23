# Unified Booking Flow Summary

## Tổng quan
Hệ thống hiện tại đã được cập nhật để hỗ trợ **một hàm validate duy nhất** có thể phát hiện xem đây có phải lần đầu tiên lấy pin hay không, và trả về thông tin để frontend gọi đúng API execute.

## Flow hoạt động

```
Frontend → validateAndPrepareSwapWithBooking() → Check is_first_time
                                                        |
                        +-------------------------------+--------------------------------+
                        |                                                                |
                  is_first_time = true                                        is_first_time = false
                        |                                                                |
          executeFirstTimePickupWithBooking()                            executeSwapWithBooking()
                        |                                                                |
                  (Chỉ xử lý OUT)                                          (Xử lý cả IN và OUT)
```

## API Endpoints

### 1. Validate (Unified)
**Endpoint:** `POST /api/swap/validate-with-booking`

**Request:**
```json
{
  "booking_id": "uuid",
  "driver_id": "uuid",
  "vehicle_id": "uuid",
  "station_id": 1,
  "battery_type_id": 1,
  "batteriesIn": [  // ← Optional nếu first-time
    { "slot_id": 3, "battery_id": "uuid-old-1" }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "is_first_time": true,  // ← Frontend dùng flag này để quyết định gọi API nào
  "data": {
    "validation_summary": {
      "is_first_time": true,
      "has_active_subscription": true,
      "booking_valid": true,
      "booked_batteries_count": 2,
      "batteries_in_valid": true  // Only present if NOT first-time
    },
    "booked_batteries": [...],
    "valid_batteries_in": [...]  // Only present if NOT first-time
  }
}
```

### 2a. Execute - First Time
**Endpoint:** `POST /api/swap/execute-first-time-with-booking`

**Request:**
```json
{
  "booking_id": "uuid",
  "driver_id": "uuid",
  "vehicle_id": "uuid",
  "station_id": 1,
  "battery_type_id": 1,
  "bookedBatteries": [  // Lấy từ validate response
    { "slot_id": 1, "battery_id": "uuid-new-1" }
  ]
}
```

**Logic:**
- ✅ Không xử lý `batteriesIn` (không có pin cũ)
- ✅ Chỉ xử lý `bookedBatteries` (OUT)
- ✅ Tạo SwapRecord: `battery_id_in = null`, `soh_in = 0`
- ✅ Update `vehicle.take_first = true`
- ✅ Update `booking.status = 'completed'`

### 2b. Execute - Regular Swap
**Endpoint:** `POST /api/swap/execute-with-booking`

**Request:**
```json
{
  "booking_id": "uuid",
  "driver_id": "uuid",
  "vehicle_id": "uuid",
  "station_id": 1,
  "battery_type_id": 1,
  "batteriesIn": [  // Pin cũ của xe
    { "slot_id": 3, "battery_id": "uuid-old-1" }
  ],
  "batteriesOut": [  // Từ booking
    { "slot_id": 1, "battery_id": "uuid-new-1" }
  ]
}
```

**Logic:**
- ✅ Xử lý `batteriesIn`: slot status = charging/faulty
- ✅ Xử lý `batteriesOut`: gán pin cho xe
- ✅ Tạo SwapRecord với đầy đủ battery_id_in và battery_id_out
- ✅ Update `booking.status = 'completed'`

## Frontend Implementation

```javascript
// Step 1: Validate
const validateResponse = await fetch('/api/swap/validate-with-booking', {
  method: 'POST',
  body: JSON.stringify({
    booking_id: bookingId,
    driver_id: driverId,
    vehicle_id: vehicleId,
    station_id: stationId,
    battery_type_id: batteryTypeId,
    batteriesIn: batteriesIn  // Can be empty if first-time
  })
});

const { is_first_time, data } = validateResponse;

// Step 2: Execute (phân nhánh dựa vào is_first_time)
if (is_first_time) {
  // First-time pickup
  await fetch('/api/swap/execute-first-time-with-booking', {
    method: 'POST',
    body: JSON.stringify({
      booking_id: bookingId,
      driver_id: driverId,
      vehicle_id: vehicleId,
      station_id: stationId,
      battery_type_id: batteryTypeId,
      bookedBatteries: data.booked_batteries
    })
  });
} else {
  // Regular swap
  await fetch('/api/swap/execute-with-booking', {
    method: 'POST',
    body: JSON.stringify({
      booking_id: bookingId,
      driver_id: driverId,
      vehicle_id: vehicleId,
      station_id: stationId,
      battery_type_id: batteryTypeId,
      batteriesIn: batteriesIn,
      batteriesOut: data.booked_batteries
    })
  });
}
```

## Validation Logic

### Các bước validation trong `validateAndPrepareSwapWithBooking`:

1. **Check Active Subscription**
   - Vehicle phải có subscription hợp lệ (`status = 'active'`, `end_date >= now`)

2. **Check First-Time**
   - Count số SwapRecord của vehicle
   - `count = 0` → `is_first_time = true`
   - `count > 0` → `is_first_time = false`

3. **Validate Booking**
   - Booking tồn tại và đúng vehicle/station
   - Status = 'pending'
   - Thời gian hợp lệ: `create_time <= now <= scheduled_time`

4. **Get Booked Batteries**
   - Lấy pin đã đặt từ BookingBatteries

5. **Validate Batteries IN (Conditional)**
   - **Chỉ validate nếu NOT first-time**
   - Check ownership: pin phải thuộc về vehicle
   - Check slot: slot phải empty

6. **Validate Booked Batteries**
   - Pin phải còn trong slot
   - Pin phải ở trạng thái 'ready'

## Ưu điểm của flow này

✅ **Unified Validation:** Chỉ cần gọi 1 API validate duy nhất
✅ **Smart Routing:** Backend tự động phát hiện first-time và trả flag
✅ **Frontend Control:** Frontend kiểm soát khi nào execute
✅ **Type Safety:** Validation đảm bảo ownership (không đổi pin xe khác)
✅ **Transaction Safe:** Tất cả operations đều có transaction rollback

## Service Functions Updated

Các service functions đã được cập nhật để hỗ trợ transaction:

- `validateBatteryInsertion(batteryId, vehicleId, slotId, transaction)`
- `updateSlotStatus(slotId, status, batteryId, transaction)`
- `updateOldBatteryToSlot(batteryId, slotId, transaction)`
- `updateNewBatteryToVehicle(vehicleId, batteryId, soh, transaction)`
- `createSwapRecord(params, transaction)`
- `createSwapRecordWithBooking(params, transaction)` ← Có booking_id

## Database Schema Notes

### SwapRecord
- `battery_id_in`: nullable (null nếu first-time)
- `soh_in`: 0 nếu first-time
- `booking_id`: nullable (có giá trị nếu swap với booking)

### Vehicle
- `take_first`: boolean (true sau khi lấy pin lần đầu)

### Booking
- `status`: 'pending' → 'completed' sau khi swap thành công

## Testing Guide

Xem file `SWAP_WITH_BOOKING_GUIDE.md` để biết chi tiết test cases và example requests.
