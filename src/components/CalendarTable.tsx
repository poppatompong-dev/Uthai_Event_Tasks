'use client';

import React from 'react';
import { useApp } from '@/lib/context';
import { Month, Day } from '@/lib/types';

interface CalendarTableProps {
    onDayClick?: (day: Day, month: Month) => void;
}

export default function CalendarTable({ onDayClick }: CalendarTableProps) {
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
        // Don't count weekend-only entries as activities
        if (detail.includes('วันเสาร์') || detail.includes('วันอาทิตย์')) return false;
        return true;
    };

    const isHoliday = (day: Day | undefined): boolean => {
        if (!day?.entries?.length) return false;
        const detail = day.entries[0].detail;
        return detail.includes('วันหยุด') || detail.includes('ปิดราชการ') || detail.includes('หยุดชดเชย');
    };

    const getCellStyle = (day: Day | undefined, dayOfWeek: number): string => {
        // Check for holidays first (highest priority)
        if (isHoliday(day)) {
            return 'bg-gradient-to-br from-rose-500 to-rose-600';
        }

        // Check for activities (non-weekend entries)
        if (hasActivity(day)) {
            return 'activity-day';
        }

        // Weekend colors - Saturday (Purple) and Sunday (Red)
        if (dayOfWeek === 0) {
            return 'bg-gradient-to-br from-red-500 to-red-600'; // Sunday
        }
        if (dayOfWeek === 6) {
            return 'bg-gradient-to-br from-purple-500 to-purple-600'; // Saturday
        }

        // Working days (Mon-Fri): Teal
        return 'bg-gradient-to-br from-teal-500 to-teal-600';
    };

    const getWorkingDaysCount = (monthId: string): number => {
        const monthDays = days.filter((d) => d.monthId === monthId);
        let count = 0;
        for (const day of monthDays) {
            const dayOfWeek = new Date(day.date).getDay();

            // Skip weekends
            if (dayOfWeek === 0 || dayOfWeek === 6) continue;

            // Check if it's a holiday
            if (isHoliday(day)) continue;

            count++;
        }
        return count;
    };

    const hasAttachments = (day: Day | undefined): boolean => {
        return (day?.attachments?.length || 0) > 0;
    };

    return (
        <div className="overflow-x-auto shadow-inner rounded-xl">
            <table className="w-full border-collapse text-sm">
                <thead>
                    <tr className="bg-gradient-to-r from-slate-700 via-slate-800 to-slate-700 text-white">
                        <th className="border border-white/20 px-2 py-3 text-sm font-bold">📅 เดือน/วันที่</th>
                        {Array.from({ length: 31 }, (_, i) => (
                            <th key={i + 1} className="border border-white/20 px-1 py-3 text-xs font-semibold min-w-[32px]">
                                {i + 1}
                            </th>
                        ))}
                        <th className="border border-white/20 px-2 py-3 text-sm font-bold">📊 รวม</th>
                    </tr>
                </thead>
                <tbody>
                    {yearMonths.map((month) => {
                        const daysInMonth = getDaysInMonth(month.month);
                        const workingDays = getWorkingDaysCount(month.id);

                        return (
                            <tr key={month.id} className="hover:bg-gray-50/50">
                                <td className="border border-gray-200 px-2 py-2 font-medium bg-gradient-to-r from-slate-600 to-slate-700 text-white text-center whitespace-nowrap">
                                    {month.name}
                                </td>
                                {Array.from({ length: 31 }, (_, i) => {
                                    const dayNum = i + 1;
                                    if (dayNum > daysInMonth) {
                                        return (
                                            <td key={dayNum} className="border border-gray-200 bg-gray-100"></td>
                                        );
                                    }

                                    const dayData = getDayData(month.id, dayNum, month.month);
                                    const dayOfWeek = getDayOfWeek(month.month, dayNum);
                                    const cellStyle = getCellStyle(dayData, dayOfWeek);
                                    const hasFiles = hasAttachments(dayData);
                                    const hasActivityFlag = hasActivity(dayData);

                                    return (
                                        <td
                                            key={dayNum}
                                            className={`border border-white/30 px-1 py-2 text-center cursor-pointer transition-all hover:scale-110 hover:shadow-xl hover:z-10 ${cellStyle} text-white font-semibold relative`}
                                            onClick={() => onDayClick && dayData && onDayClick(dayData, month)}
                                            title={dayData?.entries?.[0]?.detail || getDayTitle(dayOfWeek)}
                                        >
                                            {dayNum}
                                            {hasFiles && (
                                                <span className="absolute top-0 right-0 w-2 h-2 bg-yellow-400 rounded-full shadow-sm"></span>
                                            )}
                                            {hasActivityFlag && (
                                                <span className="activity-badge"></span>
                                            )}
                                        </td>
                                    );
                                })}
                                <td className="border border-gray-200 px-2 py-2 text-center font-bold bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-lg">
                                    {workingDays}
                                </td>
                            </tr>
                        );
                    })}
                    {/* Total Row */}
                    <tr className="bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-700 text-white font-bold">
                        <td className="border border-white/20 px-2 py-3 text-center text-lg">🎯 รวมทั้งสิ้น</td>
                        <td colSpan={31} className="border border-white/20"></td>
                        <td className="border border-white/20 px-2 py-3 text-center text-xl">
                            {yearMonths.reduce((sum, month) => sum + getWorkingDaysCount(month.id), 0)}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}

function getDayTitle(dayOfWeek: number): string {
    const dayNames = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'];
    return dayNames[dayOfWeek];
}
