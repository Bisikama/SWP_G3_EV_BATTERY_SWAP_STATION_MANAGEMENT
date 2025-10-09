# EVSwap - EV Battery Swap Station Management System

## Tổng quan

EVSwap là hệ thống quản lý trạm đổi pin xe máy điện được thiết kế đặc biệt cho tài xế xe điện tại Việt Nam. Hệ thống cung cấp giải pháp toàn diện cho việc quản lý, tìm kiếm và sử dụng dịch vụ đổi pin một cách tiện lợi và hiệu quả.

## Tính năng chính

### Cho Tài xế (EV Driver)
- **Đăng ký & Quản lý tài khoản**: Đăng ký tài khoản với thông tin cá nhân, liên kết phương tiện qua VIN
- **Tìm kiếm trạm đổi pin**: Tìm trạm gần nhất với Google Maps API, xem tình trạng pin real-time
- **Đặt lịch trước**: Đặt lịch đổi pin để đảm bảo có pin đầy khi cần
- **Thanh toán linh hoạt**: Thanh toán theo gói thuê pin với nhiều phương thức
- **Theo dõi pin**: Theo dõi tình trạng pin, số lần đổi và chi phí sử dụng
- **Hỗ trợ 24/7**: Đội ngũ hỗ trợ chuyên nghiệp, sẵn sàng giải đáp mọi thắc mắc

## Công nghệ sử dụng

### Frontend
- **React 19** - Thư viện UI hiện đại
- **Tailwind CSS 3** - Framework CSS utility-first
- **shadcn/ui** - Component library chất lượng cao
- **React Router 7** - Routing cho SPA
- **React Hook Form** - Quản lý form hiệu quả
- **Zod** - Validation schema
- **Axios** - HTTP client
- **Lucide React** - Icon library

### Kiến trúc
- **Components**: Tái sử dụng UI components
- **Pages**: Các trang chính của ứng dụng
- **Hooks**: Custom hooks cho logic tái sử dụng
- **Lib**: Utilities, API services, validation schemas

## Cài đặt và chạy

### Yêu cầu hệ thống
- Node.js >= 18.0.0
- npm hoặc yarn

### Cài đặt
```bash
cd client
npm install
```

### Chạy development server
```bash
npm run dev
```

### Build production
```bash
npm run build
```

## Cấu trúc thư mục

```
src/
├── components/          # UI Components
│   ├── ui/             # shadcn/ui components
│   ├── Layout/         # Layout components
│   ├── Auth/           # Authentication components
│   └── Home/           # Homepage components
├── pages/              # Page components
├── hooks/              # Custom hooks
│   ├── useAuth.js      # Authentication hook
│   ├── useForm.js      # Form management hook
│   ├── useApi.js       # API hook
│   └── useLocalStorage.js # Local storage hook
├── lib/                # Utilities and services
│   ├── api.js          # Axios configuration
│   ├── apiServices.js  # API service functions
│   ├── auth.js         # Auth utilities
│   ├── utils.js        # General utilities
│   └── validations.js  # Zod validation schemas
└── App.jsx             # Main App component
```

## Tính năng đã triển khai

### ✅ Hoàn thành
- [x] Thiết kế homepage với hero section
- [x] Hệ thống đăng ký/đăng nhập
- [x] Validation form với Zod
- [x] Responsive design với Tailwind CSS
- [x] Navigation và routing
- [x] Dashboard cho tài xế
- [x] Trang tìm kiếm trạm đổi pin
- [x] Trang gói dịch vụ
- [x] Trang hỗ trợ khách hàng
- [x] Authentication với JWT
- [x] Protected routes

### 🚧 Đang phát triển
- [ ] Tích hợp Google Maps API
- [ ] Chức năng đặt lịch đổi pin
- [ ] Quản lý phương tiện (VIN)
- [ ] Thanh toán online
- [ ] Thông báo push
- [ ] Đánh giá trạm

### 📋 Kế hoạch
- [ ] Mobile app (React Native)
- [ ] Dashboard cho Admin
- [ ] Dashboard cho Staff
- [ ] Dashboard cho Warehouse Manager
- [ ] AI dự báo nhu cầu
- [ ] Báo cáo và thống kê

## API Endpoints

### Authentication
- `POST /api/auth/register` - Đăng ký tài khoản
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/logout` - Đăng xuất
- `GET /api/auth/profile` - Lấy thông tin profile
- `POST /api/auth/refresh` - Refresh token

### Vehicles
- `GET /api/EV` - Lấy danh sách xe
- `POST /api/EV` - Thêm xe mới
- `PUT /api/EV/:id` - Cập nhật thông tin xe
- `DELETE /api/EV/:id` - Xóa xe

### Customers
- `GET /api/customers` - Lấy danh sách khách hàng
- `POST /api/customers` - Tạo khách hàng mới
- `PUT /api/customers/:id` - Cập nhật thông tin khách hàng
- `DELETE /api/customers/:id` - Xóa khách hàng

## Biến môi trường

Tạo file `.env` trong thư mục `client`:

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

## Đóng góp

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Tạo Pull Request

## License

Dự án này được phát triển cho mục đích học tập và nghiên cứu.

## Liên hệ

- Email: support@evswap.vn
- Hotline: 1900 1234
- Website: https://evswap.vn
