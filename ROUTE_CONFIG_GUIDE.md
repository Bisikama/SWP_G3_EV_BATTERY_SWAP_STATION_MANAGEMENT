# Route Config - System Configuration Management

## 📋 Tổng quan

Route Config là một singleton class để quản lý cấu hình hệ thống, load từ database **chỉ một lần duy nhất** và cache trong memory. Hỗ trợ update khi cần thiết.

## 🎯 Tính năng

- ✅ **Load một lần**: Chỉ query database lần đầu tiên
- ✅ **Cache trong memory**: Truy cập nhanh không cần query database
- ✅ **Singleton pattern**: Đảm bảo chỉ có 1 instance duy nhất
- ✅ **Thread-safe**: Xử lý concurrent loading
- ✅ **Update on demand**: Có thể reload từ database khi cần
- ✅ **RESTful API**: Endpoints để quản lý config

## 📁 Cấu trúc file

```
src/
├── config/
│   ├── route.config.js          # Main singleton class
│   └── route.config.example.js  # Usage examples
├── controllers/
│   └── config.controller.js     # Controller xử lý API requests
└── routes/
    └── config.route.js          # API endpoints
```

## 🚀 Cách sử dụng

### 1. Load config khi server khởi động (đã tích hợp trong server.js)

```javascript
const routeConfig = require('./src/config/route.config');

async function startServer() {
  // Load config trước khi start server
  await routeConfig.loadConfig();
  
  // Start server...
}
```

### 2. Sử dụng trong Controllers

```javascript
const routeConfig = require('../config/route.config');

async function createBooking(req, res) {
  // Get booking expired interval (sync, không query database)
  const expiredInterval = routeConfig.getBookingExpiredInterval();
  
  // Calculate expiration time
  const expirationTime = new Date();
  expirationTime.setMinutes(expirationTime.getMinutes() + expiredInterval);
  
  // Use expiration time in booking
  const booking = {
    ...req.body,
    expired_at: expirationTime
  };
  
  // Save booking...
}
```

### 3. Sử dụng trong Services

```javascript
const routeConfig = require('../config/route.config');

class BookingService {
  async checkBookingExpiration(booking) {
    const config = routeConfig.getConfig();
    
    // Use config values
    const expiredMinutes = config.booking_expired_interval;
    
    // Check if booking expired...
  }
}
```

### 4. Sử dụng trong Middleware

```javascript
const routeConfig = require('../config/route.config');

function bookingMiddleware(req, res, next) {
  if (!routeConfig.isLoaded()) {
    return res.status(500).json({ error: 'Config not loaded' });
  }
  
  req.config = routeConfig.getConfig();
  next();
}
```

## 🔧 API Methods

### `loadConfig()`
Load config từ database (chỉ load 1 lần, sau đó dùng cache)

```javascript
const config = await routeConfig.loadConfig();
// { config_id: 1, booking_expired_interval: 30 }
```

### `updateConfig()`
Reload config từ database (dùng khi admin update config)

```javascript
const updatedConfig = await routeConfig.updateConfig();
```

### `getConfig()`
Lấy config hiện tại (không query database)

```javascript
const config = routeConfig.getConfig();
// null nếu chưa load, hoặc object config
```

### `getConfigValue(key)`
Lấy giá trị cụ thể theo key

```javascript
const interval = routeConfig.getConfigValue('booking_expired_interval');
```

### `getBookingExpiredInterval()`
Shorthand method để lấy booking expired interval

```javascript
const minutes = routeConfig.getBookingExpiredInterval();
// 30
```

### `isLoaded()`
Kiểm tra config đã load chưa

```javascript
if (routeConfig.isLoaded()) {
  // Config ready to use
}
```

## 🌐 REST API Endpoints

### Get current configuration
```http
GET /api/config
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "config_id": 1,
    "booking_expired_interval": 30
  },
  "message": "Configuration retrieved successfully"
}
```

### Get specific config value
```http
GET /api/config/booking_expired_interval
Authorization: Bearer <token>

Response:
{
  "success": true,
  "key": "booking_expired_interval",
  "value": 30,
  "message": "Configuration value retrieved successfully"
}
```

### Update configuration (Admin only)
```http
PUT /api/config
Authorization: Bearer <token>
Content-Type: application/json

{
  "booking_expired_interval": 45
}

Response:
{
  "success": true,
  "data": {
    "config_id": 1,
    "booking_expired_interval": 45
  },
  "message": "Configuration updated successfully"
}
```

### Reset to default values (Admin only)
```http
POST /api/config/reset
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "config_id": 1,
    "booking_expired_interval": 30
  },
  "message": "Configuration reset to default values successfully"
}
```

## 📊 Database Schema

```sql
CREATE TABLE "Configs" (
  "config_id" SERIAL PRIMARY KEY,
  "booking_expired_interval" SMALLINT NOT NULL DEFAULT 30
);
```

## 🔄 Flow diagram

```
Server Start
    ↓
Load Config from DB (1 time)
    ↓
Cache in Memory
    ↓
Server Running
    ↓
Controllers/Services use cached config (fast)
    ↓
Admin updates config via API
    ↓
updateConfig() → Reload from DB
    ↓
Cache updated in Memory
```

## ⚡ Performance

- **First load**: ~10-50ms (database query)
- **Subsequent access**: ~0.001ms (memory access)
- **Memory usage**: ~1KB per config record

## 🛡️ Error Handling

```javascript
try {
  const config = await routeConfig.loadConfig();
} catch (error) {
  console.error('Failed to load config:', error);
  // Fallback to default values
}
```

## 📝 Best Practices

1. ✅ **Load config trong server.js** trước khi start server
2. ✅ **Sử dụng getConfig()** trong runtime (không async)
3. ✅ **Gọi updateConfig()** sau khi admin update database
4. ✅ **Kiểm tra isLoaded()** trước khi dùng config
5. ❌ **Không gọi loadConfig()** nhiều lần không cần thiết

## 🔍 Troubleshooting

### Config không load được
```javascript
// Check database connection
// Check if Configs table exists
// Check if there's a record in the table
```

### Config không update
```javascript
// Make sure to call updateConfig() after database update
await db.Config.update({ booking_expired_interval: 45 }, { where: { config_id: 1 } });
await routeConfig.updateConfig(); // ← Don't forget this
```

## 📚 Examples

Xem file `src/config/route.config.example.js` để có thêm nhiều ví dụ chi tiết.

## 🆘 Support

Nếu có vấn đề, liên hệ team development hoặc tạo issue trong repository.

---

**Created by**: BE_BaoNguyen  
**Last updated**: November 10, 2025
