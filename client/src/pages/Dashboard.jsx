import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { useAuth } from '../hooks/useAuth'
import {
    Battery,
    Car,
    MapPin,
    Calendar,
    CreditCard,
    Settings,
    Plus,
    Eye,
    TrendingUp
} from 'lucide-react';

const Dashboard = () => {
    const { user } = useAuth();

    // Mock data - in real app, this would come from API
    const userStats = {
        totalSwaps: 45,
        thisMonthSwaps: 8,
        currentBatterySoH: 87,
        monthlyCost: 150000,
        nextSwapPrediction: '3 ngày'
    };

    const recentSwaps = [
        {
            id: 1,
            station: 'Trạm ABC - Quận 1',
            date: '2024-01-15',
            batteryType: 'Type 1',
            cost: 15000,
            sohChange: -2
        },
        {
            id: 2,
            station: 'Trạm XYZ - Quận 3',
            date: '2024-01-10',
            batteryType: 'Type 1',
            cost: 15000,
            sohChange: -1
        }
    ];

    const upcomingBookings = [
        {
            id: 1,
            station: 'Trạm DEF - Quận 2',
            date: '2024-01-20',
            time: '14:30',
            batteryType: 'Type 1'
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <Avatar className="h-16 w-16">
                                <AvatarImage src={user?.avatar} alt={user?.fullname} />
                                <AvatarFallback className="text-lg">
                                    {user?.fullname?.charAt(0) || 'U'}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">
                                    Chào mừng, {user?.fullname}!
                                </h1>
                                <p className="text-gray-600">
                                    Tài xế xe điện • Thành viên từ {new Date().getFullYear()}
                                </p>
                            </div>
                        </div>
                        <Button>
                            <Settings className="mr-2 h-4 w-4" />
                            Cài đặt
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Tổng lượt đổi pin</p>
                                    <p className="text-2xl font-bold text-gray-900">{userStats.totalSwaps}</p>
                                </div>
                                <Battery className="h-8 w-8 text-primary" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Tháng này</p>
                                    <p className="text-2xl font-bold text-gray-900">{userStats.thisMonthSwaps}</p>
                                </div>
                                <TrendingUp className="h-8 w-8 text-green-500" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">SoH hiện tại</p>
                                    <p className="text-2xl font-bold text-gray-900">{userStats.currentBatterySoH}%</p>
                                </div>
                                <Car className="h-8 w-8 text-blue-500" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Chi phí tháng</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {userStats.monthlyCost.toLocaleString()}đ
                                    </p>
                                </div>
                                <CreditCard className="h-8 w-8 text-purple-500" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Recent Swaps */}
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Lịch sử đổi pin gần đây</CardTitle>
                                        <CardDescription>
                                            Các lần đổi pin của bạn trong thời gian qua
                                        </CardDescription>
                                    </div>
                                    <Button variant="outline" size="sm">
                                        <Eye className="mr-2 h-4 w-4" />
                                        Xem tất cả
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {recentSwaps.map((swap) => (
                                        <div key={swap.id} className="flex items-center justify-between p-4 border rounded-lg">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                                    <Battery className="h-5 w-5 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">{swap.station}</p>
                                                    <p className="text-sm text-gray-600">{swap.date}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <Badge variant="secondary">{swap.batteryType}</Badge>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {swap.cost.toLocaleString()}đ
                                                </p>
                                                <p className="text-xs text-red-600">
                                                    SoH: {swap.sohChange > 0 ? '+' : ''}{swap.sohChange}%
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Upcoming Bookings & Quick Actions */}
                    <div className="space-y-6">
                        {/* Upcoming Bookings */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Calendar className="mr-2 h-5 w-5" />
                                    Lịch đặt trước
                                </CardTitle>
                                <CardDescription>
                                    Các lịch đổi pin sắp tới
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {upcomingBookings.map((booking) => (
                                        <div key={booking.id} className="p-3 border rounded-lg">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-medium text-sm">{booking.station}</p>
                                                    <p className="text-xs text-gray-600">{booking.date} lúc {booking.time}</p>
                                                </div>
                                                <Badge variant="outline">{booking.batteryType}</Badge>
                                            </div>
                                        </div>
                                    ))}
                                    <Button variant="outline" size="sm" className="w-full">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Đặt lịch mới
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Quick Actions */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Thao tác nhanh</CardTitle>
                                <CardDescription>
                                    Các chức năng thường dùng
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Button className="w-full justify-start" variant="outline">
                                    <MapPin className="mr-2 h-4 w-4" />
                                    Tìm trạm gần nhất
                                </Button>
                                <Button className="w-full justify-start" variant="outline">
                                    <Calendar className="mr-2 h-4 w-4" />
                                    Đặt lịch đổi pin
                                </Button>
                                <Button className="w-full justify-start" variant="outline">
                                    <Car className="mr-2 h-4 w-4" />
                                    Quản lý xe
                                </Button>
                                <Button className="w-full justify-start" variant="outline">
                                    <CreditCard className="mr-2 h-4 w-4" />
                                    Xem hóa đơn
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
