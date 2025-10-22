# HƯỚNG DẪN TEST BOOKING API TRÊN SWAGGER UI

## 📋 THÔNG TIN TÀI KHOẢN TEST

```
Email: nguyen.driver@gmail.com
Password: password123
Vehicle ID: df336085-af5a-4e00-82f0-2995e8ec634f
Vehicle: VinFast Ludo - Biển số 51A-12345
```

---

## 🚀 BƯỚC 1: MỞ SWAGGER UI VÀ ĐĂNG NHẬP

### 1.1. Mở Swagger UI
- Truy cập: **http://localhost:3000/api-docs**

### 1.2. Login để lấy Bearer Token

1. Tìm section **"user"**
2. Click vào **POST /api/user/login**
3. Click nút **"Try it out"**
4. Nhập Request body:
```json
{
  "email": "nguyen.driver@gmail.com",
  "password": "password123"
}
```
5. Click **"Execute"**
6. Copy **token** từ Response (dạng: `eyJhbGciOiJIUzI1NiIsInR5cCI6...`)

### 1.3. Authorize với Bearer Token

1. Click nút **"Authorize"** 🔓 (góc phải trên cùng)
2. Nhập: `Bearer <token_vừa_copy>`
   - Ví dụ: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6...`
3. Click **"Authorize"**
4. Click **"Close"**

✅ Bây giờ bạn đã xác thực và có thể test tất cả API!

---

## 📝 BƯỚC 2: TEST TẠO BOOKING (CREATE)

### API: POST /api/booking

1. Tìm section **"booking"**
2. Click vào **POST /api/booking**
3. Click **"Try it out"**
4. Nhập Request body:

```json
{
  "vehicle_id": "df336085-af5a-4e00-82f0-2995e8ec634f",
  "station_id": 16,
  "scheduled_start_time": "2025-10-19T10:00:00.000Z",
  "battery_count": 1
}
```

⚠️ **LƯU Ý QUAN TRỌNG:**
- `scheduled_start_time` phải trong ngày hôm nay (00:00 - 23:59)
- Không được trùng với booking khác ±30 phút
- `battery_count` <= battery_cap của subscription (thường là 20)

**Cách tính thời gian hợp lệ:**
- Nếu bây giờ là 15:00 ngày 19/10/2025
- Có thể đặt: `2025-10-19T17:00:00.000Z` (17:00 cùng ngày)
- KHÔNG được đặt: `2025-10-20T10:00:00.000Z` (ngày mai)

5. Click **"Execute"**

### ✅ Kết quả mong đợi:
```json
{
  "message": "Booking created successfully",
  "booking": {
    "booking_id": "a3e529ae-c70a-4d84-8965-047084a40f80",
    "status": "pending",
    "scheduled_start_time": "2025-10-19T10:00:00.000Z",
    "scheduled_end_time": "2025-10-19T10:15:00.000Z",
    "driver": {...},
    "vehicle": {...},
    "station": {...},
    "batteries": [...]
  }
}
```

🎯 **Copy `booking_id` để dùng cho các test tiếp theo!**

---

## 📖 BƯỚC 3: TEST XEM DANH SÁCH BOOKING

### API: GET /api/booking

1. Click vào **GET /api/booking**
2. Click **"Try it out"**
3. (Tùy chọn) Nhập query parameters:
   - `status`: `pending` hoặc `completed` hoặc `cancelled`
   - `limit`: `10`
   - `offset`: `0`
4. Click **"Execute"**

### ✅ Kết quả mong đợi:
```json
{
  "success": true,
  "data": [
    {
      "booking_id": "...",
      "status": "pending",
      "scheduled_start_time": "...",
      ...
    }
  ],
  "pagination": {
    "total": 5,
    "limit": 10,
    "offset": 0
  }
}
```

---

## 🔍 BƯỚC 4: TEST XEM CHI TIẾT BOOKING

### API: GET /api/booking/{id}

1. Click vào **GET /api/booking/{id}**
2. Click **"Try it out"**
3. Nhập `id`: `<booking_id_từ_bước_2>`
4. Click **"Execute"**

### ✅ Kết quả mong đợi:
```json
{
  "success": true,
  "booking": {
    "booking_id": "...",
    "status": "pending",
    "driver": {...},
    "vehicle": {...},
    "station": {...},
    "batteries": [...]
  }
}
```

---

## ✏️ BƯỚC 5: TEST CẬP NHẬT BOOKING

### API: PATCH /api/booking/{id}

⚠️ **Chỉ có thể update booking có status = "pending"**

1. Click vào **PATCH /api/booking/{id}**
2. Click **"Try it out"**
3. Nhập `id`: `<booking_id_từ_bước_2>`
4. Nhập Request body (có thể update 1 hoặc nhiều field):

```json
{
  "scheduled_start_time": "2025-10-19T14:00:00.000Z",
  "station_id": 17,
  "battery_count": 2
}
```

5. Click **"Execute"**

### ✅ Kết quả mong đợi:
```json
{
  "message": "Booking updated successfully",
  "booking": {
    "booking_id": "...",
    "status": "pending",
    "scheduled_start_time": "2025-10-19T14:00:00.000Z",
    ...
  }
}
```

### ❌ Lỗi có thể gặp:
- **422**: "Only pending bookings can be updated" → Booking đã completed/cancelled
- **409**: "You already have a booking..." → Trùng thời gian với booking khác
- **400**: "Scheduled time must be within today" → Thời gian không hợp lệ

---

## ❌ BƯỚC 6: TEST HỦY BOOKING

### API: DELETE /api/booking/{id}

⚠️ **Chỉ có thể cancel booking có status = "pending"**

1. Click vào **DELETE /api/booking/{id}**
2. Click **"Try it out"**
3. Nhập `id`: `<booking_id_từ_bước_2>`
4. Click **"Execute"**

### ✅ Kết quả mong đợi:
```json
{
  "message": "Booking cancelled successfully",
  "booking": {
    "booking_id": "...",
    "status": "cancelled",
    ...
  }
}
```

### ❌ Lỗi có thể gặp:
- **422**: "Only pending bookings can be cancelled" → Booking đã cancelled/completed
- **400**: "Cannot cancel within 5 minutes..." → Quá gần giờ bắt đầu (< 5 phút)

---

## 🔄 BƯỚC 7: TEST KIỂM TRA AVAILABILITY

### API: GET /api/booking/availability

Kiểm tra xem có thể tạo booking tại thời gian này không.

1. Click vào **GET /api/booking/availability**
2. Click **"Try it out"**
3. Nhập query parameters:
   - `station_id`: `16`
   - `scheduled_start_time`: `2025-10-19T16:00:00.000Z`
   - `battery_type_id`: `16` (LFP-40)
   - `battery_count`: `1`
4. Click **"Execute"**

### ✅ Kết quả mong đợi:
```json
{
  "available": true,
  "message": "Time slot and batteries are available",
  "details": {
    "station_id": 16,
    "scheduled_time": "2025-10-19T16:00:00.000Z",
    "battery_count_requested": 1,
    "battery_count_available": 5
  }
}
```

Hoặc:

```json
{
  "available": false,
  "message": "Not enough batteries available",
  "details": {
    "battery_count_requested": 10,
    "battery_count_available": 3
  }
}
```

---

## 🧪 CÁC TRƯỜNG HỢP TEST VALIDATION

### Test 1: Thiếu vehicle_id
```json
{
  "station_id": 16,
  "scheduled_start_time": "2025-10-19T10:00:00.000Z"
}
```
**Mong đợi:** 400 Bad Request - "vehicle_id is required"

---

### Test 2: Station không tồn tại
```json
{
  "vehicle_id": "df336085-af5a-4e00-82f0-2995e8ec634f",
  "station_id": 99999,
  "scheduled_start_time": "2025-10-19T10:00:00.000Z"
}
```
**Mong đợi:** 404 Not Found - "Station not found or not operational"

---

### Test 3: Thời gian trong quá khứ
```json
{
  "vehicle_id": "df336085-af5a-4e00-82f0-2995e8ec634f",
  "station_id": 16,
  "scheduled_start_time": "2025-10-18T10:00:00.000Z"
}
```
**Mong đợi:** 400 Bad Request - "Scheduled time cannot be in the past"

---

### Test 4: Battery count vượt quá giới hạn
```json
{
  "vehicle_id": "df336085-af5a-4e00-82f0-2995e8ec634f",
  "station_id": 16,
  "scheduled_start_time": "2025-10-19T10:00:00.000Z",
  "battery_count": 999
}
```
**Mong đợi:** 422 Unprocessable Entity - "Battery count exceeds subscription limit"

---

### Test 5: Tạo booking trùng thời gian
1. Tạo booking lúc 10:00
2. Tạo booking khác lúc 10:15 (trong khoảng ±30 phút)

**Mong đợi:** 409 Conflict - "You already have a booking in this time slot"

---

### Test 6: Booking trong booking đã cancelled không bị block
1. Tạo booking lúc 11:00 → Cancel nó
2. Tạo booking mới lúc 11:00 (cùng thời gian)

**Mong đợi:** 201 Created - Thành công vì booking đầu đã cancelled

---

## 📊 TÓM TẮT STATUS CODES

| Code | Meaning | Ví dụ |
|------|---------|-------|
| 200 | OK | GET thành công |
| 201 | Created | POST tạo booking thành công |
| 400 | Bad Request | Thiếu field bắt buộc, validation lỗi |
| 401 | Unauthorized | Chưa login hoặc token không hợp lệ |
| 404 | Not Found | Station/Vehicle/Booking không tồn tại |
| 409 | Conflict | Trùng thời gian với booking khác |
| 422 | Unprocessable | Không thể update/cancel booking đã completed |
| 500 | Server Error | Lỗi server |

---

## 🎯 CHECKLIST TEST ĐẦY ĐỦ

- [ ] Login và lấy Bearer Token
- [ ] Authorize trên Swagger UI
- [ ] Tạo booking mới (POST)
- [ ] Xem danh sách bookings (GET)
- [ ] Xem chi tiết booking (GET by ID)
- [ ] Kiểm tra availability (GET availability)
- [ ] Update booking (PATCH) - chỉ pending
- [ ] Cancel booking (DELETE) - chỉ pending
- [ ] Test validation: thiếu vehicle_id
- [ ] Test validation: station không tồn tại
- [ ] Test validation: thời gian quá khứ
- [ ] Test validation: battery_count vượt quá
- [ ] Test duplicate: tạo booking trùng giờ
- [ ] Test cancelled không block: tạo lại sau khi cancel
- [ ] Test filter by status: pending/completed/cancelled

---

## 🔧 TROUBLESHOOTING

### Lỗi: "Cannot POST /api/booking"
→ Server chưa chạy hoặc route chưa được đăng ký
→ Kiểm tra: `app.use('/api/booking', bookingRoutes)` trong server.js

### Lỗi: "Unauthorized"
→ Token không hợp lệ hoặc hết hạn
→ Login lại và lấy token mới

### Lỗi: "Scheduled time must be within today"
→ Thời gian phải từ 00:00 đến 23:59 ngày hôm nay
→ Không được đặt booking cho ngày mai

### Lỗi: "Station not found or not operational"
→ Station ID không tồn tại hoặc status != 'operational'
→ Dùng station_id: 16, 17, 18, hoặc 19

### Lỗi: "Vehicle not found"
→ Vehicle ID sai hoặc không thuộc về account này
→ Dùng: `df336085-af5a-4e00-82f0-2995e8ec634f`

### Lỗi: "You already have a booking in this time slot"
→ Đã có booking trong khoảng ±30 phút
→ Chọn thời gian khác hoặc cancel booking cũ

---

## 📞 DATA REFERENCE

### Valid Station IDs:
- 16 - District 1 Central Station
- 17 - District 3 Tech Hub
- 18 - Binh Thanh Station
- 19 - Thu Duc Service Center

### Valid Vehicle ID:
- `df336085-af5a-4e00-82f0-2995e8ec634f` (VinFast Ludo - 51A-12345)

### Time Format:
- ISO 8601: `2025-10-19T10:00:00.000Z`
- Phải trong ngày: `2025-10-19T00:00:00` đến `2025-10-19T23:59:59`

### Battery Count:
- Min: 1
- Max: battery_cap của subscription (thường là 20)

---

**✨ Chúc bạn test thành công!**
