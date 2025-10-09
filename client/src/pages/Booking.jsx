import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Calendar, Clock, MapPin, Battery } from 'lucide-react';

const Booking = () => {
    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            Đặt lịch đổi pin
                        </h1>
                        <p className="text-gray-600">
                            Đặt lịch trước để đảm bảo có pin đầy khi cần
                        </p>
                    </div>

                    <Card>
                        <CardContent className="p-8">
                            <div className="text-center space-y-6">
                                <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                                    <Calendar className="h-12 w-12 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                        Tính năng đang phát triển
                                    </h2>
                                    <p className="text-gray-600">
                                        Chức năng đặt lịch đổi pin sẽ sớm được ra mắt.
                                        Hiện tại bạn có thể tìm trạm và đổi pin trực tiếp.
                                    </p>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <Button size="lg">
                                        <MapPin className="mr-2 h-4 w-4" />
                                        Tìm trạm gần nhất
                                    </Button>
                                    <Button size="lg" variant="outline">
                                        <Battery className="mr-2 h-4 w-4" />
                                        Xem tình trạng pin
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Booking;
