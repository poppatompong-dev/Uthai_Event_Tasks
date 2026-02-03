'use client';

import React from 'react';
import { useApp } from '@/lib/context';
import { Month, Day } from '@/lib/types';

interface QuickCalendarProps {
    onDayClick?: (day: Day, month: Month) => void;
    onOpenDetails?: () => void;
}

const getDayTitle = (dayOfWeek: number): string => {
    const dayNames = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'];
    return dayNames[dayOfWeek];
};

export default function QuickCalendar({ onDayClick, onOpenDetails }: QuickCalendarProps) {
    const { months, days, selectedYear, years } = useApp();

    const selectedYearData = years.find((y) => y.id === selectedYear);
    const yearMonths = months.filter((m) => m.yearId === selectedYear);

    const getDayData = (monthId: string, dayNum: number, monthValue: string): Day | undefined => {
        const [year, month] = monthValue.split('-');
        const dateStr = `${year}-${month}-${String(dayNum).padStart(2, '0')}`;
        return days.find((d) => d.monthId === monthId && d.date === dateStr);
    };

    const getDaysInMonth = (monthValue: string): number => {
        const [year, month] = monthValue.split('-');
        return new Date(parseInt(year), parseInt(month), 0).getDate();
    };

    const getDayOfWeek = (monthValue: string, day: number): number => {
        const [year, month] = monthValue.split('-');
        return new Date(parseInt(year), parseInt(month) - 1, day).getDay();
    };

    const hasActivity = (day: Day | undefined): boolean => {
        if (!day?.entries?.length) return false;
        const detail = day.entries[0].detail;
        // Don't count weekend entries as activities
        if (detail.includes('วันเสาร์') || detail.includes('วันอาทิตย์')) return false;
        return true;
    };

    const isHoliday = (day: Day | undefined): boolean => {
        if (!day?.entries?.length) return false;
        const detail = day.entries[0].detail;
        return detail.includes('วันหยุด') || detail.includes('ปิดราชการ');
    };

    const getCellStyle = (day: Day | undefined, dayOfWeek: number): string => {
        // Check for holidays first
        if (isHoliday(day)) {
            return 'bg-gradient-to-br from-rose-500 to-rose-600 text-white';
        }

        // Check for activities (non-weekend)
        if (hasActivity(day)) {
            return 'activity-day';
        }

        // Weekend colors
        if (dayOfWeek === 0) {
            return 'bg-gradient-to-br from-red-500 to-red-600 text-white';
        }
        if (dayOfWeek === 6) {
            return 'bg-gradient-to-br from-purple-500 to-purple-600 text-white';
        }

        // Working days
        return 'bg-gradient-to-br from-teal-500 to-teal-600 text-white';
    };

    const getActivityCount = (): number => {
        let count = 0;
        yearMonths.forEach((month) => {
            const monthDays = days.filter((d) => d.monthId === month.id);
            monthDays.forEach((day) => {
                if (hasActivity(day)) count++;
            });
        });
        return count;
    };

    const getWorkingDaysCount = (): number => {
        let count = 0;
        yearMonths.forEach((month) => {
            const monthDays = days.filter((d) => d.monthId === month.id);
            monthDays.forEach((day) => {
                if (!day.entries?.length) {
                    const dayOfWeek = new Date(day.date).getDay();
                    if (dayOfWeek !== 0 && dayOfWeek !== 6) count++;
                } else {
                    const detail = day.entries[0].detail;
                    if (!['วันอาทิตย์', 'วันเสาร์', 'วันหยุด', 'ปิดราชการ'].some((k) => detail.includes(k))) {
                        count++;
                    }
                }
            });
        });
        return count;
    };

    return (
        <div className="quick-calendar p-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg feature-icon">
                        <span className="text-2xl">🗓️</span>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold gradient-text">Quick Calendar</h2>
                        <p className="text-gray-500 text-sm">ปฏิทินแบบรวดเร็ว ดูง่าย เข้าใจทันที</p>
                    </div>
                </div>

                {/* Stats */}
                <div className="flex gap-4">
                    <div className="stats-card text-center px-4 py-2">
                        <div className="text-2xl font-bold text-teal-600">{getWorkingDaysCount()}</div>
                        <div className="text-xs text-gray-500">วันทำการ</div>
                    </div>
                    <div className="stats-card text-center px-4 py-2">
                        <div className="text-2xl font-bold text-amber-500">{getActivityCount()}</div>
                        <div className="text-xs text-gray-500">กิจกรรม</div>
                    </div>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                    <thead>
                        <tr className="bg-gradient-to-r from-slate-700 via-slate-800 to-slate-700 text-white">
                            <th className="border border-white/20 px-2 py-2 text-xs font-bold sticky left-0 bg-slate-700 z-10">
                                📅 เดือน
                            </th>
                            {Array.from({ length: 31 }, (_, i) => (
                                <th key={i + 1} className="border border-white/20 px-0.5 py-2 text-xs font-medium min-w-[28px]">
                                    {i + 1}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {yearMonths.map((month) => {
                            const daysInMonth = getDaysInMonth(month.month);

                            return (
                                <tr key={month.id} className="hover:bg-gray-50/50">
                                    <td className="border border-gray-200 px-2 py-1.5 font-medium bg-gradient-to-r from-slate-600 to-slate-700 text-white text-xs text-center whitespace-nowrap sticky left-0 z-10">
                                        {month.name.replace(/\s*\d{4}$/, '').substring(0, 3)}
                                    </td>
                                    {Array.from({ length: 31 }, (_, i) => {
                                        const dayNum = i + 1;
                                        if (dayNum > daysInMonth) {
                                            return (
                                                <td key={dayNum} className="border border-gray-100 bg-gray-50"></td>
                                            );
                                        }

                                        const dayData = getDayData(month.id, dayNum, month.month);
                                        const dayOfWeek = getDayOfWeek(month.month, dayNum);
                                        const cellStyle = getCellStyle(dayData, dayOfWeek);
                                        const hasFiles = (dayData?.attachments?.length || 0) > 0;
                                        const hasActivityFlag = hasActivity(dayData);

                                        // Create placeholder day data for days without data
                                        const handleClick = () => {
                                            if (onDayClick) {
                                                const [year, monthNum] = month.month.split('-');
                                                const dateStr = `${year}-${monthNum}-${String(dayNum).padStart(2, '0')}`;

                                                if (dayData) {
                                                    onDayClick(dayData, month);
                                                } else {
                                                    // Create a placeholder day for empty days
                                                    const placeholderDay: Day = {
                                                        id: `temp-${dateStr}`,
                                                        monthId: month.id,
                                                        date: dateStr,
                                                        entries: [],
                                                        attachments: [],
                                                    };
                                                    onDayClick(placeholderDay, month);
                                                }
                                            }
                                        };

                                        return (
                                            <td
                                                key={dayNum}
                                                className={`border border-white/20 p-0.5 text-center cursor-pointer transition-all ${cellStyle}`}
                                                onClick={handleClick}
                                                title={dayData?.entries?.[0]?.detail || getDayTitle(dayOfWeek)}
                                            >
                                                <div className="quick-calendar-cell mx-auto relative">
                                                    {dayNum}
                                                    {(hasFiles || hasActivityFlag) && (
                                                        <span className="activity-badge"></span>
                                                    )}
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Legend */}
            <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded bg-gradient-to-br from-teal-500 to-teal-600"></div>
                    <span>วันทำการ</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded bg-gradient-to-br from-purple-500 to-purple-600"></div>
                    <span>เสาร์</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded bg-gradient-to-br from-red-500 to-red-600"></div>
                    <span>อาทิตย์</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded bg-gradient-to-br from-amber-400 to-amber-500 animate-pulse"></div>
                    <span>มีกิจกรรม ✨</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded bg-gradient-to-br from-rose-500 to-rose-600"></div>
                    <span>วันหยุด</span>
                </div>
            </div>

            {/* View Details Button */}
            {onOpenDetails && (
                <div className="mt-6 text-center">
                    <button
                        onClick={onOpenDetails}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all inline-flex items-center gap-2"
                    >
                        <span className="text-xl">📋</span>
                        ดูรายละเอียดกิจกรรมทั้งหมด
                        <span className="text-xl">→</span>
                    </button>
                </div>
            )}
        </div>
    );
}
