'use client';

import React, { useState } from 'react';

export default function UserGuide() {
    const [isExpanded, setIsExpanded] = useState(false);

    const guideItems = [
        {
            icon: '📅',
            title: 'ดูปฏิทินด่วน',
            description: 'คลิกที่วันที่ในปฏิทินด้านบนเพื่อดูรายละเอียดกิจกรรม หรือคลิกเพื่อเปิดแผงรายละเอียด',
        },
        {
            icon: '🎨',
            title: 'ความหมายของสี',
            items: [
                { color: 'bg-teal-500', text: 'วันทำงานปกติ (จ-ศ)' },
                { color: 'bg-purple-500', text: 'วันเสาร์' },
                { color: 'bg-red-500', text: 'วันอาทิตย์' },
                { color: 'bg-amber-400', text: 'วันที่มีกิจกรรม 🌟' },
                { color: 'bg-rose-500', text: 'วันหยุดราชการ' },
            ],
        },
        {
            icon: '👨‍💼',
            title: 'สำหรับผู้ดูแลระบบ',
            description: 'คลิกปุ่ม 🔐 ด้านขวาล่างเพื่อเข้าสู่ระบบ แล้วจึงสามารถ:',
            items: [
                { text: '✏️ เพิ่ม/แก้ไข/ลบ กิจกรรม' },
                { text: '👤 กำหนดผู้รับผิดชอบ' },
                { text: '📎 แนบไฟล์เอกสาร รูปภาพ' },
                { text: '📊 จัดการวันหยุด วันพิเศษ' },
            ],
        },
        {
            icon: '💡',
            title: 'เคล็ดลับ',
            items: [
                { text: '🔍 ใช้เมนูเลือกปีงบประมาณเพื่อดูข้อมูลย้อนหลัง' },
                { text: '📱 รองรับการใช้งานบนมือถือ' },
                { text: '🖱️ วางเมาส์บนวันที่เพื่อดู tooltip รายละเอียด' },
            ],
        },
    ];

    return (
        <div className="guide-card p-6 mb-6">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between"
            >
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg feature-icon">
                        <span className="text-2xl">📖</span>
                    </div>
                    <div className="text-left">
                        <h3 className="text-xl font-bold gradient-text">คู่มือการใช้งาน</h3>
                        <p className="text-gray-500 text-sm">เรียนรู้วิธีใช้งานระบบปฏิทินกิจกรรม</p>
                    </div>
                </div>
                <div className={`transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                    <span className="text-2xl text-gray-400">▼</span>
                </div>
            </button>

            {isExpanded && (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 animate-[fadeIn_0.3s_ease-out]">
                    {guideItems.map((item, index) => (
                        <div
                            key={index}
                            className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100 hover:shadow-md transition-all"
                        >
                            <div className="flex items-start gap-3">
                                <span className="text-2xl">{item.icon}</span>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-gray-800 mb-2">{item.title}</h4>
                                    {item.description && (
                                        <p className="text-gray-600 text-sm mb-2">{item.description}</p>
                                    )}
                                    {item.items && (
                                        <ul className="space-y-1">
                                            {item.items.map((subItem, subIndex) => (
                                                <li key={subIndex} className="flex items-center gap-2 text-sm text-gray-600">
                                                    {'color' in subItem && (
                                                        <div className={`w-4 h-4 rounded ${subItem.color}`}></div>
                                                    )}
                                                    <span>{subItem.text}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
