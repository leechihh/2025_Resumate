// src/Layout.jsx
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Briefcase, Mail } from 'lucide-react';

export default function Layout() {
    const location = useLocation();

    const isActive = (path) => {
        return location.pathname === path ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100";
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            {/* 頂部導覽列 */}
            <nav className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-8">
                    <Link to="/" className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Briefcase className="text-blue-600" />
                        Resumate
                    </Link>

                    {/* Tabs */}
                    <div className="flex gap-2">
                        <Link to="/" className={`px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition ${isActive('/')}`}>
                            <Briefcase size={18} /> 職缺管理
                        </Link>
                        <Link to="/email" className={`px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition ${isActive('/email')}`}>
                            <Mail size={18} /> 信件中心
                        </Link>
                    </div>
                </div>

                {/* 右側使用者頭像 (假裝有登入) */}
                <div className="w-8 h-8 bg-blue-600 rounded-full text-white flex items-center justify-center font-bold">
                    H
                </div>
            </nav>

            {/* 頁面內容渲染區 */}
            <main className="p-8 max-w-7xl mx-auto">
                <Outlet />
            </main>
        </div>
    );
}