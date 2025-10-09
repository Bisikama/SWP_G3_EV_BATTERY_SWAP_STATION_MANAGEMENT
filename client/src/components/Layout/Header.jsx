import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import {
    NavigationMenu,
    NavigationMenuList,
    NavigationMenuItem,
    NavigationMenuTrigger,
    NavigationMenuContent,
    NavigationMenuLink
} from '../ui/navigation-menu';
import { useAuth } from '../../hooks/useAuth';
import {
    MapPin,
    User,
    LogOut,
    Settings,
    Battery,
    Car,
    Menu,
    X
} from 'lucide-react';

const Header = () => {
    const { user, isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const navigationItems = [
        { label: 'Trang chủ', href: '/' },
        { label: 'Tìm trạm', href: '/stations' },
        { label: 'Đặt lịch', href: '/booking' },
        { label: 'Dịch vụ', href: '/services' },
        { label: 'Hỗ trợ', href: '/support' },
    ];

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto px-4">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center space-x-2">
                        <Battery className="h-8 w-8 text-primary" />
                        <Link to="/" className="flex items-center space-x-2">
                            <span className="text-xl font-bold">EVSwap</span>
                            <Badge variant="secondary" className="text-xs">
                                Beta
                            </Badge>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <NavigationMenu className="hidden md:flex">
                        <NavigationMenuList>
                            {navigationItems.map((item) => (
                                <NavigationMenuItem key={item.href}>
                                    <NavigationMenuLink asChild>
                                        <Link
                                            to={item.href}
                                            className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none"
                                        >
                                            {item.label}
                                        </Link>
                                    </NavigationMenuLink>
                                </NavigationMenuItem>
                            ))}
                        </NavigationMenuList>
                    </NavigationMenu>

                    {/* User Actions */}
                    <div className="flex items-center space-x-4">
                        {isAuthenticated ? (
                            <>
                                {/* User Info */}
                                <div className="hidden md:flex items-center space-x-2">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={user?.avatar} alt={user?.fullname} />
                                        <AvatarFallback>
                                            {user?.fullname?.charAt(0) || 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium">{user?.fullname}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {user?.role === 'driver' ? 'Tài xế' : user?.role}
                                        </span>
                                    </div>
                                </div>

                                {/* Quick Actions */}
                                <div className="hidden md:flex items-center space-x-2">
                                    <Button variant="outline" size="sm" asChild>
                                        <Link to="/dashboard">
                                            <User className="h-4 w-4 mr-2" />
                                            Dashboard
                                        </Link>
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={handleLogout}>
                                        <LogOut className="h-4 w-4 mr-2" />
                                        Đăng xuất
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center space-x-2">
                                <Button variant="outline" asChild>
                                    <Link to="/login">Đăng nhập</Link>
                                </Button>
                                <Button asChild>
                                    <Link to="/register">Đăng ký</Link>
                                </Button>
                            </div>
                        )}

                        {/* Mobile Menu Button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="md:hidden"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </Button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="md:hidden border-t bg-background">
                        <div className="px-4 py-4 space-y-2">
                            {navigationItems.map((item) => (
                                <Link
                                    key={item.href}
                                    to={item.href}
                                    className="block px-3 py-2 text-sm font-medium rounded-md hover:bg-accent"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    {item.label}
                                </Link>
                            ))}
                            {isAuthenticated ? (
                                <div className="pt-4 border-t space-y-2">
                                    <Link
                                        to="/dashboard"
                                        className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-accent"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        <User className="h-4 w-4 mr-2" />
                                        Dashboard
                                    </Link>
                                    <button
                                        onClick={() => {
                                            handleLogout();
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className="flex items-center w-full px-3 py-2 text-sm font-medium rounded-md hover:bg-accent text-left"
                                    >
                                        <LogOut className="h-4 w-4 mr-2" />
                                        Đăng xuất
                                    </button>
                                </div>
                            ) : (
                                <div className="pt-4 border-t space-y-2">
                                    <Link
                                        to="/login"
                                        className="block px-3 py-2 text-sm font-medium rounded-md hover:bg-accent"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        Đăng nhập
                                    </Link>
                                    <Link
                                        to="/register"
                                        className="block px-3 py-2 text-sm font-medium rounded-md hover:bg-accent"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        Đăng ký
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;
