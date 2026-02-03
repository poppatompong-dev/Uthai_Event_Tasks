'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/context';
import QuickCalendar from '@/components/QuickCalendar';
import SidePanel from '@/components/SidePanel';
import LoginModal from '@/components/LoginModal';
import DayEditModal from '@/components/DayEditModal';
import AttachmentGallery from '@/components/AttachmentGallery';
import Marquee from '@/components/Marquee';
import UserGuide from '@/components/UserGuide';
import DayDetailModal from '@/components/DayDetailModal';
import BulkImportModal from '@/components/BulkImportModal';
import ActivitiesDetail from '@/components/ActivitiesDetail';
import { Day, Month, Attachment } from '@/lib/types';

// Municipality Logo URL
const MUNICIPALITY_LOGO = 'https://img5.pic.in.th/file/secure-sv1/logo458ee4aa05680920.jpg';

type TabType = 'calendar' | 'activities' | 'guide';

export default function HomePage() {
  const { settings, years, selectedYear, setSelectedYear, isLoading, isAdmin, logout, currentUser } = useApp();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showDayEditModal, setShowDayEditModal] = useState(false);
  const [showDayDetailModal, setShowDayDetailModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Day | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<Month | null>(null);
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState(0);
  const [showGallery, setShowGallery] = useState(false);
  const [galleryAttachments, setGalleryAttachments] = useState<Attachment[]>([]);
  const [showSidePanel, setShowSidePanel] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('calendar');

  const selectedYearData = years.find((y) => y.id === selectedYear);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    const thaiYear = parseInt(year) + 543;
    const monthNames = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    return `${parseInt(day)} ${monthNames[parseInt(month) - 1]} ${thaiYear}`;
  };

  const handleDayClick = (day: Day, month: Month) => {
    setSelectedDay(day);
    setSelectedMonth(month);

    // Calculate day of week
    const date = new Date(day.date);
    setSelectedDayOfWeek(date.getDay());

    // Show detail modal for everyone (including normal days)
    setShowDayDetailModal(true);
  };

  const handleEditDay = () => {
    setShowDayDetailModal(false);
    setShowDayEditModal(true);
  };

  const handleViewAttachments = (attachments: Attachment[]) => {
    setGalleryAttachments(attachments);
    setShowGallery(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900">
        <div className="calendar-loader">
          <div className="calendar-icon">📅</div>
          <p className="mt-4 text-white font-medium text-lg">กำลังโหลดข้อมูล...</p>
          <div className="loading-spinner mt-4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 watermark-bg flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-800 via-indigo-800 to-purple-800 text-white py-4 shadow-2xl relative overflow-hidden flex-shrink-0">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="flex items-center justify-between gap-4">
            {/* Logo & Title */}
            <div className="flex items-center gap-4">
              <img
                src={MUNICIPALITY_LOGO}
                alt="โลโก้เทศบาล"
                className="w-16 h-16 rounded-full object-cover bg-white p-0.5 shadow-lg ring-2 ring-white/30"
              />
              <div>
                <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                  <span className="text-2xl">📅</span>
                  ปฏิทินดำเนินงาน/นับวันราชการ
                </h1>
                <p className="text-sm opacity-90">
                  {settings.schoolName || 'เทศบาลเมืองอุทัยธานี'} | {settings.educationOffice || 'กองยุทธศาสตร์และงบประมาณ'}
                </p>
              </div>
            </div>

            {/* Year Selection & Login */}
            <div className="flex items-center gap-3">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                {years.map((year) => (
                  <option key={year.id} value={year.id} className="text-gray-800">
                    {year.name}
                  </option>
                ))}
              </select>

              {isAdmin ? (
                <div className="flex items-center gap-2">
                  <span className="hidden md:inline text-sm bg-emerald-500/30 px-2 py-1 rounded-full">
                    👤 {currentUser?.fullname?.split(' ')[0]}
                  </span>
                  <button
                    onClick={logout}
                    className="px-3 py-2 bg-red-500/80 hover:bg-red-600 rounded-lg text-sm transition-all"
                    title="ออกจากระบบ"
                  >
                    🚪
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="px-4 py-2 bg-orange-500/80 hover:bg-orange-600 rounded-lg text-sm font-medium transition-all flex items-center gap-1"
                >
                  <span>🔐</span>
                  <span className="hidden md:inline">เข้าสู่ระบบ</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Admin Controls */}
      {isAdmin && (
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-2 px-4 flex-shrink-0">
          <div className="container mx-auto flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm">
              <span>✅</span>
              <span>Admin Mode</span>
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setShowBulkImportModal(true)}
                className="px-3 py-1.5 bg-white/20 rounded-lg text-sm hover:bg-white/30 transition-colors flex items-center gap-1"
              >
                <span>📥</span>
                <span className="hidden md:inline">นำเข้าวัน (Bulk)</span>
              </button>
              <button
                onClick={() => setShowSidePanel(true)}
                className="px-3 py-1.5 bg-white/20 rounded-lg text-sm hover:bg-white/30 transition-colors flex items-center gap-1"
              >
                <span>📋</span>
                <span className="hidden md:inline">จัดการกิจกรรม</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Marquee - Special Days / Holidays */}
      <Marquee />

      {/* Main Content with Tabs */}
      <main className="container mx-auto px-4 py-4 flex-1">
        {/* Tab Navigation - More Prominent */}
        <div className="tab-container">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`tab-button ${activeTab === 'calendar' ? 'active' : ''}`}
          >
            <span className="text-lg">📅</span>
            <span>ปฏิทิน</span>
          </button>
          <button
            onClick={() => setActiveTab('activities')}
            className={`tab-button ${activeTab === 'activities' ? 'active' : ''}`}
          >
            <span className="text-lg">📋</span>
            <span>กิจกรรม</span>
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`tab-button ${activeTab === 'guide' ? 'active' : ''}`}
          >
            <span className="text-lg">📖</span>
            <span>คู่มือ</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content p-6">
          {/* Calendar Tab */}
          {activeTab === 'calendar' && (
            <div className="space-y-4">
              {/* Year Info */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">📆</span>
                  <div>
                    <h2 className="text-xl font-bold gradient-text">{selectedYearData?.name}</h2>
                    <p className="text-sm text-gray-500">
                      {formatDate(selectedYearData?.startDate || '')} - {formatDate(selectedYearData?.endDate || '')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSidePanel(true)}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all text-sm flex items-center gap-2"
                >
                  <span>📋</span>
                  ดูรายละเอียดทั้งหมด
                </button>
              </div>

              {/* Quick Calendar */}
              <QuickCalendar
                onDayClick={handleDayClick}
                onOpenDetails={() => setShowSidePanel(true)}
              />

              {/* Legend - Compact */}
              <div className="flex flex-wrap justify-center gap-4 text-xs pt-4 border-t">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded bg-gradient-to-br from-teal-500 to-teal-600"></div>
                  <span>วันทำการ</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded bg-gradient-to-br from-purple-500 to-purple-600"></div>
                  <span>เสาร์ 💜</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded bg-gradient-to-br from-red-500 to-red-600"></div>
                  <span>อาทิตย์ ❤️</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded bg-gradient-to-br from-amber-400 to-amber-500 animate-pulse"></div>
                  <span>มีกิจกรรม ✨</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded bg-gradient-to-br from-rose-500 to-rose-600"></div>
                  <span>วันหยุด 🏖️</span>
                </div>
              </div>
            </div>
          )}

          {/* Activities Tab */}
          {activeTab === 'activities' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-4 border-b">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">📋</span>
                  <div>
                    <h2 className="text-xl font-bold gradient-text">รายละเอียดกิจกรรม</h2>
                    <p className="text-sm text-gray-500">ข้อมูลกิจกรรมและผู้รับผิดชอบทั้งหมด</p>
                  </div>
                </div>
              </div>
              <ActivitiesDetail onViewAttachments={handleViewAttachments} />
            </div>
          )}

          {/* Guide Tab */}
          {activeTab === 'guide' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b">
                <span className="text-3xl">📖</span>
                <div>
                  <h2 className="text-xl font-bold gradient-text">คู่มือการใช้งาน</h2>
                  <p className="text-sm text-gray-500">เรียนรู้วิธีใช้งานระบบปฏิทินกิจกรรม</p>
                </div>
              </div>

              <UserGuide />

              {/* Additional Help */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-xl">
                  <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                    <span>💡</span>
                    เคล็ดลับการใช้งาน
                  </h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• คลิกที่วันใดก็ได้เพื่อดูรายละเอียด</li>
                    <li>• วันที่มีกิจกรรมจะมีสีเหลืองและกระพริบ</li>
                    <li>• ใช้แท็บด้านบนเพื่อเปลี่ยนมุมมอง</li>
                  </ul>
                </div>
                <div className="p-4 bg-amber-50 rounded-xl">
                  <h4 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
                    <span>👨‍💼</span>
                    สำหรับผู้ดูแลระบบ
                  </h4>
                  <ul className="text-sm text-amber-700 space-y-1">
                    <li>• กดปุ่ม "เข้าสู่ระบบ" ด้านบนขวา</li>
                    <li>• ใช้ "นำเข้าวัน (Bulk)" เพื่อเพิ่มวันหลายๆ วัน</li>
                    <li>• คลิกวันที่แล้วกด "แก้ไข" เพื่อจัดการกิจกรรม</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer - Compact */}
      <footer className="footer-gradient text-white py-4 flex-shrink-0">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img
                src={MUNICIPALITY_LOGO}
                alt="โลโก้"
                className="w-10 h-10 rounded-full object-cover bg-white p-0.5"
              />
              <div className="text-sm">
                <p className="font-medium">ปฏิทินดำเนินงาน/นับวันราชการ</p>
                <p className="opacity-70 text-xs">{settings.educationOffice || 'กองยุทธศาสตร์และงบประมาณ'}</p>
              </div>
            </div>

            <div className="text-center md:text-right">
              <p className="text-cyan-300 text-sm flex items-center gap-2 justify-center md:justify-end">
                <span>👨‍💻</span>
                พัฒนาโดย: นักวิชาการคอมพิวเตอร์
              </p>
              <p className="font-bold text-sm footer-glow mt-1">
                "Empowering Digital Governance, One Day at a Time" 🚀
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Side Panel */}
      <SidePanel
        isOpen={showSidePanel}
        onClose={() => setShowSidePanel(false)}
        onViewAttachments={handleViewAttachments}
      />

      {/* Modals */}
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
      <DayEditModal
        isOpen={showDayEditModal}
        onClose={() => setShowDayEditModal(false)}
        day={selectedDay}
        month={selectedMonth}
      />
      <DayDetailModal
        isOpen={showDayDetailModal}
        onClose={() => setShowDayDetailModal(false)}
        day={selectedDay}
        month={selectedMonth}
        dayOfWeek={selectedDayOfWeek}
        onViewAttachments={handleViewAttachments}
        onEdit={handleEditDay}
        isAdmin={isAdmin}
      />
      <BulkImportModal
        isOpen={showBulkImportModal}
        onClose={() => setShowBulkImportModal(false)}
      />
      <AttachmentGallery
        attachments={galleryAttachments}
        isOpen={showGallery}
        onClose={() => setShowGallery(false)}
      />
    </div>
  );
}
