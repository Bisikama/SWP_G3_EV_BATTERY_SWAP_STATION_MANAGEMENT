import React from 'react';
import { Link } from 'react-router';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import {
    Smartphone,
    CreditCard,
    Calendar,
    MapPin,
    Battery,
    Shield,
    Clock,
    Users,
    TrendingUp,
    Award
} from 'lucide-react';

const FeaturesSection = () => {
    const driverFeatures = [
        {
            icon: <Smartphone className="h-8 w-8" />,
            title: "Quản lý tài khoản",
            description: "Đăng ký và quản lý thông tin cá nhân, liên kết phương tiện dễ dàng",
            features: ["Đăng ký tài khoản", "Liên kết VIN xe", "Cập nhật thông tin", "Bảo mật 2FA"]
        },
        {
            icon: <MapPin className="h-8 w-8" />,
            title: "Tìm kiếm trạm",
            description: "Tìm trạm đổi pin gần nhất với Google Maps API tích hợp",
            features: ["Tìm trạm gần nhất", "Xem tình trạng pin", "Đánh giá trạm", "Lịch sử sử dụng"]
        },
        {
            icon: <Calendar className="h-8 w-8" />,
            title: "Đặt lịch trước",
            description: "Đặt lịch đổi pin để đảm bảo có pin đầy khi cần",
            features: ["Đặt lịch linh hoạt", "Nhắc nhở thông minh", "Hủy/đổi lịch", "Lịch sử đặt lịch"]
        },
        {
            icon: <CreditCard className="h-8 w-8" />,
            title: "Thanh toán linh hoạt",
            description: "Thanh toán theo gói thuê pin với nhiều phương thức",
            features: ["Gói thuê đa dạng", "Thanh toán tự động", "Hóa đơn điện tử", "Theo dõi chi phí"]
        },
        {
            icon: <Battery className="h-8 w-8" />,
            title: "Theo dõi pin",
            description: "Theo dõi tình trạng pin, số lần đổi và chi phí sử dụng",
            features: ["Theo dõi SoH", "Lịch sử đổi pin", "Thống kê sử dụng", "Dự báo chi phí"]
        },
        {
            icon: <Shield className="h-8 w-8" />,
            title: "Hỗ trợ 24/7",
            description: "Đội ngũ hỗ trợ chuyên nghiệp, sẵn sàng giải đáp mọi thắc mắc",
            features: ["Chat trực tuyến", "Hotline 24/7", "Báo cáo sự cố", "Phản hồi nhanh"]
        }
    ];

    const stats = [
        { icon: <Users className="h-6 w-6" />, value: "10,000+", label: "Tài xế đăng ký" },
        { icon: <Battery className="h-6 w-6" />, value: "50,000+", label: "Lượt đổi pin/tháng" },
        { icon: <MapPin className="h-6 w-6" />, value: "100+", label: "Trạm đổi pin" },
        { icon: <TrendingUp className="h-6 w-6" />, value: "99.5%", label: "Tỷ lệ hài lòng" }
    ];

    return (
        <section className="py-20 bg-white">
            <div className="container mx-auto px-4">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <Badge variant="secondary" className="mb-4">
                        <Award className="mr-2 h-4 w-4" />
                        Tính năng nổi bật
                    </Badge>
                    <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                        Tất cả những gì bạn cần cho
                        <span className="text-primary block">việc quản lý xe điện</span>
                    </h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        Hệ thống quản lý trạm đổi pin được thiết kế đặc biệt cho tài xế xe điện,
                        mang đến trải nghiệm sử dụng tối ưu và tiện lợi nhất.
                    </p>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                    {driverFeatures.map((feature, index) => (
                        <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50">
                            <CardContent className="p-8">
                                <div className="space-y-6">
                                    {/* Icon */}
                                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                        <div className="text-primary">
                                            {feature.icon}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="space-y-4">
                                        <h3 className="text-xl font-semibold text-gray-900">
                                            {feature.title}
                                        </h3>
                                        <p className="text-gray-600 leading-relaxed">
                                            {feature.description}
                                        </p>

                                        {/* Feature List */}
                                        <ul className="space-y-2">
                                            {feature.features.map((item, itemIndex) => (
                                                <li key={itemIndex} className="flex items-center text-sm text-gray-600">
                                                    <div className="w-1.5 h-1.5 bg-primary rounded-full mr-3" />
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Stats Section */}
                <div className="bg-gradient-to-r from-primary/5 via-white to-green-500/5 rounded-3xl p-8 lg:p-12">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                        {stats.map((stat, index) => (
                            <div key={index} className="text-center">
                                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <div className="text-primary">
                                        {stat.icon}
                                    </div>
                                </div>
                                <div className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                                    {stat.value}
                                </div>
                                <div className="text-gray-600 font-medium">
                                    {stat.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CTA Section */}
                <div className="text-center mt-16">
                    <div className="space-y-6">
                        <h3 className="text-2xl font-bold text-gray-900">
                            Sẵn sàng trải nghiệm tương lai?
                        </h3>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                            Tham gia cộng đồng tài xế xe điện thông minh và trải nghiệm
                            dịch vụ đổi pin tiện lợi nhất Việt Nam.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button size="lg" asChild className="text-lg px-8">
                                <Link to="/register">
                                    <Smartphone className="mr-2 h-5 w-5" />
                                    Đăng ký ngay
                                </Link>
                            </Button>
                            <Button size="lg" variant="outline" asChild className="text-lg px-8">
                                <Link to="/demo">
                                    <Clock className="mr-2 h-5 w-5" />
                                    Xem demo
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default FeaturesSection;
