import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import {
    MessageCircle,
    Phone,
    Mail,
    MapPin,
    Clock,
    HelpCircle,
    FileText,
    AlertTriangle
} from 'lucide-react';

const Support = () => {
    const faqs = [
        {
            question: 'Làm thế nào để đổi pin tại trạm?',
            answer: 'Quét QR code tại trạm, hệ thống sẽ tự động đổi pin trong 3-5 phút.'
        },
        {
            question: 'Tôi có thể hủy lịch đã đặt không?',
            answer: 'Có, bạn có thể hủy lịch trước 2 giờ mà không bị tính phí.'
        },
        {
            question: 'Làm sao để theo dõi chi phí sử dụng?',
            answer: 'Vào Dashboard > Lịch sử giao dịch để xem chi tiết chi phí.'
        },
        {
            question: 'Pin có được bảo hiểm không?',
            answer: 'Tất cả pin đều được bảo hiểm toàn diện, bao gồm hỏng hóc và mất mát.'
        }
    ];

    const contactMethods = [
        {
            icon: <Phone className="h-6 w-6" />,
            title: 'Hotline 24/7',
            description: '1900 1234',
            action: 'Gọi ngay'
        },
        {
            icon: <Mail className="h-6 w-6" />,
            title: 'Email hỗ trợ',
            description: 'support@evswap.vn',
            action: 'Gửi email'
        },
        {
            icon: <MessageCircle className="h-6 w-6" />,
            title: 'Chat trực tuyến',
            description: 'Hỗ trợ ngay lập tức',
            action: 'Bắt đầu chat'
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <h1 className="text-3xl font-bold text-gray-900 mb-4">
                            Hỗ trợ khách hàng
                        </h1>
                        <p className="text-xl text-gray-600">
                            Chúng tôi luôn sẵn sàng hỗ trợ bạn 24/7
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Contact Methods */}
                        <div className="lg:col-span-1 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Liên hệ trực tiếp</CardTitle>
                                    <CardDescription>
                                        Chọn cách liên hệ phù hợp với bạn
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {contactMethods.map((method, index) => (
                                        <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                                    <div className="text-primary">
                                                        {method.icon}
                                                    </div>
                                                </div>
                                                <div>
                                                    <h4 className="font-medium">{method.title}</h4>
                                                    <p className="text-sm text-gray-600">{method.description}</p>
                                                </div>
                                            </div>
                                            <Button variant="outline" size="sm">
                                                {method.action}
                                            </Button>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Thông tin liên hệ</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center space-x-3">
                                        <MapPin className="h-5 w-5 text-primary" />
                                        <div>
                                            <p className="font-medium">Địa chỉ</p>
                                            <p className="text-sm text-gray-600">
                                                123 Đường ABC, Quận XYZ, TP.HCM
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <Clock className="h-5 w-5 text-primary" />
                                        <div>
                                            <p className="font-medium">Giờ làm việc</p>
                                            <p className="text-sm text-gray-600">
                                                24/7 - Hỗ trợ không ngừng nghỉ
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* FAQ and Support Form */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* FAQ */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <HelpCircle className="mr-2 h-5 w-5" />
                                        Câu hỏi thường gặp
                                    </CardTitle>
                                    <CardDescription>
                                        Tìm câu trả lời cho các thắc mắc phổ biến
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {faqs.map((faq, index) => (
                                            <div key={index} className="border rounded-lg p-4">
                                                <h4 className="font-medium mb-2">{faq.question}</h4>
                                                <p className="text-sm text-gray-600">{faq.answer}</p>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Support Request Form */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <FileText className="mr-2 h-5 w-5" />
                                        Gửi yêu cầu hỗ trợ
                                    </CardTitle>
                                    <CardDescription>
                                        Mô tả chi tiết vấn đề bạn gặp phải
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium mb-2">
                                                    Loại vấn đề
                                                </label>
                                                <select className="w-full h-10 px-3 rounded-md border border-input bg-background">
                                                    <option value="">Chọn loại vấn đề</option>
                                                    <option value="technical">Sự cố kỹ thuật</option>
                                                    <option value="billing">Vấn đề thanh toán</option>
                                                    <option value="booking">Vấn đề đặt lịch</option>
                                                    <option value="other">Khác</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-2">
                                                    Mức độ ưu tiên
                                                </label>
                                                <select className="w-full h-10 px-3 rounded-md border border-input bg-background">
                                                    <option value="low">Thấp</option>
                                                    <option value="medium">Trung bình</option>
                                                    <option value="high">Cao</option>
                                                    <option value="urgent">Khẩn cấp</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-2">
                                                Mô tả chi tiết
                                            </label>
                                            <textarea
                                                className="w-full h-32 px-3 py-2 rounded-md border border-input bg-background"
                                                placeholder="Mô tả chi tiết vấn đề bạn gặp phải..."
                                            />
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <input type="checkbox" id="urgent" className="rounded" />
                                            <label htmlFor="urgent" className="text-sm">
                                                Đánh dấu là vấn đề khẩn cấp
                                            </label>
                                        </div>

                                        <Button className="w-full">
                                            <AlertTriangle className="mr-2 h-4 w-4" />
                                            Gửi yêu cầu hỗ trợ
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Support;
