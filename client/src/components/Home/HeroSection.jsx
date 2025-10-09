import React from 'react';
import { Link } from 'react-router';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import {
    Battery,
    MapPin,
    Clock,
    Shield,
    Zap,
    Car,
    ArrowRight,
    Star,
    Users
} from 'lucide-react';

const HeroSection = () => {
    const features = [
        {
            icon: <Battery className="h-6 w-6" />,
            title: "Đổi pin nhanh chóng",
            description: "Chỉ mất 3-5 phút để đổi pin, tiết kiệm thời gian di chuyển"
        },
        {
            icon: <MapPin className="h-6 w-6" />,
            title: "Mạng lưới rộng khắp",
            description: "Hơn 100 trạm đổi pin trên toàn thành phố"
        },
        {
            icon: <Clock className="h-6 w-6" />,
            title: "Hoạt động 24/7",
            description: "Phục vụ mọi lúc, mọi nơi không ngừng nghỉ"
        },
        {
            icon: <Shield className="h-6 w-6" />,
            title: "An toàn tuyệt đối",
            description: "Pin được kiểm tra chất lượng và bảo dưỡng thường xuyên"
        }
    ];

    const stats = [
        { number: "10,000+", label: "Khách hàng tin tưởng" },
        { number: "50,000+", label: "Lượt đổi pin/tháng" },
        { number: "99.5%", label: "Tỷ lệ hài lòng" },
        { number: "24/7", label: "Hỗ trợ khách hàng" }
    ];

    return (
        <section className="relative bg-gradient-to-br from-blue-50 via-white to-green-50 overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />

            <div className="container mx-auto px-4 py-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    {/* Left Content */}
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <div className="flex items-center space-x-2">
                                <Battery className="h-8 w-8 text-primary" />
                                <span className="text-sm font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
                                    EVSwap - Tương lai xanh
                                </span>
                            </div>

                            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                                Đổi pin xe điện
                                <span className="text-primary block">nhanh chóng & tiện lợi</span>
                            </h1>

                            <p className="text-xl text-gray-600 leading-relaxed">
                                Hệ thống quản lý trạm đổi pin xe máy điện hàng đầu Việt Nam.
                                Giải pháp hoàn hảo cho nhu cầu di chuyển xanh và bền vững.
                            </p>
                        </div>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button size="lg" asChild className="text-lg px-8 py-6">
                                <Link to="/register">
                                    <Zap className="mr-2 h-5 w-5" />
                                    Bắt đầu ngay
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Link>
                            </Button>
                            <Button size="lg" variant="outline" asChild className="text-lg px-8 py-6">
                                <Link to="/stations">
                                    <MapPin className="mr-2 h-5 w-5" />
                                    Tìm trạm gần nhất
                                </Link>
                            </Button>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-8">
                            {stats.map((stat, index) => (
                                <div key={index} className="text-center">
                                    <div className="text-2xl lg:text-3xl font-bold text-primary">
                                        {stat.number}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        {stat.label}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Content - Hero Image/Cards */}
                    <div className="relative">
                        {/* Main Card */}
                        <Card className="relative z-10 shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
                            <CardContent className="p-8">
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                                                <Car className="h-6 w-6 text-primary" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold">Trạm ABC - Quận 1</h3>
                                                <p className="text-sm text-gray-600">Cách bạn 2.3 km</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-center space-x-1">
                                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                                <span className="font-semibold">4.8</span>
                                            </div>
                                            <p className="text-sm text-gray-600">(127 đánh giá)</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                                            <div className="flex items-center space-x-2">
                                                <Battery className="h-5 w-5 text-green-600" />
                                                <span className="font-medium">Pin Type 1</span>
                                            </div>
                                            <div className="text-green-600 font-semibold">
                                                15 pin sẵn sàng
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                                            <div className="flex items-center space-x-2">
                                                <Battery className="h-5 w-5 text-blue-600" />
                                                <span className="font-medium">Pin Type 2</span>
                                            </div>
                                            <div className="text-blue-600 font-semibold">
                                                8 pin sẵn sàng
                                            </div>
                                        </div>
                                    </div>

                                    <Button className="w-full" size="lg">
                                        <MapPin className="mr-2 h-4 w-4" />
                                        Đặt lịch đổi pin
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Floating Elements */}
                        <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/20 rounded-full blur-xl" />
                        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-green-500/20 rounded-full blur-xl" />
                    </div>
                </div>

                {/* Features Grid */}
                <div className="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {features.map((feature, index) => (
                        <Card key={index} className="text-center hover:shadow-lg transition-shadow border-0 bg-white/60 backdrop-blur-sm">
                            <CardContent className="p-6">
                                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    {feature.icon}
                                </div>
                                <h3 className="font-semibold mb-2">{feature.title}</h3>
                                <p className="text-sm text-gray-600">{feature.description}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default HeroSection;
