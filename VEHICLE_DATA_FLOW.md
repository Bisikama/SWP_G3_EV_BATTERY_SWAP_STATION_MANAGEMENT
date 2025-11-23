# 🚗 VEHICLE MODULE - DATA FLOW DOCUMENTATION

> **Module:** Vehicle Management System  
> **Developer:** Hau Pham  
> **Description:** Chi tiết luồng dữ liệu và business logic của tất cả chức năng Vehicle

---

## 📑 TABLE OF CONTENTS

1. [Register Vehicle](#1-register-vehicle)
2. [Get My Vehicles](#2-get-my-vehicles)
3. [Get Vehicles By User ID](#3-get-vehicles-by-user-id)
4. [Get Vehicle By VIN](#4-get-vehicle-by-vin)
5. [Get Vehicle By ID](#5-get-vehicle-by-id)
6. [Get Vehicles Without Batteries](#6-get-vehicles-without-batteries)
7. [Update Vehicle](#7-update-vehicle)
8. [Delete Vehicle](#8-delete-vehicle)
9. [Helper Functions](#9-helper-functions)

---

## 1. REGISTER VEHICLE

### 📍 **API Endpoint**
```http
POST /api/vehicles
Authorization: Bearer <driver_token>
Content-Type: application/json

{
  "vin": "RL9LUD24HN00001",
  "license_plate": "30A-12345"
}
```

### 💡 **CONCEPT: Pre-seeded Vehicle Activation**

```
┌──────────────────────────────────────────────────────────┐
│  PRE-SEEDED PATTERN                                      │
├──────────────────────────────────────────────────────────┤
│  [ADMIN]                                                 │
│    ↓ Seeds vehicles vào database                        │
│    ↓ Vehicle { vin, model_id, driver_id=null }         │
│                                                          │
│  [DATABASE]                                              │
│    ↓ Xe đã có sẵn với driver_id = null                  │
│    ↓ Status = inactive                                  │
│                                                          │
│  [DRIVER]                                                │
│    ↓ Cung cấp VIN + license_plate                       │
│    ↓ Kích hoạt xe (activate)                            │
│                                                          │
│  [RESULT]                                                │
│    ✓ driver_id = <driver_id>                            │
│    ✓ license_plate = <plate>                            │
│    ✓ status = active                                    │
└──────────────────────────────────────────────────────────┘
```

### 🔄 **DATA FLOW DIAGRAM**

```
┌─────────────────────────────────────────────────────────────────────┐
│                           CLIENT REQUEST                             │
│  POST /api/vehicles                                                  │
│  Body: { vin: "RL9LUD24HN00001", license_plate: "30A-12345" }      │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      ROUTE LAYER (vehicles.route.js)                 │
├─────────────────────────────────────────────────────────────────────┤
│  [1] verifyToken                                                     │
│      ├─ Decode JWT token                                            │
│      └─ Extract: req.user = { account_id, role, email }            │
│                                                                      │
│  [2] validate(vehicleValidation.register)                          │
│      ├─ Validate: license_plate format (Vietnam)                   │
│      └─ Pattern: /^[0-9]{2}[A-Z]{1,2}-[0-9]{4,5}$/i               │
│                                                                      │
│  [3] validateVin (custom middleware)                               │
│      ├─ Validate: VIN format RL9[VDS][VIS]                        │
│      └─ Length: 17 characters                                      │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  CONTROLLER (vehicle.controller.js)                  │
│                  Function: registerVehicle()                         │
├─────────────────────────────────────────────────────────────────────┤
│  📥 INPUT:                                                           │
│     - req.user.account_id → driver_id                               │
│     - req.body.vin                                                  │
│     - req.body.license_plate                                        │
│                                                                      │
│  🔧 PROCESSING:                                                      │
│     const vehicle = await vehicleService.registerVehicle(           │
│       driver_id,                                                    │
│       { vin, license_plate }                                        │
│     );                                                              │
│                                                                      │
│  📤 OUTPUT:                                                          │
│     res.status(201).json({                                          │
│       message: 'Vehicle registered successfully',                  │
│       vehicle                                                       │
│     });                                                             │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   SERVICE (vehicle.service.js)                       │
│                   Function: registerVehicle()                        │
└─────────────────────────────────────────────────────────────────────┘
                             │
         ┌───────────────────┴───────────────────┐
         ▼                                       ▼
┌──────────────────────┐              ┌──────────────────────┐
│   STEP 1             │              │   STEP 2             │
│   Validate Input     │              │   Normalize VIN      │
├──────────────────────┤              ├──────────────────────┤
│ Check required:      │              │ const normalizedVin  │
│ - vin               │              │   = vin.toUpperCase()│
│ - license_plate     │              │                      │
│                      │              │ Why uppercase?       │
│ IF missing:          │              │ → Database stores    │
│   Throw 400         │              │   VIN in uppercase   │
└──────┬───────────────┘              └──────┬───────────────┘
       │                                     │
       └──────────────┬──────────────────────┘
                      ▼
    ┌───────────────────────────────┐
    │   STEP 3: Validate Driver     │
    ├───────────────────────────────┤
    │ Query: Account.findByPk(      │
    │   driver_id                   │
    │ )                             │
    │                               │
    │ Checks:                       │
    │ [1] Account exists?           │
    │     IF not → 403 Error        │
    │                               │
    │ [2] Role = 'driver'?          │
    │     IF not → 403 Error        │
    └──────┬────────────────────────┘
           │
           ▼
    ┌─────────────────────────────────┐
    │   STEP 4: Check Documents       │
    ├─────────────────────────────────┤
    │ Required documents:             │
    │ - driver.citizen_id             │
    │ - driver.driving_license        │
    │                                 │
    │ IF missing:                     │
    │   const missingFields = [];     │
    │   if (!citizen_id)              │
    │     missingFields.push(...)     │
    │   if (!driving_license)         │
    │     missingFields.push(...)     │
    │                                 │
    │   Throw 403 Error with fields   │
    └──────┬──────────────────────────┘
           │
           ▼
    ┌──────────────────────────────────┐
    │   STEP 5: Find Vehicle by VIN    │
    ├──────────────────────────────────┤
    │ Query: Vehicle.findOne({         │
    │   where: { vin: normalizedVin }, │
    │   include: [{                    │
    │     model: VehicleModel,         │
    │     as: 'model'                  │
    │   }]                             │
    │ })                               │
    │                                  │
    │ ⚠️  Note: findOne, NOT create    │
    │    Vehicle must exist in DB      │
    └──────┬───────────────────────────┘
           │
           ▼
    ┌────────────────────────┐
    │   STEP 6: Check Found  │
    ├────────────────────────┤
    │ IF vehicle NOT found:  │
    │   Throw 404 Error      │
    │   "VIN not found"      │
    │                        │
    │ Hint: Vehicle must be  │
    │ seeded by admin first  │
    └──────┬─────────────────┘
           │
           ▼
    ┌─────────────────────────────────┐
    │   STEP 7: Check Availability    │
    ├─────────────────────────────────┤
    │ IF vehicle.driver_id !== null:  │
    │   Throw 409 Error               │
    │   "Already registered"          │
    │                                 │
    │ Logic:                          │
    │ • driver_id = null → Available  │
    │ • driver_id = <id> → Taken      │
    └──────┬──────────────────────────┘
           │
           ▼
    ┌──────────────────────────────────┐
    │   STEP 8: Check Duplicate Plate  │
    ├──────────────────────────────────┤
    │ Query: Vehicle.findOne({         │
    │   where: { license_plate }       │
    │ })                               │
    │                                  │
    │ IF found:                        │
    │   Throw 409 Error                │
    │   "License plate exists"         │
    └──────┬───────────────────────────┘
           │
           ▼
    ┌───────────────────────────┐
    │   STEP 9: Activate        │
    ├───────────────────────────┤
    │ vehicle.driver_id =       │
    │   driver_id               │
    │ vehicle.license_plate =   │
    │   license_plate           │
    │ vehicle.status = 'active' │
    │                           │
    │ await vehicle.save()      │
    └──────┬────────────────────┘
           │
           ▼
    ┌────────────────────────────────┐
    │   STEP 10: Get Full Details    │
    │   ↓ findVehicleWithModel()     │
    ├────────────────────────────────┤
    │ Query: Vehicle.findByPk        │
    │ Include:                       │
    │   - VehicleModel               │
    │   - BatteryType                │
    │                                │
    │ Return: Vehicle object         │
    └────────────────────────────────┘
```

### 📊 **DATABASE QUERIES SUMMARY**

| Step | Query | Purpose | Return |
|------|-------|---------|--------|
| 3 | `Account.findByPk()` | Validate driver exists | `Account` object |
| 5 | `Vehicle.findOne()` | Find pre-seeded vehicle | `Vehicle` with model |
| 8 | `Vehicle.findOne()` | Check duplicate plate | `Vehicle` or null |
| 9 | `vehicle.save()` | Update vehicle fields | Updated `Vehicle` |
| 10 | `Vehicle.findByPk()` | Get full vehicle details | Vehicle with relations |

### ⚠️ **ERROR CASES**

```
❌ 400 Bad Request
   └─ Missing VIN or license_plate
   └─ License plate wrong format (not Vietnam format)

❌ 403 Forbidden
   └─ User is not a driver
   └─ Driver missing citizen_id document
   └─ Driver missing driving_license document
   └─ Driver missing both documents

❌ 404 Not Found
   └─ VIN not found in database
   └─ Hint: Vehicle must be pre-seeded by admin

❌ 409 Conflict
   └─ VIN already registered by another driver
   └─ License plate already exists
```

### ✅ **SUCCESS RESPONSE**

```json
{
  "message": "Vehicle registered successfully",
  "vehicle": {
    "vehicle_id": "770e8400-e29b-41d4-a716-446655440002",
    "driver_id": "660e8400-e29b-41d4-a716-446655440001",
    "model_id": 1,
    "license_plate": "30A-12345",
    "vin": "RL9LUD24HN00001",
    "status": "active",
    "model": {
      "model_id": 1,
      "name": "VinFast Ludo",
      "brand": "VinFast",
      "avg_energy_usage": 15.5,
      "battery_slot": 2,
      "battery_type_id": 1,
      "batteryType": {
        "battery_type_id": 1,
        "battery_type_code": "VF-STD",
        "nominal_capacity": 50.4
      }
    }
  }
}
```

---

## 2. GET MY VEHICLES

### 📍 **API Endpoint**
```http
GET /api/vehicles?status=active
Authorization: Bearer <driver_token>
```

### 🔄 **DATA FLOW DIAGRAM**

```
┌─────────────────────────────────────────────────────────────────────┐
│                           CLIENT REQUEST                             │
│  GET /api/vehicles?status=active                                    │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      ROUTE LAYER (vehicles.route.js)                 │
├─────────────────────────────────────────────────────────────────────┤
│  [1] verifyToken → Extract driver_id                                │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  CONTROLLER (vehicle.controller.js)                  │
│                  Function: getMyVehicles()                           │
├─────────────────────────────────────────────────────────────────────┤
│  📥 INPUT:                                                           │
│     - req.user.account_id → driver_id                               │
│     - req.query.status (optional)                                   │
│                                                                      │
│  🔧 PROCESSING:                                                      │
│     const vehicles = await vehicleService.getVehiclesByDriver(      │
│       driver_id,                                                    │
│       { status }                                                    │
│     );                                                              │
│                                                                      │
│  📤 OUTPUT:                                                          │
│     res.status(200).json({                                          │
│       message: 'Vehicles retrieved successfully',                  │
│       count: vehicles.length,                                      │
│       vehicles                                                     │
│     });                                                             │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   SERVICE (vehicle.service.js)                       │
│                   Function: getVehiclesByDriver()                    │
└─────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
    ┌────────────────────────────────┐
    │   STEP 1: Validate driver_id   │
    ├────────────────────────────────┤
    │ IF !driver_id:                 │
    │   Throw 400 Error              │
    └──────┬─────────────────────────┘
           │
           ▼
    ┌──────────────────────────────────┐
    │   STEP 2: Build WHERE Clause     │
    ├──────────────────────────────────┤
    │ const where = { driver_id };     │
    │                                  │
    │ IF status === 'active':          │
    │   where.status = 'active'        │
    │                                  │
    │ IF status === 'inactive':        │
    │   where.status = 'inactive'      │
    │                                  │
    │ IF status === 'all':             │
    │   (no filter, get all)           │
    └──────┬───────────────────────────┘
           │
           ▼
    ┌────────────────────────────────────┐
    │   STEP 3: Query Vehicles           │
    ├────────────────────────────────────┤
    │ Query: Vehicle.findAll({           │
    │   where,                           │
    │   include: [                       │
    │     {                              │
    │       model: VehicleModel,         │
    │       as: 'model',                 │
    │       include: [{                  │
    │         model: BatteryType,        │
    │         as: 'batteryType'          │
    │       }]                           │
    │     }                              │
    │   ]                                │
    │ })                                 │
    │                                    │
    │ Return: Array<Vehicle>             │
    └────────────────────────────────────┘
```

### 🎯 **STATUS FILTER LOGIC**

```
┌────────────────────────────────────────────┐
│  Query Parameter: status                   │
├────────────────────────────────────────────┤
│  ?status=active                            │
│    → WHERE driver_id AND status='active'   │
│                                            │
│  ?status=inactive                          │
│    → WHERE driver_id AND status='inactive' │
│                                            │
│  ?status=all (or omitted)                  │
│    → WHERE driver_id (no status filter)    │
└────────────────────────────────────────────┘
```

### ✅ **SUCCESS RESPONSE**

```json
{
  "message": "Vehicles retrieved successfully",
  "count": 2,
  "vehicles": [
    {
      "vehicle_id": "770e8400-e29b-41d4-a716-446655440002",
      "driver_id": "660e8400-e29b-41d4-a716-446655440001",
      "model_id": 1,
      "license_plate": "30A-12345",
      "vin": "RL9LUD24HN00001",
      "status": "active",
      "model": {
        "model_id": 1,
        "name": "VinFast Ludo",
        "brand": "VinFast",
        "avg_energy_usage": 15.5,
        "battery_slot": 2,
        "batteryType": {
          "battery_type_id": 1,
          "battery_type_code": "VF-STD",
          "nominal_capacity": 50.4
        }
      }
    }
  ]
}
```

---

## 3. GET VEHICLES BY USER ID

### 📍 **API Endpoint**
```http
GET /api/vehicles/user/{userId}
Authorization: None (Public for kiosk)
```

### 💡 **USE CASE: Kiosk Access**

```
┌──────────────────────────────────────────┐
│  WHY PUBLIC?                             │
├──────────────────────────────────────────┤
│  • Kiosk/Station hardware needs access  │
│  • User scans QR code at kiosk          │
│  • Kiosk gets userId, queries vehicles  │
│  • No authentication required           │
└──────────────────────────────────────────┘
```

### 🔄 **DATA FLOW DIAGRAM**

```
┌─────────────────────────────────────────────────────────────────────┐
│                           CLIENT REQUEST                             │
│  GET /api/vehicles/user/660e8400-e29b-41d4-a716-446655440001        │
│  Authorization: None                                                 │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      ROUTE LAYER (vehicles.route.js)                 │
├─────────────────────────────────────────────────────────────────────┤
│  ⚠️  NO verifyToken middleware → PUBLIC ACCESS                      │
│  [1] validate(vehicleValidation.findByUserId)                      │
│      └─ Validate: userId is valid UUID                             │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  CONTROLLER (vehicle.controller.js)                  │
│                  Function: getVehiclesByUserId()                     │
├─────────────────────────────────────────────────────────────────────┤
│  📥 INPUT:                                                           │
│     - req.params.userId                                             │
│                                                                      │
│  🔧 PROCESSING:                                                      │
│     const vehicles = await vehicleService.getVehiclesByDriver(      │
│       userId,                                                       │
│       { status: 'active' }  ← Only active vehicles                 │
│     );                                                              │
│                                                                      │
│  📤 OUTPUT:                                                          │
│     res.status(200).json({                                          │
│       message: vehicles.length > 0                                 │
│         ? 'Vehicles retrieved successfully'                        │
│         : 'No vehicles found for this user',                       │
│       count: vehicles.length,                                      │
│       vehicles                                                     │
│     });                                                             │
└─────────────────────────────────────────────────────────────────────┘
```

### 🔓 **PUBLIC ACCESS - NO AUTH**

```
┌────────────────────────────────────────┐
│  Access Control: NONE                  │
├────────────────────────────────────────┤
│  ✓ Anyone can query                    │
│  ✓ No token required                   │
│  ✓ Returns only active vehicles        │
│  ✓ Use case: Kiosk, Station hardware   │
└────────────────────────────────────────┘
```

---

## 4. GET VEHICLE BY VIN

### 📍 **API Endpoint**
```http
GET /api/vehicles/vin/RL9LUD24HN00001
Authorization: None (Public)
```

### 🔄 **DATA FLOW DIAGRAM**

```
┌─────────────────────────────────────────────────────────────────────┐
│                           CLIENT REQUEST                             │
│  GET /api/vehicles/vin/RL9LUD24HN00001                              │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      ROUTE LAYER (vehicles.route.js)                 │
├─────────────────────────────────────────────────────────────────────┤
│  [1] validate(vehicleValidation.findByVin)                         │
│  [2] validateVin (custom middleware)                               │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  CONTROLLER (vehicle.controller.js)                  │
│                  Function: getVehicleByVin()                         │
├─────────────────────────────────────────────────────────────────────┤
│  📥 INPUT: req.params.vin                                            │
│  🔧 CALL: vehicleService.getVehicleByVin(vin)                       │
│  📤 OUTPUT: res.status(200).json({ vehicle })                        │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   SERVICE (vehicle.service.js)                       │
│                   Function: getVehicleByVin()                        │
└─────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
    ┌────────────────────────────────────┐
    │   Normalize & Query                │
    ├────────────────────────────────────┤
    │ const normalizedVin =              │
    │   vin.toUpperCase()                │
    │                                    │
    │ Query: Vehicle.findOne({           │
    │   where: { vin: normalizedVin },   │
    │   include: [                       │
    │     VehicleModel (with BatteryType)│
    │     Account (driver info)          │
    │   ]                                │
    │ })                                 │
    │                                    │
    │ IF not found: Throw 404            │
    │ Return: Vehicle object             │
    └────────────────────────────────────┘
```

---

## 5. GET VEHICLE BY ID

### 📍 **API Endpoint**
```http
GET /api/vehicles/{vehicle_id}
Authorization: Bearer <token>
```

### 🔄 **DATA FLOW DIAGRAM**

```
Simple flow:
  Route → Controller → Service → findVehicleWithModel()
  
Service logic:
  IF includeRelations = true:
    → Call findVehicleWithModel() (with full includes)
  ELSE:
    → Vehicle.findByPk() (basic info only)
```

---

## 6. GET VEHICLES WITHOUT BATTERIES

### 📍 **API Endpoint**
```http
GET /api/vehicles/without-batteries
Authorization: Bearer <token>
```

### 🔄 **DATA FLOW DIAGRAM**

```
┌─────────────────────────────────────────────────────────────────────┐
│                   SERVICE (vehicle.service.js)                       │
│                   Function: getVehiclesWithoutBatteries()            │
└─────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
    ┌────────────────────────────────────┐
    │   STEP 1: Query All Vehicles       │
    ├────────────────────────────────────┤
    │ Query: Vehicle.findAll({           │
    │   attributes: [                    │
    │     'vehicle_id',                  │
    │     'driver_id'                    │
    │   ],                               │
    │   include: [{                      │
    │     model: Battery,                │
    │     as: 'batteries',               │
    │     required: false  ← LEFT JOIN   │
    │   }]                               │
    │ })                                 │
    └──────┬─────────────────────────────┘
           │
           ▼
    ┌────────────────────────────────────┐
    │   STEP 2: Filter in JavaScript     │
    ├────────────────────────────────────┤
    │ const vehiclesWithoutBattery =     │
    │   vehicles.filter(vehicle =>       │
    │     !vehicle.batteries ||          │
    │     vehicle.batteries.length === 0 │
    │   )                                │
    └──────┬─────────────────────────────┘
           │
           ▼
    ┌────────────────────────────────────┐
    │   STEP 3: Map to Required Format   │
    ├────────────────────────────────────┤
    │ .map(vehicle => ({                 │
    │   vehicle_id: vehicle.vehicle_id,  │
    │   account_id: vehicle.driver_id    │
    │ }))                                │
    │                                    │
    │ Return: Array<{                    │
    │   vehicle_id,                      │
    │   account_id                       │
    │ }>                                 │
    └────────────────────────────────────┘
```

### 💡 **WHY LEFT JOIN + FILTER?**

```
┌────────────────────────────────────────────────────┐
│  APPROACH: LEFT JOIN + JavaScript Filter          │
├────────────────────────────────────────────────────┤
│  [1] Query with required: false (LEFT JOIN)        │
│      → Gets ALL vehicles                           │
│      → Includes batteries if exist                 │
│                                                    │
│  [2] Filter in JS:                                 │
│      → vehicle.batteries.length === 0             │
│      → Finds vehicles without batteries           │
│                                                    │
│  Alternative (pure SQL):                           │
│    SELECT * FROM Vehicles v                        │
│    LEFT JOIN Batteries b ON v.vehicle_id = ...     │
│    WHERE b.battery_id IS NULL                      │
│                                                    │
│  Why chosen approach?                              │
│    ✓ More readable                                 │
│    ✓ Easier to maintain                            │
│    ✓ Sequelize ORM friendly                        │
└────────────────────────────────────────────────────┘
```

---

## 7. UPDATE VEHICLE

### 📍 **API Endpoint**
```http
PUT /api/vehicles/{vehicle_id}
Authorization: Bearer <driver_token>
Content-Type: application/json

{
  "license_plate": "30B-67890",
  "model_id": 2
}
```

### 🔄 **DATA FLOW DIAGRAM**

```
┌─────────────────────────────────────────────────────────────────────┐
│                           CLIENT REQUEST                             │
│  PUT /api/vehicles/770e8400-e29b-41d4-a716-446655440002             │
│  Body: { license_plate: "30B-67890", model_id: 2 }                 │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      ROUTE LAYER (vehicles.route.js)                 │
├─────────────────────────────────────────────────────────────────────┤
│  [1] verifyToken                                                     │
│  [2] validate(vehicleValidation.update)                            │
│      ├─ license_plate: optional, Vietnam format                    │
│      ├─ model_id: optional, positive integer                       │
│      └─ At least one field required                                │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  CONTROLLER (vehicle.controller.js)                  │
│                  Function: updateVehicle()                           │
├─────────────────────────────────────────────────────────────────────┤
│  📥 INPUT:                                                           │
│     - req.params.id → vehicle_id                                    │
│     - req.user.account_id → driver_id                               │
│     - req.body.license_plate (optional)                             │
│     - req.body.model_id (optional)                                  │
│                                                                      │
│  🔧 PROCESSING:                                                      │
│     const vehicle = await vehicleService.updateVehicle(             │
│       vehicle_id,                                                   │
│       driver_id,                                                    │
│       { license_plate, model_id }                                   │
│     );                                                              │
│                                                                      │
│  📤 OUTPUT:                                                          │
│     res.status(200).json({                                          │
│       message: 'Vehicle updated successfully',                     │
│       vehicle                                                       │
│     });                                                             │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   SERVICE (vehicle.service.js)                       │
│                   Function: updateVehicle()                          │
└─────────────────────────────────────────────────────────────────────┘
                             │
         ┌───────────────────┴───────────────────┐
         ▼                                       ▼
┌──────────────────────┐              ┌──────────────────────┐
│   STEP 1             │              │   STEP 2             │
│   Validate Input     │              │   Find Vehicle       │
├──────────────────────┤              ├──────────────────────┤
│ Check at least one:  │              │ Vehicle.findByPk(    │
│ - license_plate      │              │   vehicle_id         │
│ - model_id           │              │ )                    │
│                      │              │                      │
│ IF both empty:       │              │ IF not found:        │
│   Throw 400         │              │   Throw 404          │
└──────┬───────────────┘              └──────┬───────────────┘
       │                                     │
       └──────────────┬──────────────────────┘
                      ▼
    ┌────────────────────────────────┐
    │   STEP 3: Check Ownership      │
    ├────────────────────────────────┤
    │ IF vehicle.driver_id !=        │
    │    driver_id:                  │
    │   Throw 403 Error              │
    │   "You can only update your    │
    │    own vehicles"               │
    └──────┬─────────────────────────┘
           │
           ▼
    ┌─────────────────────────────────────┐
    │   STEP 4: Update License Plate      │
    │   (if provided and different)       │
    ├─────────────────────────────────────┤
    │ IF license_plate &&                 │
    │    license_plate != current:        │
    │                                     │
    │   [4.1] Check duplicate             │
    │   Query: Vehicle.findOne({          │
    │     where: { license_plate }        │
    │   })                                │
    │                                     │
    │   IF found: Throw 409               │
    │                                     │
    │   [4.2] Update                      │
    │   vehicle.license_plate =           │
    │     license_plate                   │
    └──────┬──────────────────────────────┘
           │
           ▼
    ┌─────────────────────────────────────┐
    │   STEP 5: Update Model              │
    │   (if provided and different)       │
    ├─────────────────────────────────────┤
    │ IF model_id &&                      │
    │    model_id != current:             │
    │                                     │
    │   [5.1] Check model exists          │
    │   Query: VehicleModel.findByPk(     │
    │     model_id                        │
    │   )                                 │
    │                                     │
    │   IF not found: Throw 404           │
    │                                     │
    │   [5.2] Update                      │
    │   vehicle.model_id = model_id       │
    └──────┬──────────────────────────────┘
           │
           ▼
    ┌────────────────────────┐
    │   STEP 6: Save         │
    ├────────────────────────┤
    │ await vehicle.save()   │
    └──────┬─────────────────┘
           │
           ▼
    ┌────────────────────────────────┐
    │   STEP 7: Return Full Details  │
    │   ↓ findVehicleWithModel()     │
    └────────────────────────────────┘
```

### 🔄 **UPDATE LOGIC**

```
┌────────────────────────────────────────────────────┐
│  CONDITIONAL UPDATES                               │
├────────────────────────────────────────────────────┤
│  [1] License Plate Update:                         │
│      IF provided AND different from current:       │
│        → Check duplicate                           │
│        → Update if unique                          │
│                                                    │
│  [2] Model Update:                                 │
│      IF provided AND different from current:       │
│        → Validate model exists                     │
│        → Update if valid                           │
│                                                    │
│  [3] No Change Case:                               │
│      IF license_plate = current AND                │
│         model_id = current:                        │
│        → Just return (no save needed)              │
└────────────────────────────────────────────────────┘
```

### ⚠️ **ERROR CASES**

```
❌ 400 Bad Request
   └─ No fields provided (both license_plate and model_id empty)
   └─ License plate format invalid

❌ 403 Forbidden
   └─ Vehicle does not belong to driver

❌ 404 Not Found
   └─ Vehicle not found
   └─ Model ID not found

❌ 409 Conflict
   └─ License plate already exists (used by another vehicle)
```

---

## 8. DELETE VEHICLE

### 📍 **API Endpoint**
```http
DELETE /api/vehicles/{vehicle_id}
Authorization: Bearer <driver_token>
```

### 💡 **CONCEPT: Soft Delete with Release**

```
┌──────────────────────────────────────────────────────┐
│  SOFT DELETE PATTERN                                 │
├──────────────────────────────────────────────────────┤
│  NOT Hard Delete:                                    │
│    ✗ await vehicle.destroy()                         │
│    ✗ DELETE FROM Vehicles WHERE...                   │
│                                                      │
│  YES Soft Delete + Release:                          │
│    ✓ status = 'inactive'                            │
│    ✓ driver_id = null                               │
│    ✓ license_plate = null                           │
│                                                      │
│  WHY?                                                │
│    • History preserved (bookings, subscriptions)    │
│    • Vehicle can be re-registered by other driver   │
│    • Database relationships intact                  │
└──────────────────────────────────────────────────────┘
```

### 🔄 **DATA FLOW DIAGRAM**

```
┌─────────────────────────────────────────────────────────────────────┐
│                           CLIENT REQUEST                             │
│  DELETE /api/vehicles/770e8400-e29b-41d4-a716-446655440002          │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      ROUTE LAYER (vehicles.route.js)                 │
├─────────────────────────────────────────────────────────────────────┤
│  [1] verifyToken                                                     │
│  [2] validate(vehicleValidation.findById)                          │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  CONTROLLER (vehicle.controller.js)                  │
│                  Function: deleteVehicle()                           │
├─────────────────────────────────────────────────────────────────────┤
│  📥 INPUT:                                                           │
│     - req.params.id → vehicle_id                                    │
│     - req.user.account_id → driver_id                               │
│                                                                      │
│  🔧 PROCESSING:                                                      │
│     const deletedVehicle = await vehicleService.deleteVehicle(      │
│       vehicle_id,                                                   │
│       driver_id                                                     │
│     );                                                              │
│                                                                      │
│  📤 OUTPUT:                                                          │
│     res.status(200).json({                                          │
│       message: 'Vehicle deleted successfully',                     │
│       deleted_vehicle: deletedVehicle                              │
│     });                                                             │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   SERVICE (vehicle.service.js)                       │
│                   Function: deleteVehicle()                          │
└─────────────────────────────────────────────────────────────────────┘
                             │
         ┌───────────────────┴───────────────────┐
         ▼                                       ▼
┌──────────────────────┐              ┌──────────────────────┐
│   STEP 1             │              │   STEP 2             │
│   Find Vehicle       │              │   Check Ownership    │
├──────────────────────┤              ├──────────────────────┤
│ Vehicle.findByPk()   │              │ IF vehicle.driver_id │
│                      │              │    != driver_id:     │
│ IF not found:        │              │   Throw 403          │
│   Throw 404         │              │                      │
└──────┬───────────────┘              └──────┬───────────────┘
       │                                     │
       └──────────────┬──────────────────────┘
                      ▼
    ┌────────────────────────────────┐
    │   STEP 3: Check Already Deleted│
    ├────────────────────────────────┤
    │ IF vehicle.status === 'inactive'│
    │   Throw 400 Error              │
    │   "Already deactivated"        │
    └──────┬─────────────────────────┘
           │
           ▼
    ┌──────────────────────────────────────────┐
    │   STEP 4: Check Dependencies (Parallel)  │
    ├──────────────────────────────────────────┤
    │ const [activeSubscription, pendingBooking]│
    │   = await Promise.all([                  │
    │                                          │
    │   [4.1] Check Active Subscription        │
    │   Subscription.findOne({                 │
    │     where: {                             │
    │       vehicle_id,                        │
    │       status: 'active',                  │
    │       end_date: { [Op.gte]: today }     │
    │     }                                    │
    │   }),                                    │
    │                                          │
    │   [4.2] Check Pending Booking            │
    │   Booking.findOne({                      │
    │     where: {                             │
    │       vehicle_id,                        │
    │       status: 'pending'                  │
    │     }                                    │
    │   })                                     │
    │ ]);                                      │
    └──────┬───────────────────────────────────┘
           │
           ▼
    ┌────────────────────────────────┐
    │   STEP 5: Validate No Conflicts│
    ├────────────────────────────────┤
    │ IF activeSubscription:         │
    │   Throw 409 Error              │
    │   "Active subscription exists" │
    │                                │
    │ IF pendingBooking:             │
    │   Throw 409 Error              │
    │   "Pending bookings exist"     │
    └──────┬─────────────────────────┘
           │
           ▼
    ┌─────────────────────────────────────┐
    │   STEP 6: Soft Delete + Release     │
    ├─────────────────────────────────────┤
    │ vehicle.status = 'inactive'         │
    │ vehicle.driver_id = null            │
    │ vehicle.license_plate = null        │
    │                                     │
    │ await vehicle.save()                │
    └──────┬──────────────────────────────┘
           │
           ▼
    ┌────────────────────────┐
    │   STEP 7: Return Info  │
    ├────────────────────────┤
    │ return {               │
    │   vehicle_id,          │
    │   vin,                 │
    │   license_plate: null, │
    │   status: 'inactive',  │
    │   message: "Released"  │
    │ }                      │
    └────────────────────────┘
```

### 🔒 **DEPENDENCY CHECKS**

```
┌────────────────────────────────────────────────────┐
│  PARALLEL QUERIES (Promise.all)                    │
├────────────────────────────────────────────────────┤
│  Check 1: Active Subscription                      │
│    Query: Subscription.findOne                     │
│    WHERE:                                          │
│      - vehicle_id                                  │
│      - status = 'active'                          │
│      - end_date >= today                          │
│                                                    │
│    IF found: ✗ Cannot delete                       │
│                                                    │
│  Check 2: Pending Booking                          │
│    Query: Booking.findOne                          │
│    WHERE:                                          │
│      - vehicle_id                                  │
│      - status = 'pending'                         │
│                                                    │
│    IF found: ✗ Cannot delete                       │
│                                                    │
│  Why parallel?                                     │
│    • Both queries independent                      │
│    • Execute simultaneously                        │
│    • Faster than sequential (200ms vs 400ms)       │
└────────────────────────────────────────────────────┘
```

### 🔄 **SOFT DELETE CHANGES**

```
BEFORE DELETE:
┌────────────────────────────────┐
│ Vehicle                        │
├────────────────────────────────┤
│ vehicle_id: 770e8400...        │
│ driver_id: 660e8400...         │
│ license_plate: "30A-12345"     │
│ vin: "RL9LUD24HN00001"         │
│ status: "active"               │
└────────────────────────────────┘

AFTER DELETE:
┌────────────────────────────────┐
│ Vehicle                        │
├────────────────────────────────┤
│ vehicle_id: 770e8400...        │
│ driver_id: null        ← Released│
│ license_plate: null    ← Cleared│
│ vin: "RL9LUD24HN00001" ← Kept  │
│ status: "inactive"     ← Changed│
└────────────────────────────────┘

Result:
  ✓ Vehicle can be re-registered by another driver
  ✓ History preserved (foreign keys still work)
  ✓ VIN kept for tracking
```

### ⚠️ **ERROR CASES**

```
❌ 400 Bad Request
   └─ Vehicle already deactivated (status = 'inactive')

❌ 403 Forbidden
   └─ Vehicle does not belong to driver

❌ 404 Not Found
   └─ Vehicle ID not found

❌ 409 Conflict
   └─ Active subscription exists
   └─ Pending bookings exist
   └─ Must cancel/complete dependencies first
```

### ✅ **SUCCESS RESPONSE**

```json
{
  "message": "Vehicle deleted successfully",
  "deleted_vehicle": {
    "vehicle_id": "770e8400-e29b-41d4-a716-446655440002",
    "vin": "RL9LUD24HN00001",
    "license_plate": null,
    "status": "inactive",
    "message": "Vehicle released back to system and available for re-registration"
  }
}
```

---

## 9. HELPER FUNCTIONS

### 9.1 `findVehicleWithModel()`

```
┌─────────────────────────────────────────────┐
│  Purpose: Get vehicle with full relations   │
├─────────────────────────────────────────────┤
│  Input:  vehicle_id (string)                │
│  Output: Vehicle object with full details   │
└─────────────────────────────────────────────┘

Query: Vehicle.findByPk(vehicle_id, {
  where: { status: 'active' },
  include: [
    {
      model: VehicleModel,
      as: 'model',
      attributes: [
        'model_id', 'name', 'brand',
        'avg_energy_usage', 'battery_slot',
        'battery_type_id'
      ],
      include: [{
        model: BatteryType,
        as: 'batteryType',
        attributes: [
          'battery_type_id',
          'battery_type_code',
          'nominal_capacity'
        ]
      }]
    }
  ]
})

IF not found:
  Throw 404

Return: Vehicle with nested model and batteryType
```

### 9.2 `checkVehicleOwnership()`

```
┌─────────────────────────────────────────────┐
│  Purpose: Verify driver owns vehicle        │
├─────────────────────────────────────────────┤
│  Input:                                     │
│    - vehicle_id (string)                    │
│    - driver_id (string)                     │
│  Output: boolean                            │
└─────────────────────────────────────────────┘

const vehicle = await Vehicle.findByPk(vehicle_id);

IF !vehicle:
  Return false

Return vehicle.driver_id === driver_id
```

---

## 📊 SEQUELIZE PATTERNS USED

### Pattern 1: Conditional WHERE Clause
```javascript
const where = { driver_id };

if (status === 'active') {
  where.status = 'active';
} else if (status === 'inactive') {
  where.status = 'inactive';
}
// If 'all', no status filter added

const vehicles = await Vehicle.findAll({ where });
```

### Pattern 2: Nested Includes (Deep Relations)
```javascript
include: [
  {
    model: VehicleModel,
    as: 'model',
    include: [{
      model: BatteryType,
      as: 'batteryType'
    }]
  }
]

// Access: vehicle.model.batteryType.battery_type_code
```

### Pattern 3: LEFT JOIN with Filter
```javascript
include: [{
  model: Battery,
  as: 'batteries',
  required: false  // ← LEFT JOIN (not INNER JOIN)
}]

// Then filter in JavaScript:
.filter(v => v.batteries.length === 0)
```

### Pattern 4: Parallel Queries
```javascript
const [sub, booking] = await Promise.all([
  Subscription.findOne(...),
  Booking.findOne(...)
]);
```

### Pattern 5: Sequelize Operators
```javascript
const { Op } = require('sequelize');

// Greater than or equal
end_date: { [Op.gte]: today }

// Not equal
booking_id: { [Op.ne]: excludeId }

// IN clause
slot_id: { [Op.in]: slotIds }

// IS NOT NULL
slot_id: { [Op.not]: null }
```

---

## 🔐 SECURITY & VALIDATION

### Input Validation
```javascript
// express-validator in validation file
body('license_plate')
  .matches(/^[0-9]{2}[A-Z]{1,2}-[0-9]{4,5}$/i)

param('id')
  .isUUID()
```

### Ownership Checks
```javascript
// Always verify before update/delete
if (vehicle.driver_id !== driver_id) {
  throw 403 Error
}
```

### Role Authorization
```javascript
// Route middleware
authorizeRole('driver')

// Service check
if (account.role !== 'driver') {
  throw 403 Error
}
```

---

## 📈 PERFORMANCE CONSIDERATIONS

### Eager Loading vs N+1
```javascript
// ❌ N+1 Problem
const vehicles = await Vehicle.findAll();
for (const v of vehicles) {
  const model = await VehicleModel.findByPk(v.model_id);
}

// ✅ Eager Loading
const vehicles = await Vehicle.findAll({
  include: [{ model: VehicleModel, as: 'model' }]
});
```

### Parallel Queries
```javascript
// ✅ Save time with Promise.all
const [check1, check2] = await Promise.all([
  query1(),
  query2()
]);
```

### Selective Attributes
```javascript
// Only fetch needed fields
attributes: ['vehicle_id', 'driver_id']
// Instead of SELECT *
```

---

## 🔄 MODEL ASSOCIATIONS

### Vehicle Model Relationships
```javascript
Vehicle.associate = function(models) {
  // One-to-Many
  this.hasMany(models.SwapRecord, {
    as: 'swapRecords',
    foreignKey: 'vehicle_id'
  });
  
  this.hasMany(models.Battery, {
    as: 'batteries',
    foreignKey: 'vehicle_id'
  });
  
  this.hasMany(models.Booking, {
    as: 'booking',
    foreignKey: 'vehicle_id'
  });
  
  this.hasMany(models.Subscription, {
    as: 'subscriptions',
    foreignKey: 'vehicle_id'
  });
  
  // Many-to-One
  this.belongsTo(models.Account, {
    as: 'driver',
    foreignKey: 'driver_id'
  });
  
  this.belongsTo(models.VehicleModel, {
    as: 'model',
    foreignKey: 'model_id'
  });
}
```

---

## 📝 BUSINESS RULES SUMMARY

### Registration Rules
- ✅ Vehicle must be pre-seeded (admin responsibility)
- ✅ Driver must have citizen_id and driving_license
- ✅ VIN must be unique and available (driver_id = null)
- ✅ License plate must be unique
- ✅ Only drivers can register vehicles

### Update Rules
- ✅ Only owner can update
- ✅ At least one field must be provided
- ✅ License plate must remain unique
- ✅ Model must exist in database

### Delete Rules
- ✅ Only owner can delete
- ✅ Cannot delete if has active subscription
- ✅ Cannot delete if has pending booking
- ✅ Soft delete (status = inactive, release to system)

---

**End of Documentation**
