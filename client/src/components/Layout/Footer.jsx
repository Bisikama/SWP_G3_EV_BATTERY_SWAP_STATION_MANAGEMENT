import React from 'react';
import { Link } from 'react-router';
import { Battery, MapPin, Phone, Mail, Facebook, Twitter, Instagram } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-slate-900 text-slate-100">
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Company Info */}
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <Battery className="h-8 w-8 text-primary" />
                            <span className="text-xl font-bold">EVSwap</span>
                        </div>
                        <p className="text-slate-300 text-sm">
                            Hệ thống quản lý trạm đổi pin xe máy điện hàng đầu Việt Nam.
                            Giải pháp tiện lợi cho tương lai xanh.
                        </p>
                        <div className="flex space-x-4">
                            <Facebook className="h-5 w-5 cursor-pointer hover:text-primary transition-colors" />
                            <Twitter className="h-5 w-5 cursor-pointer hover:text-primary transition-colors" />
                            <Instagram className="h-5 w-5 cursor-pointer hover:text-primary transition-colors" />
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Liên kết nhanh</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link to="/stations" className="text-slate-300 hover:text-primary transition-colors">
                                    Tìm trạm đổi pin
                                </Link>
                            </li>
                            <li>
                                <Link to="/services" className="text-slate-300 hover:text-primary transition-colors">
                                    Gói dịch vụ
                                </Link>
                            </li>
                            <li>
                                <Link to="/booking" className="text-slate-300 hover:text-primary transition-colors">
                                    Đặt lịch
                                </Link>
                            </li>
                            <li>
                                <Link to="/support" className="text-slate-300 hover:text-primary transition-colors">
                                    Hỗ trợ
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Services */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Dịch vụ</h3>
                        <ul className="space-y-2 text-sm">
                            <li className="text-slate-300">Đổi pin nhanh</li>
                            <li className="text-slate-300">Thuê pin theo gói</li>
                            <li className="text-slate-300">Bảo dưỡng pin</li>
                            <li className="text-slate-300">Hỗ trợ 24/7</li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Liên hệ</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center space-x-2">
                                <MapPin className="h-4 w-4 text-primary" />
                                <span className="text-slate-300">
                                    123 Đường ABC, Quận XYZ, TP.HCM
                                </span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Phone className="h-4 w-4 text-primary" />
                                <span className="text-slate-300">1900 1234</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Mail className="h-4 w-4 text-primary" />
                                <span className="text-slate-300">support@evswap.vn</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-t border-slate-700 mt-8 pt-8 text-center">
                    <p className="text-slate-400 text-sm">
                        © 2024 EVSwap. Tất cả quyền được bảo lưu.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
