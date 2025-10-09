import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import {
    MapPin,
    Battery,
    Clock,
    Star,
    Search,
    Filter,
    Navigation
} from 'lucide-react';

const Stations = () => {
    // Mock data - in real app, this would come from API
    const stations = [
        {
            id: 1,
            name: 'Trạm ABC - Quận 1',
            address: '123 Đường ABC, Quận 1, TP.HCM',
            distance: '2.3 km',
            rating: 4.8,
            reviews: 127,
            type1Available: 15,
            type2Available: 8,
            operatingHours: '24/7',
            status: 'available'
        },
        {
            id: 2,
            name: 'Trạm XYZ - Quận 3',
            address: '456 Đường XYZ, Quận 3, TP.HCM',
            distance: '3.7 km',
            rating: 4.6,
            reviews: 89,
            type1Available: 12,
            type2Available: 5,
            operatingHours: '24/7',
            status: 'available'
        },
        {
            id: 3,
            name: 'Trạm DEF - Quận 2',
            address: '789 Đường DEF, Quận 2, TP.HCM',
            distance: '4.1 km',
            rating: 4.9,
            reviews: 203,
            type1Available: 0,
            type2Available: 3,
            operatingHours: '24/7',
            status: 'limited'
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Tìm trạm đổi pin
                    </h1>
                    <p className="text-gray-600">
                        Tìm kiếm trạm đổi pin gần nhất với tình trạng pin sẵn có
                    </p>
                </div>

                {/* Search and Filter */}
                <Card className="mb-8">
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="md:col-span-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="Nhập địa chỉ hoặc tên trạm..."
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            <div>
                                <select className="w-full h-10 px-3 rounded-md border border-input bg-background">
                                    <option value="">Loại pin</option>
                                    <option value="type1">Type 1</option>
                                    <option value="type2">Type 2</option>
                                </select>
                            </div>
                            <div>
                                <Button className="w-full">
                                    <Filter className="mr-2 h-4 w-4" />
                                    Lọc
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Stations List */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        {stations.map((station) => (
                            <Card key={station.id} className="hover:shadow-lg transition-shadow">
                                <CardContent className="p-6">
                                    <div className="space-y-4">
                                        {/* Header */}
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-2">
                                                <div className="flex items-center space-x-2">
                                                    <h3 className="text-lg font-semibold">{station.name}</h3>
                                                    {station.status === 'available' ? (
                                                        <Badge variant="default">Sẵn sàng</Badge>
                                                    ) : (
                                                        <Badge variant="secondary">Hạn chế</Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-center space-x-4 text-sm text-gray-600">
                                                    <div className="flex items-center space-x-1">
                                                        <MapPin className="h-4 w-4" />
                                                        <span>{station.distance}</span>
                                                    </div>
                                                    <div className="flex items-center space-x-1">
                                                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                                        <span>{station.rating} ({station.reviews})</span>
                                                    </div>
                                                    <div className="flex items-center space-x-1">
                                                        <Clock className="h-4 w-4" />
                                                        <span>{station.operatingHours}</span>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-gray-600">{station.address}</p>
                                            </div>
                                        </div>

                                        {/* Battery Availability */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 bg-green-50 rounded-lg">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-2">
                                                        <Battery className="h-5 w-5 text-green-600" />
                                                        <span className="font-medium">Pin Type 1</span>
                                                    </div>
                                                    <div className={`font-semibold ${station.type1Available > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {station.type1Available} pin
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="p-4 bg-blue-50 rounded-lg">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-2">
                                                        <Battery className="h-5 w-5 text-blue-600" />
                                                        <span className="font-medium">Pin Type 2</span>
                                                    </div>
                                                    <div className={`font-semibold ${station.type2Available > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                                        {station.type2Available} pin
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex space-x-3">
                                            <Button className="flex-1">
                                                <Navigation className="mr-2 h-4 w-4" />
                                                Chỉ đường
                                            </Button>
                                            <Button variant="outline" className="flex-1">
                                                Đặt lịch
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Map Placeholder */}
                    <div className="lg:col-span-1">
                        <Card className="sticky top-4">
                            <CardHeader>
                                <CardTitle>Bản đồ</CardTitle>
                                <CardDescription>
                                    Vị trí các trạm đổi pin
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
                                    <div className="text-center">
                                        <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-600">Google Maps sẽ được tích hợp ở đây</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Stations;
