# 📊 BOOKING MODULE - DATA FLOW DOCUMENTATION

> **Module:** Booking Management System  
> **Developer:** Hau Pham  
> **Description:** Chi tiết luồng dữ liệu và business logic của tất cả chức năng Booking

---

## 📑 TABLE OF CONTENTS

1. [Create Booking](#1-create-booking)
2. [Get My Bookings](#2-get-my-bookings)
3. [Check Availability](#3-check-availability)
4. [Get Booking By ID](#4-get-booking-by-id)
5. [Cancel Booking](#5-cancel-booking)
6. [Helper Functions](#6-helper-functions)

---

## 1. CREATE BOOKING

### 📍 **API Endpoint**
```http
POST /api/booking
Authorization: Bearer <driver_token>
Content-Type: application/json

{
  "vehicle_id": "uuid",
  "station_id": 1,
  "battery_quantity": 2
}
```

### 🔄 **DATA FLOW DIAGRAM**

```
┌─────────────────────────────────────────────────────────────────────┐
│                           CLIENT REQUEST                             │
│  POST /api/booking                                                   │
│  Body: { vehicle_id, station_id, battery_quantity }                 │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      ROUTE LAYER (booking.route.js)                  │
├─────────────────────────────────────────────────────────────────────┤
│  [1] verifyToken                                                     │
│      ├─ Decode JWT token                                            │
│      └─ Extract: req.user = { account_id, role, email }            │
│                                                                      │
│  [2] authorizeRole('driver')                                        │
│      ├─ Check: req.user.role === 'driver'                          │
│      └─ Reject if not driver → 403 Forbidden                       │
│                                                                      │
│  [3] validate(bookingValidation.createBooking)                     │
│      ├─ Validate: battery_quantity (1-10, integer)                 │
│      └─ Reject if invalid → 400 Bad Request                        │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  CONTROLLER (booking.controller.js)                  │
│                  Function: createBooking()                           │
├─────────────────────────────────────────────────────────────────────┤
│  📥 INPUT:                                                           │
│     - req.user.account_id → driver_id                               │
│     - req.body.vehicle_id                                           │
│     - req.body.station_id                                           │
│     - req.body.battery_quantity (default: 1)                        │
│                                                                      │
│  🔧 PROCESSING:                                                      │
│     const booking = await bookingService.createBooking(             │
│       driver_id,                                                    │
│       { vehicle_id, station_id, battery_quantity }                 │
│     );                                                              │
│                                                                      │
│  📤 OUTPUT:                                                          │
│     res.status(201).json({                                          │
│       message: 'Booking created successfully',                     │
│       booking                                                       │
│     });                                                             │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   SERVICE (booking.service.js)                       │
│                   Function: createBooking()                          │
└─────────────────────────────────────────────────────────────────────┘
                             │
         ┌───────────────────┴───────────────────┐
         ▼                                       ▼
┌──────────────────────┐              ┌──────────────────────┐
│   STEP 1-2           │              │   STEP 3-4           │
│   Validation         │              │   Get Vehicle Info   │
├──────────────────────┤              ├──────────────────────┤
│ • Check required     │              │ • Vehicle.findByPk() │
│   fields             │              │ • VehicleModel       │
│ • Get config         │              │   .findByPk()        │
│   (expiration)       │              │ • Validate quantity  │
└──────┬───────────────┘              └──────┬───────────────┘
       │                                     │
       └──────────────┬──────────────────────┘
                      ▼
         ┌────────────────────────┐
         │   STEP 5-7             │
         │   Security Checks      │
         ├────────────────────────┤
         │ • Check ownership      │
         │ • Station.findOne()    │
         │ • Check operational    │
         └──────┬─────────────────┘
                │
                ▼
    ┌──────────────────────────────┐
    │   STEP 8: Check Subscription │
    │   ↓ checkVehicleSubscription()│
    ├──────────────────────────────┤
    │ Query: Subscription.findOne  │
    │ WHERE:                       │
    │   - vehicle_id               │
    │   - cancel_time = null       │
    │   - end_date >= today        │
    │                              │
    │ Return: void                 │
    │ Throw: 422 if not found      │
    └──────┬───────────────────────┘
           │
           ▼
    ┌───────────────────────────────┐
    │   STEP 9-10                   │
    │   Calculate & Validate Time   │
    ├───────────────────────────────┤
    │ • expired_time = now +        │
    │   booking_expired_interval    │
    │ • checkDuplicateBooking() →   │
    └──────┬────────────────────────┘
           │
           ▼
    ┌────────────────────────────────────┐
    │   STEP 10: Check Duplicate         │
    │   ↓ checkDuplicateBooking()        │
    ├────────────────────────────────────┤
    │ Query: Booking.findOne             │
    │ WHERE:                             │
    │   - vehicle_id                     │
    │   - status = 'pending'             │
    │   - expired_time > now             │
    │                                    │
    │ Return: void                       │
    │ Throw: 409 if duplicate found      │
    └──────┬─────────────────────────────┘
           │
           ▼
    ┌─────────────────────────────────────┐
    │   STEP 11: Find Available Batteries │
    │   ↓ findAvailableBatteries()        │
    ├─────────────────────────────────────┤
    │ [Sub-step 1] Cabinet.findAll        │
    │   WHERE: station_id, operational    │
    │   → Extract: cabinet_ids            │
    │                                     │
    │ [Sub-step 2] CabinetSlot.findAll    │
    │   WHERE:                            │
    │     - cabinet_id IN (...)           │
    │     - status = 'occupied'           │
    │   → Extract: slot_ids               │
    │                                     │
    │ [Sub-step 3] Battery.findAll        │
    │   WHERE:                            │
    │     - slot_id IN (...)              │
    │     - battery_type_id               │
    │     - current_soc >= 90             │
    │     - current_soh >= 70             │
    │                                     │
    │ Return: Array<Battery>              │
    └──────┬──────────────────────────────┘
           │
           ▼
    ┌────────────────────────────┐
    │   STEP 12                  │
    │   Validate Battery Count   │
    ├────────────────────────────┤
    │ IF available < requested:  │
    │   Throw 422 Error          │
    └──────┬─────────────────────┘
           │
           ▼
    ┌──────────────────────────────────┐
    │   STEP 13-15                     │
    │   Create Booking & Associations  │
    ├──────────────────────────────────┤
    │ [13] Booking.create({            │
    │        driver_id,                │
    │        vehicle_id,               │
    │        station_id,               │
    │        expired_time,             │
    │        status: 'pending'         │
    │      })                          │
    │                                  │
    │ [14] Select batteries:           │
    │      availableBatteries          │
    │        .slice(0, battery_quantity)│
    │                                  │
    │ [15] Promise.all(                │
    │        BookingBattery.create()   │
    │      )                           │
    └──────┬───────────────────────────┘
           │
           ▼
    ┌───────────────────────────┐
    │   STEP 16                 │
    │   Lock Cabinet Slots      │
    ├───────────────────────────┤
    │ CabinetSlot.update(       │
    │   { status: 'booked' },   │
    │   WHERE: slot_id IN (...) │
    │ )                         │
    └──────┬────────────────────┘
           │
           ▼
    ┌────────────────────────────────┐
    │   STEP 17: Get Full Details    │
    │   ↓ getBookingById()            │
    ├────────────────────────────────┤
    │ Query: Booking.findByPk        │
    │ Include:                       │
    │   - driver (Account)           │
    │   - vehicle (with model)       │
    │   - station                    │
    │   - batteries                  │
    │                                │
    │ Return: Booking object         │
    └──────┬─────────────────────────┘
           │
           ▼
    ┌────────────────────┐
    │   Return to        │
    │   Controller       │
    └──────┬─────────────┘
           │
           ▼
    ┌────────────────────┐
    │   Response         │
    │   201 Created      │
    └────────────────────┘
```

### 📊 **DATABASE QUERIES SUMMARY**

| Step | Query | Purpose | Return |
|------|-------|---------|--------|
| 2 | `Config.findOne()` | Get booking expiration interval | `{ booking_expired_interval: 30 }` |
| 3 | `Vehicle.findByPk()` | Verify vehicle exists | `Vehicle` object |
| 4 | `VehicleModel.findByPk()` | Get battery_slot, battery_type | `VehicleModel` with `batteryType` |
| 7 | `Station.findOne()` | Check station operational | `Station` object or null |
| 8 | `Subscription.findOne()` | Validate active subscription | `Subscription` or null |
| 10 | `Booking.findOne()` | Check duplicate pending booking | `Booking` or null |
| 11.1 | `Cabinet.findAll()` | Find operational cabinets | `Array<Cabinet>` |
| 11.2 | `CabinetSlot.findAll()` | Get occupied slots | `Array<CabinetSlot>` |
| 11.3 | `Battery.findAll()` | Find available batteries | `Array<Battery>` |
| 13 | `Booking.create()` | Create booking record | `Booking` object |
| 15 | `BookingBattery.create()` | Link batteries to booking | `BookingBattery` records |
| 16 | `CabinetSlot.update()` | Lock slots (booked status) | Update count |
| 17 | `Booking.findByPk()` | Get booking with relations | Full `Booking` object |

### ⚠️ **ERROR CASES**

```
❌ 400 Bad Request
   └─ Missing vehicle_id or station_id
   └─ battery_quantity < 1 or > 10

❌ 403 Forbidden
   └─ User is not a driver
   └─ Vehicle does not belong to driver

❌ 404 Not Found
   └─ Vehicle not found
   └─ Vehicle model not found
   └─ Station not found or not operational

❌ 409 Conflict
   └─ Vehicle already has pending booking (not expired)

❌ 422 Unprocessable Entity
   └─ battery_quantity > vehicle.battery_slot
   └─ Vehicle has no active subscription
   └─ Not enough available batteries at station

❌ 500 Internal Server Error
   └─ System configuration not found
```

### ✅ **SUCCESS RESPONSE**

```json
{
  "message": "Booking created successfully",
  "booking": {
    "booking_id": "550e8400-e29b-41d4-a716-446655440000",
    "driver_id": "660e8400-e29b-41d4-a716-446655440001",
    "vehicle_id": "770e8400-e29b-41d4-a716-446655440002",
    "station_id": 1,
    "status": "pending",
    "create_time": "2025-11-23 14:30:00",
    "expired_time": "2025-11-23 15:00:00",
    "driver": {
      "account_id": "660e8400-e29b-41d4-a716-446655440001",
      "fullname": "Nguyen Van A",
      "email": "driver@example.com",
      "phone_number": "0901234567"
    },
    "vehicle": {
      "vehicle_id": "770e8400-e29b-41d4-a716-446655440002",
      "license_plate": "30A-12345",
      "vin": "RL9LUD24HN00001",
      "model": {
        "model_id": 1,
        "name": "VinFast Ludo",
        "brand": "VinFast",
        "avg_energy_usage": 15.5,
        "batteryType": {
          "battery_type_id": 1,
          "battery_type_code": "VF-STD",
          "nominal_capacity": 50.4
        }
      }
    },
    "station": {
      "station_id": 1,
      "station_name": "Trạm Thủ Đức",
      "address": "123 Võ Văn Ngân, Thủ Đức",
      "latitude": 10.850000,
      "longitude": 106.771000,
      "status": "operational"
    },
    "batteries": [
      {
        "battery_id": "880e8400-e29b-41d4-a716-446655440003",
        "battery_serial": "BT001-001",
        "current_soc": 95,
        "current_soh": 98
      },
      {
        "battery_id": "880e8400-e29b-41d4-a716-446655440004",
        "battery_serial": "BT001-002",
        "current_soc": 92,
        "current_soh": 96
      }
    ]
  }
}
```

---

## 2. GET MY BOOKINGS

### 📍 **API Endpoint**
```http
GET /api/booking/my-bookings?status=pending
Authorization: Bearer <driver_token>
```

### 🔄 **DATA FLOW DIAGRAM**

```
┌─────────────────────────────────────────────────────────────────────┐
│                           CLIENT REQUEST                             │
│  GET /api/booking/my-bookings?status=pending                        │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      ROUTE LAYER (booking.route.js)                  │
├─────────────────────────────────────────────────────────────────────┤
│  [1] verifyToken → Extract driver_id                                │
│  [2] authorizeRole('driver')                                        │
│  [3] validate(bookingValidation.getMyBookings)                     │
│      └─ Validate: status in ['pending','completed','cancelled']    │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  CONTROLLER (booking.controller.js)                  │
│                  Function: getMyBookings()                           │
├─────────────────────────────────────────────────────────────────────┤
│  📥 INPUT:                                                           │
│     - req.user.account_id → driver_id                               │
│     - req.query.status (optional)                                   │
│                                                                      │
│  🔧 PROCESSING:                                                      │
│     const result = await bookingService.getBookingsByDriver(        │
│       driver_id,                                                    │
│       { status }                                                    │
│     );                                                              │
│                                                                      │
│  📤 OUTPUT:                                                          │
│     res.status(200).json({                                          │
│       message: 'Bookings retrieved successfully',                  │
│       total: result.total,                                         │
│       bookings: result.bookings                                    │
│     });                                                             │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   SERVICE (booking.service.js)                       │
│                   Function: getBookingsByDriver()                    │
└─────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
    ┌────────────────────────────────────────────┐
    │   🧹 LAZY CLEANUP (Auto-cancel expired)    │
    ├────────────────────────────────────────────┤
    │ Query: Booking.findAll                     │
    │ WHERE:                                     │
    │   - driver_id                              │
    │   - status = 'pending'                     │
    │   - expired_time < now                     │
    │                                            │
    │ For each expired booking:                  │
    │   [1] booking.update({ status: 'cancelled' })│
    │   [2] For each battery:                    │
    │       • Get battery.current_soh            │
    │       • IF soh >= 70:                      │
    │           CabinetSlot.update(              │
    │             { status: 'occupied' }         │
    │           )                                │
    │       • ELSE:                              │
    │           CabinetSlot.update(              │
    │             { status: 'locked' }           │
    │           )                                │
    └──────┬─────────────────────────────────────┘
           │
           ▼
    ┌──────────────────────────┐
    │   Query Main Bookings    │
    ├──────────────────────────┤
    │ Query: Booking.findAll   │
    │ WHERE:                   │
    │   - driver_id            │
    │   - status (if provided) │
    │                          │
    │ Include:                 │
    │   - vehicle (with model) │
    │   - station              │
    │   - batteries            │
    │                          │
    │ Order: expired_time DESC │
    └──────┬───────────────────┘
           │
           ▼
    ┌───────────────────────┐
    │   Format Response     │
    ├───────────────────────┤
    │ Convert all datetime  │
    │ to Vietnam timezone   │
    │ (UTC+7)               │
    └──────┬────────────────┘
           │
           ▼
    ┌────────────────────┐
    │   Return Result    │
    │   {                │
    │     bookings,      │
    │     total          │
    │   }                │
    └────────────────────┘
```

### 💡 **LAZY CLEANUP LOGIC**

```
┌──────────────────────────────────────────────────┐
│  WHY LAZY CLEANUP?                               │
├──────────────────────────────────────────────────┤
│  • User luôn thấy data fresh (no stale data)     │
│  • Không cần đợi cron job chạy                   │
│  • Cleanup on-demand khi user request            │
│  • Giảm load cho cron job                        │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│  WHEN TRIGGERED?                                 │
├──────────────────────────────────────────────────┤
│  ✓ Mỗi khi driver gọi GET /my-bookings           │
│  ✓ Trước khi query bookings chính                │
│  ✓ Chỉ cleanup của driver đang request           │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│  SLOT UNLOCK LOGIC                               │
├──────────────────────────────────────────────────┤
│  IF battery.current_soh >= 70:                   │
│    slot.status = 'occupied'  ← Sẵn sàng book lại │
│  ELSE:                                           │
│    slot.status = 'locked'    ← Cần bảo trì       │
└──────────────────────────────────────────────────┘
```

### 📊 **DATABASE QUERIES**

| Query | Purpose | Conditions |
|-------|---------|------------|
| `Booking.findAll()` (cleanup) | Find expired pending bookings | `expired_time < now`, `status = 'pending'` |
| `Booking.update()` | Cancel expired bookings | Set `status = 'cancelled'` |
| `CabinetSlot.update()` | Unlock slots | Based on battery SOH |
| `Booking.findAll()` (main) | Get driver's bookings | Filter by status, order by expired_time |

### ✅ **SUCCESS RESPONSE**

```json
{
  "message": "Bookings retrieved successfully",
  "total": 5,
  "bookings": [
    {
      "booking_id": "...",
      "status": "pending",
      "create_time": "2025-11-23 14:30:00",
      "expired_time": "2025-11-23 15:00:00",
      "vehicle": {
        "vehicle_id": "...",
        "license_plate": "30A-12345",
        "model": {
          "name": "VinFast Ludo",
          "brand": "VinFast"
        }
      },
      "station": {
        "station_id": 1,
        "station_name": "Trạm Thủ Đức",
        "address": "...",
        "status": "operational"
      },
      "batteries": [
        {
          "battery_id": "...",
          "battery_serial": "BT001-001",
          "current_soc": 95
        }
      ]
    }
  ]
}
```

---

## 3. CHECK AVAILABILITY

### 📍 **API Endpoint**
```http
GET /api/booking/check-availability?station_id=1&vehicle_id=<uuid>
Authorization: Bearer <driver_token>
```

### 🔄 **DATA FLOW DIAGRAM**

```
┌─────────────────────────────────────────────────────────────────────┐
│                           CLIENT REQUEST                             │
│  GET /check-availability?station_id=1&vehicle_id=<uuid>             │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      ROUTE LAYER (booking.route.js)                  │
├─────────────────────────────────────────────────────────────────────┤
│  [1] verifyToken                                                     │
│  [2] authorizeRole('driver')                                        │
│  [3] validate(bookingValidation.checkAvailability)                 │
│      ├─ station_id: required, positive integer                     │
│      └─ vehicle_id: required, valid UUID                           │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  CONTROLLER (booking.controller.js)                  │
│                  Function: checkAvailability()                       │
├─────────────────────────────────────────────────────────────────────┤
│  📥 INPUT:                                                           │
│     - req.query.station_id                                          │
│     - req.query.vehicle_id                                          │
│                                                                      │
│  🔧 PROCESSING:                                                      │
│     const result = await bookingService.checkAvailability(          │
│       parseInt(station_id),                                         │
│       vehicle_id                                                    │
│     );                                                              │
│                                                                      │
│  📤 OUTPUT:                                                          │
│     res.status(200).json({                                          │
│       message: result.message,                                     │
│       ...result                                                    │
│     });                                                             │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   SERVICE (booking.service.js)                       │
│                   Function: checkAvailability()                      │
└─────────────────────────────────────────────────────────────────────┘
                             │
         ┌───────────────────┴───────────────────┐
         ▼                                       ▼
┌──────────────────────┐              ┌──────────────────────┐
│   STEP 1             │              │   STEP 2             │
│   Check Station      │              │   Get Vehicle Info   │
├──────────────────────┤              ├──────────────────────┤
│ Station.findByPk()   │              │ Vehicle.findByPk()   │
│                      │              │   Include:           │
│ IF not found:        │              │   - model            │
│   → 404 Error        │              │   - batteryType      │
│                      │              │                      │
│ IF not operational:  │              │ Extract:             │
│   → Return early     │              │ - battery_type_id    │
│   {                  │              │ - battery_type_code  │
│     available: false,│              │                      │
│     message: "..."   │              │ IF not found:        │
│   }                  │              │   → 404 Error        │
└──────┬───────────────┘              └──────┬───────────────┘
       │                                     │
       └──────────────┬──────────────────────┘
                      ▼
    ┌─────────────────────────────────────┐
    │   STEP 3: Find Available Batteries  │
    │   ↓ findAvailableBatteries()        │
    ├─────────────────────────────────────┤
    │ (Same as Create Booking Step 11)   │
    │                                     │
    │ Return: Array<Battery>              │
    └──────┬──────────────────────────────┘
           │
           ▼
    ┌──────────────────────────────┐
    │   STEP 4: Count Statistics   │
    ├──────────────────────────────┤
    │ [1] available_batteries =    │
    │     availableBatteries.length│
    │                              │
    │ [2] Battery.count()          │
    │     WHERE:                   │
    │     - battery_type_id        │
    │     - slot_id NOT NULL       │
    │     - cabinet at station     │
    │                              │
    │ [3] CabinetSlot.count()      │
    │     WHERE:                   │
    │     - cabinet at station     │
    └──────┬───────────────────────┘
           │
           ▼
    ┌────────────────────────┐
    │   Build Response       │
    ├────────────────────────┤
    │ {                      │
    │   available: boolean,  │
    │   message: string,     │
    │   station: {...},      │
    │   battery_type: {...}, │
    │   availability_details │
    │ }                      │
    └────────────────────────┘
```

### 📊 **RESPONSE BREAKDOWN**

```javascript
{
  "available": true,  // ← Có pin sẵn sàng hay không
  
  "message": "Station has 10 available VF-STD batteries",
  
  "station": {
    "station_id": 1,
    "station_name": "Trạm Thủ Đức",
    "address": "123 Võ Văn Ngân",
    "status": "operational"
  },
  
  "battery_type": {
    "battery_type_id": 1,
    "battery_type_code": "VF-STD"  // ← Pin xe này cần
  },
  
  "availability_details": {
    "available_batteries": 10,      // ← Số pin BOOK ĐƯỢC NGAY
                                    //   (SOC≥90%, SOH≥70%, occupied)
    
    "total_batteries_of_type": 25,  // ← Tổng pin loại này tại trạm
                                    //   (kể cả booked/locked/SOC thấp)
    
    "total_slots": 50,              // ← Tổng slots tại trạm
    
    "station_status": "operational" // ← Trạng thái trạm
  }
}
```

### ⚙️ **BATTERY AVAILABILITY CRITERIA**

```
┌─────────────────────────────────────────────────────┐
│  PIN ĐƯỢC TÍNH LÀ "AVAILABLE" KHI:                  │
├─────────────────────────────────────────────────────┤
│  ✓ Đúng battery_type_id (match với xe)              │
│  ✓ current_soc >= 90%   (đủ năng lượng)            │
│  ✓ current_soh >= 70%   (pin còn tốt)              │
│  ✓ slot.status = 'occupied' (chưa bị book)         │
│  ✓ cabinet.status = 'operational' (tủ hoạt động)   │
│  ✓ station.status = 'operational' (trạm hoạt động) │
└─────────────────────────────────────────────────────┘
```

---

## 4. GET BOOKING BY ID

### 📍 **API Endpoint**
```http
GET /api/booking/{booking_id}
Authorization: Bearer <token> (Optional - Public for kiosk)
```

### 🔄 **DATA FLOW DIAGRAM**

```
┌─────────────────────────────────────────────────────────────────────┐
│                           CLIENT REQUEST                             │
│  GET /api/booking/550e8400-e29b-41d4-a716-446655440000              │
│  Authorization: (Optional)                                           │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      ROUTE LAYER (booking.route.js)                  │
├─────────────────────────────────────────────────────────────────────┤
│  ⚠️  NO verifyToken middleware → PUBLIC ACCESS                      │
│  [1] validate(bookingValidation.getBookingById)                    │
│      └─ Validate: booking_id is valid UUID                         │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  CONTROLLER (booking.controller.js)                  │
│                  Function: getBookingById()                          │
├─────────────────────────────────────────────────────────────────────┤
│  📥 INPUT:                                                           │
│     - req.params.id → booking_id                                    │
│     - req.user (optional - if authenticated)                        │
│                                                                      │
│  🔧 PROCESSING:                                                      │
│     let ownerDriverId = null;                                       │
│     if (req.user) {                                                 │
│       const driver_id = req.user.account_id;                        │
│       const role = req.user.role;                                   │
│       ownerDriverId = role !== 'admin' ? driver_id : null;         │
│     }                                                               │
│                                                                      │
│     const booking = await bookingService.getBookingById(            │
│       id,                                                           │
│       ownerDriverId                                                 │
│     );                                                              │
│                                                                      │
│  📤 OUTPUT:                                                          │
│     res.status(200).json({                                          │
│       message: 'Booking retrieved successfully',                   │
│       booking                                                       │
│     });                                                             │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   SERVICE (booking.service.js)                       │
│                   Function: getBookingById()                         │
└─────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
    ┌──────────────────────────────────────┐
    │   Query Booking with Full Relations  │
    ├──────────────────────────────────────┤
    │ Booking.findByPk(booking_id, {       │
    │   include: [                         │
    │     {                                │
    │       model: Account,                │
    │       as: 'driver',                  │
    │       attributes: [                  │
    │         'account_id',                │
    │         'fullname',                  │
    │         'email',                     │
    │         'phone_number'               │
    │       ]                              │
    │     },                               │
    │     {                                │
    │       model: Vehicle,                │
    │       as: 'vehicle',                 │
    │       include: [{                    │
    │         model: VehicleModel,         │
    │         as: 'model',                 │
    │         include: [{                  │
    │           model: BatteryType,        │
    │           as: 'batteryType'          │
    │         }]                           │
    │       }]                             │
    │     },                               │
    │     {                                │
    │       model: Station,                │
    │       as: 'station'                  │
    │     },                               │
    │     {                                │
    │       model: Battery,                │
    │       as: 'batteries'                │
    │     }                                │
    │   ]                                  │
    │ })                                   │
    └──────┬───────────────────────────────┘
           │
           ▼
    ┌────────────────────────┐
    │   Check Existence      │
    ├────────────────────────┤
    │ IF booking not found:  │
    │   → 404 Error          │
    └──────┬─────────────────┘
           │
           ▼
    ┌──────────────────────────────┐
    │   Check Authorization        │
    ├──────────────────────────────┤
    │ IF driver_id provided:       │
    │   IF booking.driver_id !=    │
    │      driver_id:              │
    │     → 403 Error              │
    │                              │
    │ IF driver_id = null:         │
    │   → Allow (public/kiosk/admin)│
    └──────┬───────────────────────┘
           │
           ▼
    ┌────────────────────────┐
    │   Format Datetime      │
    ├────────────────────────┤
    │ Convert to Vietnam     │
    │ timezone (UTC+7)       │
    │ - create_time          │
    │ - expired_time         │
    └──────┬─────────────────┘
           │
           ▼
    ┌────────────────────┐
    │   Return Booking   │
    └────────────────────┘
```

### 🔐 **ACCESS CONTROL LOGIC**

```
┌────────────────────────────────────────────────────┐
│  NO TOKEN (Kiosk/Station)                          │
├────────────────────────────────────────────────────┤
│  req.user = undefined                              │
│  ownerDriverId = null                              │
│  → Access granted to ANY booking                   │
│  ✓ Use case: Kiosk scan QR code để xem booking    │
└────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────┐
│  DRIVER TOKEN                                      │
├────────────────────────────────────────────────────┤
│  req.user.role = 'driver'                          │
│  ownerDriverId = req.user.account_id               │
│  → Can only view OWN bookings                      │
│  ✗ Viewing other driver's booking → 403 Forbidden  │
└────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────┐
│  ADMIN TOKEN                                       │
├────────────────────────────────────────────────────┤
│  req.user.role = 'admin'                           │
│  ownerDriverId = null (bypass check)               │
│  → Can view ANY booking                            │
└────────────────────────────────────────────────────┘
```

---

## 5. CANCEL BOOKING

### 📍 **API Endpoint**
```http
PATCH /api/booking/{booking_id}/cancel
Authorization: Bearer <driver_token>
```

### 🔄 **DATA FLOW DIAGRAM**

```
┌─────────────────────────────────────────────────────────────────────┐
│                           CLIENT REQUEST                             │
│  PATCH /api/booking/550e8400-.../cancel                             │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      ROUTE LAYER (booking.route.js)                  │
├─────────────────────────────────────────────────────────────────────┤
│  [1] verifyToken                                                     │
│  [2] authorizeRole('driver')                                        │
│  [3] validate(bookingValidation.cancelBooking)                     │
│      └─ Validate: booking_id is valid UUID                         │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  CONTROLLER (booking.controller.js)                  │
│                  Function: cancelBooking()                           │
├─────────────────────────────────────────────────────────────────────┤
│  📥 INPUT:                                                           │
│     - req.params.id → booking_id                                    │
│     - req.user.account_id → driver_id                               │
│                                                                      │
│  🔧 PROCESSING:                                                      │
│     const result = await bookingService.cancelBooking(              │
│       id,                                                           │
│       driver_id                                                     │
│     );                                                              │
│                                                                      │
│  📤 OUTPUT:                                                          │
│     res.status(200).json({                                          │
│       message: result.message,                                     │
│       booking_id: result.booking_id                                │
│     });                                                             │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   SERVICE (booking.service.js)                       │
│                   Function: cancelBooking()                          │
└─────────────────────────────────────────────────────────────────────┘
                             │
         ┌───────────────────┴───────────────────┐
         ▼                                       ▼
┌──────────────────────┐              ┌──────────────────────┐
│   STEP 1             │              │   STEP 2             │
│   Find Booking       │              │   Check Ownership    │
├──────────────────────┤              ├──────────────────────┤
│ Booking.findByPk()   │              │ IF booking.driver_id │
│                      │              │    != driver_id:     │
│ IF not found:        │              │   → 403 Error        │
│   → 404 Error        │              │                      │
└──────┬───────────────┘              └──────┬───────────────┘
       │                                     │
       └──────────────┬──────────────────────┘
                      ▼
    ┌────────────────────────────────┐
    │   STEP 3: Check Status         │
    ├────────────────────────────────┤
    │ IF status != 'pending':        │
    │   → 422 Error                  │
    │   "Cannot cancel booking with  │
    │    status '{status}'. Only     │
    │    pending bookings can be     │
    │    cancelled."                 │
    └──────┬─────────────────────────┘
           │
           ▼
    ┌────────────────────────────────┐
    │   STEP 4: Update Status        │
    ├────────────────────────────────┤
    │ booking.update({               │
    │   status: 'cancelled'          │
    │ })                             │
    └──────┬─────────────────────────┘
           │
           ▼
    ┌─────────────────────────────────────┐
    │   STEP 5: Get Batteries & Slots     │
    ├─────────────────────────────────────┤
    │ BookingBattery.findAll({            │
    │   where: { booking_id },            │
    │   include: [{                       │
    │     model: Battery,                 │
    │     as: 'battery',                  │
    │     attributes: [                   │
    │       'battery_id',                 │
    │       'slot_id',                    │
    │       'current_soc',                │
    │       'current_soh'                 │
    │     ],                              │
    │     where: {                        │
    │       slot_id: { [Op.not]: null }  │
    │     }                               │
    │   }]                                │
    │ })                                  │
    └──────┬──────────────────────────────┘
           │
           ▼
    ┌────────────────────────────────────┐
    │   STEP 6: Unlock Cabinet Slots     │
    │   (Based on Battery Health)        │
    ├────────────────────────────────────┤
    │ For each battery:                  │
    │                                    │
    │   IF battery.current_soh >= 70:    │
    │     ┌──────────────────────────┐   │
    │     │ Pin còn tốt              │   │
    │     │ → status = 'occupied'    │   │
    │     │ (Sẵn sàng cho booking)   │   │
    │     └──────────────────────────┘   │
    │                                    │
    │   ELSE:                            │
    │     ┌──────────────────────────┐   │
    │     │ Pin yếu (SOH < 70%)      │   │
    │     │ → status = 'locked'      │   │
    │     │ (Cần bảo trì)            │   │
    │     └──────────────────────────┘   │
    │                                    │
    │ CabinetSlot.update(                │
    │   { status: newStatus },           │
    │   { where: { slot_id } }           │
    │ )                                  │
    └──────┬─────────────────────────────┘
           │
           ▼
    ┌────────────────────┐
    │   Return Result    │
    │   {                │
    │     message,       │
    │     booking_id     │
    │   }                │
    └────────────────────┘
```

### 🔓 **SLOT UNLOCK LOGIC**

```
┌────────────────────────────────────────────────────┐
│  DECISION TREE: Slot Status After Cancel          │
└────────────────────────────────────────────────────┘

                    Cancel Booking
                          ↓
                   Get Battery SOH
                          ↓
                    ┌──────────┐
                    │  SOH?    │
                    └─────┬────┘
                          │
            ┌─────────────┴─────────────┐
            ▼                           ▼
    ┌───────────────┐         ┌───────────────┐
    │  SOH >= 70%   │         │  SOH < 70%    │
    └───────┬───────┘         └───────┬───────┘
            │                         │
            ▼                         ▼
    ┌───────────────┐         ┌───────────────┐
    │   'occupied'  │         │   'locked'    │
    ├───────────────┤         ├───────────────┤
    │ ✅ Pin tốt     │         │ ⚠️  Pin yếu    │
    │ Book được ngay│         │ Cần bảo trì   │
    │ SOC sẽ check  │         │ Không book    │
    │ lúc booking   │         │ được          │
    └───────────────┘         └───────────────┘
```

### ⚠️ **ERROR CASES**

```
❌ 404 Not Found
   └─ Booking ID không tồn tại

❌ 403 Forbidden
   └─ Booking không thuộc về driver đang request
   └─ Chỉ owner mới cancel được

❌ 422 Unprocessable Entity
   └─ Booking status = 'completed' (đã hoàn thành)
   └─ Booking status = 'cancelled' (đã hủy rồi)
   └─ Chỉ cancel được status = 'pending'
```

### ✅ **SUCCESS RESPONSE**

```json
{
  "message": "Booking cancelled successfully",
  "booking_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

## 6. HELPER FUNCTIONS

### 6.1 `checkVehicleSubscription()`

```
┌─────────────────────────────────────────┐
│  Purpose: Validate active subscription  │
├─────────────────────────────────────────┤
│  Input:  vehicle_id (string)            │
│  Output: void (throws error if invalid) │
└─────────────────────────────────────────┘

Query: Subscription.findOne({
  where: {
    vehicle_id,
    cancel_time: null,           ← Chưa bị hủy
    end_date: { [Op.gte]: today } ← Chưa hết hạn
  }
})

IF found:
  ✓ Continue

IF not found:
  ✗ Throw 422: "Vehicle does not have an active subscription"
```

### 6.2 `checkDuplicateBooking()`

```
┌─────────────────────────────────────────────┐
│  Purpose: Prevent multiple pending bookings │
├─────────────────────────────────────────────┤
│  Input:                                     │
│    - driver_id (string)                     │
│    - vehicle_id (string)                    │
│    - excludeBookingId (string, optional)    │
│  Output: void (throws error if duplicate)   │
└─────────────────────────────────────────────┘

Query: Booking.findOne({
  where: {
    vehicle_id,                  ← Cùng xe
    status: 'pending',           ← Đang pending
    expired_time: { [Op.gt]: now } ← Chưa expired
  }
})

IF found:
  ✗ Throw 409: "Vehicle already has pending booking"

IF not found:
  ✓ Continue
```

### 6.3 `findAvailableBatteries()`

```
┌──────────────────────────────────────────────┐
│  Purpose: Find batteries ready for booking   │
├──────────────────────────────────────────────┤
│  Input:                                      │
│    - station_id (integer)                    │
│    - battery_type_id (integer)               │
│  Output: Array<Battery>                      │
└──────────────────────────────────────────────┘

STEP 1: Get Operational Cabinets
┌────────────────────────────────────┐
│ Cabinet.findAll({                  │
│   where: {                         │
│     station_id,                    │
│     status: 'operational'          │
│   }                                │
│ })                                 │
│                                    │
│ → Extract cabinet_ids              │
└────────────────────────────────────┘
                 ↓
STEP 2: Get Occupied Slots
┌────────────────────────────────────┐
│ CabinetSlot.findAll({              │
│   where: {                         │
│     cabinet_id: { [Op.in]: [...] },│
│     status: 'occupied'             │
│   }                                │
│ })                                 │
│                                    │
│ → Extract slot_ids                 │
└────────────────────────────────────┘
                 ↓
STEP 3: Find Suitable Batteries
┌────────────────────────────────────┐
│ Battery.findAll({                  │
│   where: {                         │
│     slot_id: { [Op.in]: [...] },   │
│     battery_type_id,               │
│     current_soc: { [Op.gte]: 90 }, │
│     current_soh: { [Op.gte]: 70 }  │
│   }                                │
│ })                                 │
│                                    │
│ → Return batteries                 │
└────────────────────────────────────┘
```

### 6.4 `formatToVietnamTime()`

```
┌────────────────────────────────────────┐
│  Purpose: Convert UTC to Vietnam time  │
├────────────────────────────────────────┤
│  Input:  Date object (UTC)             │
│  Output: String (YYYY-MM-DD HH:mm:ss)  │
└────────────────────────────────────────┘

const d = new Date(date);
const vietnamTime = new Date(d.getTime() + (7 * 60 * 60 * 1000));
                                           └─ UTC+7 offset

Format: YYYY-MM-DD HH:mm:ss
Example: 2025-11-23 14:30:00
```

---

## 📈 PERFORMANCE CONSIDERATIONS

### Parallel Queries
```javascript
// ❌ Sequential (slow)
const vehicle = await Vehicle.findByPk(id);
const model = await VehicleModel.findByPk(vehicle.model_id);

// ✅ Parallel (fast)
const [vehicle, model] = await Promise.all([
  Vehicle.findByPk(id),
  VehicleModel.findByPk(model_id)
]);
```

### Eager Loading
```javascript
// ✅ One query with joins
const booking = await Booking.findByPk(id, {
  include: [
    { model: Account, as: 'driver' },
    { model: Vehicle, as: 'vehicle' },
    { model: Station, as: 'station' }
  ]
});
```

### Lazy Cleanup
```javascript
// ✅ Cleanup on-demand
// Giảm load cho cron job
// User luôn thấy data fresh
```

---

## 🔐 SECURITY BEST PRACTICES

### Authentication
- ✅ JWT token verification
- ✅ Role-based access control
- ✅ Public endpoints cho kiosk

### Authorization
- ✅ Ownership checks (driver chỉ xem/cancel booking của mình)
- ✅ Admin bypass (admin xem tất cả)
- ✅ Prevent cross-driver access

### Validation
- ✅ Input validation (express-validator)
- ✅ UUID format checks
- ✅ Business rule validation

---

## 📝 NOTES

### Transaction Handling
- Các operations quan trọng (create booking, cancel) chưa wrap trong transaction
- Recommend: Sử dụng Sequelize transactions cho data consistency

### Error Handling
- Tất cả errors có statusCode
- Controller sử dụng asyncHandler để catch errors tự động
- Middleware errorHandler format response thống nhất

### Timezone
- Database: UTC
- Response: Vietnam timezone (UTC+7)
- Format: YYYY-MM-DD HH:mm:ss

---

**End of Documentation**
