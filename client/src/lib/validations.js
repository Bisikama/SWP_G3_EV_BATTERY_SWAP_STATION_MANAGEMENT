import { z } from 'zod';

// Authentication schemas
export const loginSchema = z.object({
    username: z.string().min(1, 'Tên đăng nhập là bắt buộc'),
    password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
});

export const registerSchema = z.object({
    username: z.string()
        .min(3, 'Tên đăng nhập phải có ít nhất 3 ký tự')
        .max(20, 'Tên đăng nhập không được quá 20 ký tự')
        .regex(/^[a-zA-Z0-9_]+$/, 'Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới'),
    password: z.string()
        .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
        .max(100, 'Mật khẩu không được quá 100 ký tự'),
    confirmPassword: z.string(),
    fullname: z.string()
        .min(2, 'Họ tên phải có ít nhất 2 ký tự')
        .max(50, 'Họ tên không được quá 50 ký tự'),
    email: z.string()
        .email('Email không hợp lệ')
        .max(100, 'Email không được quá 100 ký tự'),
    phone: z.string()
        .regex(/^[0-9]{10,11}$/, 'Số điện thoại phải có 10-11 chữ số')
        .min(10, 'Số điện thoại phải có ít nhất 10 chữ số'),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
});

// Vehicle schemas
export const vehicleSchema = z.object({
    vin: z.string()
        .min(17, 'VIN phải có ít nhất 17 ký tự')
        .max(17, 'VIN phải có đúng 17 ký tự')
        .regex(/^[A-HJ-NPR-Z0-9]{17}$/, 'VIN không hợp lệ'),
    batteryType: z.enum(['type1', 'type2'], {
        errorMap: () => ({ message: 'Vui lòng chọn loại pin' }),
    }),
    vehicleModel: z.string()
        .min(1, 'Model xe là bắt buộc')
        .max(50, 'Model xe không được quá 50 ký tự'),
    vehicleBrand: z.string()
        .min(1, 'Hãng xe là bắt buộc')
        .max(30, 'Hãng xe không được quá 30 ký tự'),
});

// Service package schemas
export const servicePackageSchema = z.object({
    packageType: z.enum(['basic', 'premium', 'unlimited'], {
        errorMap: () => ({ message: 'Vui lòng chọn loại gói dịch vụ' }),
    }),
    batteryType: z.enum(['type1', 'type2'], {
        errorMap: () => ({ message: 'Vui lòng chọn loại pin' }),
    }),
    duration: z.enum(['monthly', 'quarterly', 'yearly'], {
        errorMap: () => ({ message: 'Vui lòng chọn thời hạn gói' }),
    }),
});

// Profile update schema
export const profileUpdateSchema = z.object({
    fullname: z.string()
        .min(2, 'Họ tên phải có ít nhất 2 ký tự')
        .max(50, 'Họ tên không được quá 50 ký tự'),
    email: z.string()
        .email('Email không hợp lệ')
        .max(100, 'Email không được quá 100 ký tự'),
    phone: z.string()
        .regex(/^[0-9]{10,11}$/, 'Số điện thoại phải có 10-11 chữ số')
        .min(10, 'Số điện thoại phải có ít nhất 10 chữ số'),
});

// Password change schema
export const passwordChangeSchema = z.object({
    currentPassword: z.string().min(1, 'Mật khẩu hiện tại là bắt buộc'),
    newPassword: z.string()
        .min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự')
        .max(100, 'Mật khẩu mới không được quá 100 ký tự'),
    confirmNewPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmNewPassword'],
});

// Station search schema
export const stationSearchSchema = z.object({
    location: z.string().min(1, 'Vị trí là bắt buộc'),
    batteryType: z.enum(['type1', 'type2', 'all']).optional(),
    radius: z.number().min(1).max(50).optional(),
});

// Booking schema
export const bookingSchema = z.object({
    stationId: z.string().min(1, 'Vui lòng chọn trạm'),
    batteryType: z.enum(['type1', 'type2'], {
        errorMap: () => ({ message: 'Vui lòng chọn loại pin' }),
    }),
    scheduledTime: z.string().min(1, 'Vui lòng chọn thời gian'),
    vehicleId: z.string().min(1, 'Vui lòng chọn xe'),
});

export default {
    loginSchema,
    registerSchema,
    vehicleSchema,
    servicePackageSchema,
    profileUpdateSchema,
    passwordChangeSchema,
    stationSearchSchema,
    bookingSchema,
};
