import React from 'react';
import { Link } from 'react-router';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import {
    UserPlus,
    MapPin,
    Calendar,
    Battery,
    CreditCard,
    ArrowRight,
    CheckCircle,
    Star
} from 'lucide-react';

const HowItWorksSection = () => {
    const steps = [
        {
            step: "01",
            icon: <UserPlus className="h-8 w-8" />,
            title: "Đăng ký tài khoản",
            description: "Tạo tài khoản và liên kết phương tiện của bạn với VIN",
            details: [
                "Đăng ký thông tin cá nhân",
                "Liên kết VIN xe với tài khoản",
                "Chọn gói dịch vụ phù hợp",
                "Xác thực tài khoản"
            ],
            color: "from-blue-500 to-blue-600"
        },
        {
            step: "02",
            icon: <MapPin className="h-8 w-8" />,
            title: "Tìm trạm đổi pin",
            description: "Tìm kiếm trạm đổi pin gần nhất với tình trạng pin sẵn có",
            details: [
                "Sử dụng Google Maps API",
                "Xem tình trạng pin real-time",
                "Đọc đánh giá từ người dùng",
                "Tính toán thời gian di chuyển"
            ],
            color: "from-green-500 to-green-600"
        },
        {
            step: "03",
            icon: <Calendar className="h-8 w-8" />,
            title: "Đặt lịch đổi pin",
            description: "Đặt lịch trước để đảm bảo có pin đầy khi đến",
            details: [
                "Chọn thời gian phù hợp",
                "Xác nhận loại pin cần đổi",
                "Nhận thông báo nhắc nhở",
                "Có thể hủy/đổi lịch"
            ],
            color: "from-purple-500 to-purple-600"
        },
        {
            step: "04",
            icon: <Battery className="h-8 w-8" />,
            title: "Đổi pin tại trạm",
            description: "Đến trạm và thực hiện đổi pin nhanh chóng",
            details: [
                "Quét QR code để xác thực",
                "Tự động đổi pin trong 3-5 phút",
                "Kiểm tra tình trạng pin mới",
                "Nhận biên lai điện tử"
            ],
            color: "from-orange-500 to-orange-600"
        },
        {
            step: "05",
            icon: <CreditCard className="h-8 w-8" />,
            title: "Thanh toán tự động",
            description: "Hệ thống tự động tính toán và thanh toán theo gói",
            details: [
                "Tính phí theo delta SoH",
                "Trừ vào free allowance",
                "Thanh toán tự động cuối tháng",
                "Nhận hóa đơn chi tiết"
            ],
            color: "from-red-500 to-red-600"
        }
    ];

    const benefits = [
        {
            icon: <CheckCircle className="h-6 w-6" />,
            title: "Tiết kiệm thời gian",
            description: "Chỉ mất 3-5 phút để đổi pin thay vì 2-4 giờ sạc"
        },
        {
            icon: <Star className="h-6 w-6" />,
            title: "Tiết kiệm chi phí",
            description: "Chi phí hợp lý với các gói dịch vụ linh hoạt"
        },
        {
            icon: <MapPin className="h-6 w-6" />,
            title: "Tiện lợi mọi lúc",
            description: "Mạng lưới rộng khắp, hoạt động 24/7"
        },
        {
            icon: <Battery className="h-6 w-6" />,
            title: "An toàn tuyệt đối",
            description: "Pin được kiểm tra chất lượng và bảo dưỡng thường xuyên"
        }
    ];

    return (
        <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
            <div className="container mx-auto px-4">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                        Cách thức hoạt động
                        <span className="text-primary block">đơn giản & hiệu quả</span>
                    </h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        Chỉ với 5 bước đơn giản, bạn có thể bắt đầu sử dụng dịch vụ đổi pin
                        và trải nghiệm tương lai di chuyển xanh.
                    </p>
                </div>

                {/* Steps */}
                <div className="space-y-12 mb-16">
                    {steps.map((step, index) => (
                        <div key={index} className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                            {/* Content */}
                            <div className={`order-2 ${index % 2 === 1 ? 'lg:order-1' : 'lg:order-2'}`}>
                                <Card className="h-full border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                                    <CardContent className="p-8">
                                        <div className="space-y-6">
                                            {/* Step Number & Icon */}
                                            <div className="flex items-center space-x-4">
                                                <div className={`w-16 h-16 bg-gradient-to-r ${step.color} rounded-2xl flex items-center justify-center text-white font-bold text-xl`}>
                                                    {step.step}
                                                </div>
                                                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                                                    <div className="text-primary">
                                                        {step.icon}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Title & Description */}
                                            <div className="space-y-4">
                                                <h3 className="text-2xl font-bold text-gray-900">
                                                    {step.title}
                                                </h3>
                                                <p className="text-gray-600 text-lg leading-relaxed">
                                                    {step.description}
                                                </p>
                                            </div>

                                            {/* Details */}
                                            <ul className="space-y-3">
                                                {step.details.map((detail, detailIndex) => (
                                                    <li key={detailIndex} className="flex items-center space-x-3">
                                                        <div className="w-2 h-2 bg-primary rounded-full" />
                                                        <span className="text-gray-600">{detail}</span>
                                                    </li>
                                                ))}
                                            </ul>

                                            {/* CTA for first step */}
                                            {index === 0 && (
                                                <div className="pt-4">
                                                    <Button size="lg" asChild>
                                                        <Link to="/register">
                                                            Bắt đầu ngay
                                                            <ArrowRight className="ml-2 h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Visual */}
                            <div className={`order-1 ${index % 2 === 1 ? 'lg:order-2' : 'lg:order-1'}`}>
                                <div className="relative">
                                    <div className={`w-full h-80 bg-gradient-to-br ${step.color} rounded-3xl flex items-center justify-center`}>
                                        <div className="text-white text-8xl opacity-20">
                                            {step.icon}
                                        </div>
                                    </div>

                                    {/* Floating Elements */}
                                    <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/20 rounded-full blur-xl" />
                                    <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-white/10 rounded-full blur-xl" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Benefits Section */}
                <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-xl">
                    <div className="text-center mb-12">
                        <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
                            Lợi ích khi sử dụng EVSwap
                        </h3>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                            Không chỉ đơn giản là đổi pin, EVSwap mang đến cho bạn
                            một trải nghiệm di chuyển hoàn toàn mới.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {benefits.map((benefit, index) => (
                            <Card key={index} className="text-center hover:shadow-lg transition-shadow border-0">
                                <CardContent className="p-6">
                                    <div className="space-y-4">
                                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                                            <div className="text-primary">
                                                {benefit.icon}
                                            </div>
                                        </div>
                                        <h4 className="font-semibold text-gray-900">
                                            {benefit.title}
                                        </h4>
                                        <p className="text-sm text-gray-600">
                                            {benefit.description}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HowItWorksSection;
