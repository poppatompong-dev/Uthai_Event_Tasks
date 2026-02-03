'use client';

import React from 'react';
import { Day, Month, Attachment } from '@/lib/types';

interface DayDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    day: Day | null;
    month: Month | null;
    dayOfWeek: number;
    onViewAttachments?: (attachments: Attachment[]) => void;
    onEdit?: () => void;
    isAdmin?: boolean;
}

const dayNames = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
const dayEmojis = ['☀️', '🌙', '🔥', '💚', '🧡', '💙', '💜'];

const dayColors: Record<number, string> = {
    0: 'from-red-500 to-red-600',
    1: 'from-teal-500 to-teal-600',
    2: 'from-teal-500 to-teal-600',
    3: 'from-teal-500 to-teal-600',
    4: 'from-teal-500 to-teal-600',
    5: 'from-teal-500 to-teal-600',
    6: 'from-purple-500 to-purple-600',
};

export default function DayDetailModal({
    isOpen,
    onClose,
    day,
    month,
    dayOfWeek,
    onViewAttachments,
    onEdit,
    isAdmin
}: DayDetailModalProps) {
    if (!isOpen || !day || !month) return null;

    const formatDate = () => {
        const [year, monthNum, dayNum] = day.date.split('-');
        const thaiYear = parseInt(year) + 543;
        const monthNames = [
            'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
            'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
        ];
        return `${parseInt(dayNum)} ${monthNames[parseInt(monthNum) - 1]} พ.ศ. ${thaiYear}`;
    };

    const hasActivity = () => {
        if (!day.entries?.length) return false;
        const detail = day.entries[0].detail;
        if (detail.includes('วันเสาร์') || detail.includes('วันอาทิตย์')) return false;
        return true;
    };

    const isHoliday = () => {
        if (!day.entries?.length) return false;
        const detail = day.entries[0].detail;
        return detail.includes('วันหยุด') || detail.includes('ปิดราชการ');
    };

    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const hasFiles = (day.attachments?.length || 0) > 0;

    return (
        <div
            className="modal-overlay"
            onClick={onClose}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: '100vw',
                height: '100vh',
                background: 'rgba(0, 0, 0, 0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 99999,
                padding: '16px',
            }}
        >
            <div
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: 'white',
                    borderRadius: '20px',
                    maxWidth: '500px',
                    width: '100%',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                }}
            >
                {/* Header */}
                <div className={`bg-gradient-to-r ${dayColors[dayOfWeek]} px-6 py-5 rounded-t-xl text-white`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-4xl">{dayEmojis[dayOfWeek]}</span>
                            <div>
                                <h2 className="text-2xl font-bold">
                                    วัน{dayNames[dayOfWeek]}
                                </h2>
                                <p className="text-white/80">{formatDate()}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <span className="text-2xl">✕</span>
                        </button>
                    </div>

                    {/* Status Badges */}
                    <div className="flex flex-wrap gap-2 mt-3">
                        {isWeekend && (
                            <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                                🌟 วันหยุดสุดสัปดาห์
                            </span>
                        )}
                        {isHoliday() && (
                            <span className="px-3 py-1 bg-rose-400/30 rounded-full text-sm">
                                🏖️ วันหยุดราชการ
                            </span>
                        )}
                        {hasActivity() && (
                            <span className="px-3 py-1 bg-amber-400/30 rounded-full text-sm">
                                ✨ มีกิจกรรม
                            </span>
                        )}
                        {hasFiles && (
                            <span className="px-3 py-1 bg-blue-400/30 rounded-full text-sm">
                                📎 มีไฟล์แนบ
                            </span>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {/* Activities */}
                    <div>
                        <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <span className="text-xl">📋</span>
                            รายละเอียดกิจกรรม
                        </h3>

                        {day.entries && day.entries.length > 0 ? (
                            <div className="space-y-3">
                                {day.entries.map((entry, idx) => (
                                    <div
                                        key={idx}
                                        className={`p-4 rounded-xl ${hasActivity() ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50 border border-gray-200'}`}
                                    >
                                        <p className={`font-medium ${hasActivity() ? 'text-amber-800' : 'text-gray-700'}`}>
                                            {entry.detail}
                                        </p>
                                        {entry.responsible && (
                                            <p className="text-sm text-gray-500 mt-2 flex items-center gap-1">
                                                <span>👤</span>
                                                ผู้รับผิดชอบ: {entry.responsible}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-6 bg-gray-50 rounded-xl text-center">
                                <span className="text-4xl mb-2 block">📝</span>
                                <p className="text-gray-500">
                                    {isWeekend ? 'วันหยุดสุดสัปดาห์ - ไม่มีกิจกรรม' : 'วันทำงานปกติ - ไม่มีกิจกรรมพิเศษ'}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Attachments */}
                    {hasFiles && (
                        <div>
                            <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                <span className="text-xl">📎</span>
                                ไฟล์แนบ ({day.attachments?.length})
                            </h3>
                            <button
                                onClick={() => onViewAttachments && day.attachments && onViewAttachments(day.attachments)}
                                className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
                            >
                                <span>🖼️</span>
                                ดูไฟล์แนบทั้งหมด
                            </button>
                        </div>
                    )}

                    {/* Day Info */}
                    <div className="p-4 bg-slate-50 rounded-xl">
                        <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <span>ℹ️</span>
                            ข้อมูลวัน
                        </h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <span className="text-gray-500">ประเภท:</span>
                                <span className="ml-2 font-medium">
                                    {isHoliday() ? 'วันหยุดราชการ' : isWeekend ? 'วันหยุดสุดสัปดาห์' : 'วันทำงาน'}
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-500">เดือน:</span>
                                <span className="ml-2 font-medium">{month.name}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 rounded-b-xl border-t flex gap-3">
                    {isAdmin && onEdit && (
                        <button
                            onClick={() => {
                                onClose();
                                onEdit();
                            }}
                            className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                        >
                            ✏️ แก้ไขข้อมูล
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className={`${isAdmin ? 'flex-1' : 'w-full'} py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all`}
                    >
                        ปิด
                    </button>
                </div>
            </div>
        </div>
    );
}
