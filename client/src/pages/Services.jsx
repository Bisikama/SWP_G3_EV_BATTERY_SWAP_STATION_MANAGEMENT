import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Battery, Check, Star, Zap } from 'lucide-react';

const Services = () => {
    const servicePackages = [
        {
            name: 'Gói Cơ Bản',
            price: '150,000đ/tháng',
            batteryType: 'Type 1',
            maxSwaps: 10,
            features: [
                '10 lượt đổi pin/tháng',
                'Pin Type 1',
                'Hỗ trợ 24/7',
                'Bảo hiểm pin'
            ],
            popular: false
        },
        {
            name: 'Gói Cao Cấp',
            price: '250,000đ/tháng',
            batteryType: 'Type 1',
            maxSwaps: 20,
            features: [
                '20 lượt đổi pin/tháng',
                'Pin Type 1',
                'Ưu tiên đặt lịch',
                'Hỗ trợ 24/7',
                'Bảo hiểm pin',
                'Miễn phí hủy lịch'
            ],
            popular: true
        },
        {
            name: 'Gói Không Giới Hạn',
            price: '350,000đ/tháng',
            batteryType: 'Type 1 & 2',
            maxSwaps: 'Không giới hạn',
            features: [
                'Đổi pin không giới hạn',
                'Pin Type 1 & 2',
                'Ưu tiên cao nhất',
                'Hỗ trợ VIP 24/7',
                'Bảo hiểm toàn diện',
                'Miễn phí mọi dịch vụ'
            ],
            popular: false
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">
                        Gói dịch vụ đổi pin
                    </h1>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        Chọn gói dịch vụ phù hợp với nhu cầu sử dụng của bạn.
                        Tất cả gói đều bao gồm bảo hiểm và hỗ trợ 24/7.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {servicePackages.map((pkg, index) => (
                        <Card key={index} className={`relative ${pkg.popular ? 'border-primary shadow-xl scale-105' : ''}`}>
                            {pkg.popular && (
                                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                    <Badge className="bg-primary text-white px-4 py-1">
                                        <Star className="mr-1 h-3 w-3 fill-current" />
                                        Phổ biến nhất
                                    </Badge>
                                </div>
                            )}

                            <CardHeader className="text-center pb-4">
                                <CardTitle className="text-2xl font-bold">{pkg.name}</CardTitle>
                                <CardDescription className="text-lg">
                                    {pkg.batteryType}
                                </CardDescription>
                                <div className="text-3xl font-bold text-primary mt-4">
                                    {pkg.price}
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-6">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-gray-900 mb-2">
                                        {pkg.maxSwaps}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        {typeof pkg.maxSwaps === 'number' ? 'lượt đổi pin/tháng' : 'lượt đổi pin'}
                                    </div>
                                </div>

                                <ul className="space-y-3">
                                    {pkg.features.map((feature, featureIndex) => (
                                        <li key={featureIndex} className="flex items-center space-x-3">
                                            <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                                            <span className="text-gray-600">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <Button
                                    className={`w-full ${pkg.popular ? 'bg-primary hover:bg-primary/90' : ''}`}
                                    variant={pkg.popular ? 'default' : 'outline'}
                                    size="lg"
                                >
                                    <Zap className="mr-2 h-4 w-4" />
                                    Chọn gói này
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="mt-16 text-center">
                    <Card className="max-w-4xl mx-auto">
                        <CardContent className="p-8">
                            <div className="space-y-6">
                                <h3 className="text-2xl font-bold text-gray-900">
                                    Cách tính phí
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                                    <div className="space-y-2">
                                        <h4 className="font-semibold text-gray-900">Phí gói hàng tháng</h4>
                                        <p className="text-sm text-gray-600">
                                            Thanh toán trước mỗi tháng theo gói đã chọn
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="font-semibold text-gray-900">Phí vượt quá</h4>
                                        <p className="text-sm text-gray-600">
                                            Tính theo delta SoH, trừ free allowance 2%
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="font-semibold text-gray-900">Bảo hiểm</h4>
                                        <p className="text-sm text-gray-600">
                                            Tất cả gói đều bao gồm bảo hiểm pin toàn diện
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Services;
