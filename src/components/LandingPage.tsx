'use client';

import React from 'react';
import { useApp } from '@/lib/context';

// Municipality Logo URL
const MUNICIPALITY_LOGO = 'https://img5.pic.in.th/file/secure-sv1/logo458ee4aa05680920.jpg';

interface LandingPageProps {
    onEnterCalendar: () => void;
    onLogin: () => void;
}

export default function LandingPage({ onEnterCalendar, onLogin }: LandingPageProps) {
    const { settings, years, days, months, selectedYear } = useApp();

    // คำนวณสถิติ
    const yearMonths = months.filter(m => m.yearId === selectedYear);
    const yearDays = days.filter(d => yearMonths.some(m => m.id === d.monthId));

    const totalActivities = yearDays.filter(d =>
        d.entries && d.entries.some(e =>
            e.detail &&
            !e.detail.includes('วันเสาร์') &&
            !e.detail.includes('วันอาทิตย์')
        )
    ).length;

    const totalHolidays = yearDays.filter(d =>
        d.entries && d.entries.some(e =>
            e.detail && (
                e.detail.includes('วันหยุด') ||
                e.detail.includes('ปิดราชการ') ||
                e.detail.includes('หยุดชดเชย') ||
                e.detail.includes('วันขึ้นปีใหม่') ||
                e.detail.includes('วันสงกรานต์') ||
                e.detail.includes('มาฆบูชา') ||
                e.detail.includes('วิสาขบูชา') ||
                e.detail.includes('อาสาฬหบูชา')
            )
        )
    ).length;

    const selectedYearData = years.find(y => y.id === selectedYear);

    // รายการตัวอย่างกิจกรรมล่าสุด
    const recentActivities = yearDays
        .filter(d => d.entries && d.entries.some(e =>
            e.detail &&
            !e.detail.includes('วันเสาร์') &&
            !e.detail.includes('วันอาทิตย์') &&
            !e.detail.includes('วันหยุด')
        ))
        .slice(0, 5)
        .map(d => {
            const entry = d.entries?.find(e =>
                e.detail &&
                !e.detail.includes('วันเสาร์') &&
                !e.detail.includes('วันอาทิตย์')
            );
            return {
                date: d.date,
                detail: entry?.detail || '',
                responsible: entry?.responsible || ''
            };
        });

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const [year, month, day] = dateStr.split('-');
        const thaiYear = parseInt(year) + 543;
        const monthNames = [
            'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
            'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
        ];
        return `${parseInt(day)} ${monthNames[parseInt(month) - 1]} ${thaiYear}`;
    };

    return (
        <div className="min-h-screen landing-hero">
            {/* Hero Section */}
            <div className="relative z-10 min-h-screen flex flex-col">
                {/* Header */}
                <header className="py-6 px-4">
                    <div className="container mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <img
                                src={MUNICIPALITY_LOGO}
                                alt="โลโก้เทศบาล"
                                className="w-16 h-16 rounded-full object-cover bg-white p-1 shadow-xl ring-4 ring-white/30"
                            />
                            <div className="text-white">
                                <h1 className="text-xl md:text-2xl font-bold">
                                    {settings.schoolName || 'เทศบาลเมืองอุทัยธานี'}
                                </h1>
                                <p className="text-sm opacity-90">
                                    {settings.educationOffice || 'กองยุทธศาสตร์และงบประมาณ'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onLogin}
                            className="px-5 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl font-medium transition-all border border-white/30 flex items-center gap-2"
                        >
                            <span>🔐</span>
                            <span className="hidden md:inline">เข้าสู่ระบบผู้ดูแล</span>
                        </button>
                    </div>
                </header>

                {/* Main Hero Content */}
                <main className="flex-1 container mx-auto px-4 py-8 flex flex-col lg:flex-row items-center gap-12">
                    {/* Left Side - Welcome Text */}
                    <div className="flex-1 text-center lg:text-left text-white">
                        <div className="inline-block px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm mb-6 border border-white/30">
                            📅 ปีงบประมาณ {selectedYearData?.name || '2569'}
                        </div>
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                            ปฏิทินดำเนินงาน<br />
                            <span className="text-amber-300">นับวันราชการ</span>
                        </h2>
                        <p className="text-lg md:text-xl opacity-90 mb-8 max-w-xl mx-auto lg:mx-0">
                            ระบบบริหารจัดการปฏิทินกิจกรรม วางแผนงาน และติดตามความคืบหน้า
                            สำหรับบุคลากรเทศบาลเมืองอุทัยธานี
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                            <button
                                onClick={onEnterCalendar}
                                className="px-8 py-4 bg-white text-teal-600 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-3xl hover:scale-105 transition-all flex items-center justify-center gap-3"
                            >
                                <span className="text-2xl">📆</span>
                                ดูปฏิทินกิจกรรม
                            </button>
                            <button
                                onClick={onEnterCalendar}
                                className="px-8 py-4 bg-amber-400 text-amber-900 rounded-2xl font-bold text-lg shadow-xl hover:bg-amber-300 hover:scale-105 transition-all flex items-center justify-center gap-3"
                            >
                                <span className="text-2xl">📋</span>
                                ดูรายละเอียดกิจกรรม
                            </button>
                        </div>
                    </div>

                    {/* Right Side - Stats Card */}
                    <div className="flex-1 max-w-lg w-full">
                        <div className="hero-card p-8">
                            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                                <span className="text-3xl">📊</span>
                                สรุปภาพรวม
                            </h3>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="bg-gradient-to-br from-teal-50 to-cyan-50 p-4 rounded-xl border border-teal-100">
                                    <div className="text-3xl font-bold text-teal-600">{yearMonths.length}</div>
                                    <div className="text-sm text-teal-700">เดือนในปีนี้</div>
                                </div>
                                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 p-4 rounded-xl border border-amber-100">
                                    <div className="text-3xl font-bold text-amber-600">{totalActivities}</div>
                                    <div className="text-sm text-amber-700">กิจกรรมทั้งหมด</div>
                                </div>
                                <div className="bg-gradient-to-br from-rose-50 to-pink-50 p-4 rounded-xl border border-rose-100">
                                    <div className="text-3xl font-bold text-rose-600">{totalHolidays}</div>
                                    <div className="text-sm text-rose-700">วันหยุดราชการ</div>
                                </div>
                                <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-4 rounded-xl border border-purple-100">
                                    <div className="text-3xl font-bold text-purple-600">{yearDays.length}</div>
                                    <div className="text-sm text-purple-700">วันที่บันทึกแล้ว</div>
                                </div>
                            </div>

                            {/* Recent Activities */}
                            {recentActivities.length > 0 && (
                                <div>
                                    <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                        <span>🔔</span>
                                        กิจกรรมที่กำลังจะมาถึง
                                    </h4>
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {recentActivities.map((activity, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                                            >
                                                <span className="text-cyan-500 text-lg">📌</span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-800 truncate">
                                                        {activity.detail.length > 40
                                                            ? activity.detail.substring(0, 40) + '...'
                                                            : activity.detail}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {formatDate(activity.date)}
                                                        {activity.responsible && ` • ${activity.responsible}`}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </main>

                {/* Feature Highlights */}
                <section className="container mx-auto px-4 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="feature-card text-center">
                            <div className="text-5xl mb-4 feature-icon">📅</div>
                            <h4 className="text-xl font-bold text-gray-800 mb-2">ปฏิทินอัจฉริยะ</h4>
                            <p className="text-gray-600 text-sm">
                                ดูปฏิทินรายเดือน พร้อมสีแยกประเภทกิจกรรม วันหยุด และวันทำการ
                            </p>
                        </div>
                        <div className="feature-card text-center">
                            <div className="text-5xl mb-4 feature-icon">📋</div>
                            <h4 className="text-xl font-bold text-gray-800 mb-2">จัดการกิจกรรม</h4>
                            <p className="text-gray-600 text-sm">
                                เพิ่ม แก้ไข ลบกิจกรรม พร้อมระบุผู้รับผิดชอบและแนบไฟล์
                            </p>
                        </div>
                        <div className="feature-card text-center">
                            <div className="text-5xl mb-4 feature-icon">📊</div>
                            <h4 className="text-xl font-bold text-gray-800 mb-2">นำเข้าข้อมูล</h4>
                            <p className="text-gray-600 text-sm">
                                นำเข้าวันหยุดราชการอัตโนมัติตาม มติ ครม. รองรับหลายปีงบประมาณ
                            </p>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="py-6 px-4 text-center text-white/80 text-sm">
                    <p className="mb-2">
                        👨‍💻 พัฒนาโดย: นักวิชาการคอมพิวเตอร์ กองยุทธศาสตร์และงบประมาณ
                    </p>
                    <p className="font-medium text-white">
                        "Empowering Digital Governance, One Day at a Time" 🚀
                    </p>
                </footer>
            </div>
        </div>
    );
}
