'use client';

import React, { useState } from 'react';

interface GuideItem {
    color?: string;
    text: string;
}

interface GuideSection {
    title: string;
    items: GuideItem[];
}

export default function UserGuide() {
    const [isOpen, setIsOpen] = useState(false);

    const guides: GuideSection[] = [
        {
            title: 'แถบสีแสดงสถานะกิจกรรม',
            items: [
                { color: 'bg-emerald-500', text: 'กิจกรรมทั่วไป (เสร็จสิ้น/ปกติ)' },
                { color: 'bg-blue-500', text: 'กิจกรรมที่มีไฟล์แนบ' },
                { color: 'bg-amber-500', text: 'วันหยุดราชการ' },
                { color: 'bg-purple-500', text: 'กิจกรรมสำคัญ' },
                { color: 'bg-rose-500', text: 'กิจกรรมเร่งด่วน' },
            ]
        },
        {
            title: 'ไอคอนการจัดการ',
            items: [
                { text: '✏️ แก้ไข: คลิกที่วันที่ต้องการแก้ไข' },
                { text: '🗑️ ลบ: คลิกปุ่มลบในหน้าต่างแก้ไข' },
                { text: '📎 แนบไฟล์: รองรับ PDF และรูปภาพ' },
                { text: '📥 นำเข้า: นำเข้าข้อมูลจาก Excel/CSV' },
            ]
        },
        {
            title: 'ช็อตคัตคีย์บอร์ด',
            items: [
                { text: 'ESC: ปิดหน้าต่าง Popup' },
                { text: '← →: เปลี่ยนเดือน' },
            ]
        }
    ];

    return (
        <div className="fixed bottom-6 right-20 z-40">
            {/* Guide Popup */}
            {isOpen && (
                <div
                    className="absolute bottom-16 right-0 w-80 bg-white rounded-xl shadow-2xl p-0 overflow-hidden border border-gray-100 animate-slideUp origin-bottom-right"
                    style={{ animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex justify-between items-center text-white">
                        <div className="flex items-center gap-2">
                            <span className="text-xl">📚</span>
                            <h3 className="font-bold text-lg">คู่มือการใช้งาน</h3>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="bg-white/20 hover:bg-white/30 rounded-full w-8 h-8 flex items-center justify-center transition-all"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                        <div className="space-y-6">
                            {guides.map((item, index) => (
                                <div key={index} className="space-y-3">
                                    <h4 className="font-semibold text-gray-800 border-b pb-2 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                        {item.title}
                                    </h4>
                                    <ul className="space-y-2">
                                        {item.items.map((subItem, subIndex) => (
                                            <li key={subIndex} className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 p-2 rounded-lg hover:bg-gray-100 transition-colors">
                                                {/* ใช้ Optional Chaining และ Default Value เพื่อแก้ Type Error */}
                                                {subItem.color ? (
                                                    <div className={`w-5 h-5 rounded-md shadow-sm border border-gray-200 ${subItem.color} flex-shrink-0`}></div>
                                                ) : (
                                                    <div className="w-5 h-5 flex items-center justify-center text-gray-400 flex-shrink-0">•</div>
                                                )}
                                                <span>{subItem.text}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>

                        {/* Footer Tips */}
                        <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-100">
                            <div className="flex gap-2">
                                <span className="text-lg">💡</span>
                                <div>
                                    <h5 className="font-semibold text-blue-800 text-sm">เกร็ดความรู้</h5>
                                    <p className="text-xs text-blue-600 mt-1">
                                        คุณสามารถลากไฟล์มาวางในช่องแนบไฟล์ได้โดยตรงเพื่อความรวดเร็ว
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 transform hover:scale-110 active:scale-95 group ${isOpen
                        ? 'bg-gray-800 text-white rotate-90'
                        : 'bg-white text-blue-600 hover:bg-blue-50'
                    }`}
                title="คู่มือการใช้งาน"
            >
                {isOpen ? (
                    <span className="text-xl font-bold">✕</span>
                ) : (
                    <span className="text-3xl filter drop-shadow-sm group-hover:rotate-12 transition-transform">📖</span>
                )}

                {/* Ping Animation Indicator */}
                {!isOpen && (
                    <span className="absolute top-0 right-0 -mr-1 -mt-1 w-4 h-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500 border-2 border-white"></span>
                    </span>
                )}
            </button>
        </div>
    );
}
