'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/context';
import { Month, Day, Attachment, DayEntry } from '@/lib/types';

interface ActivitiesDetailProps {
    onViewAttachments?: (attachments: Attachment[]) => void;
    onEditDay?: (day: Day, month: Month) => void;
}

const dayColorClasses: Record<number, string> = {
    0: 'activities-sunday',
    1: 'activities-monday',
    2: 'activities-tuesday',
    3: 'activities-wednesday',
    4: 'activities-thursday',
    5: 'activities-friday',
    6: 'activities-saturday',
};

export default function ActivitiesDetail({ onViewAttachments, onEditDay }: ActivitiesDetailProps) {
    const { months, days, selectedYear, isAdmin, refreshData } = useApp();
    const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
    const [editingDay, setEditingDay] = useState<string | null>(null);
    const [editEntries, setEditEntries] = useState<DayEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const yearMonths = months.filter((m) => m.yearId === selectedYear);

    const toggleMonth = (monthId: string) => {
        const newExpanded = new Set(expandedMonths);
        if (newExpanded.has(monthId)) {
            newExpanded.delete(monthId);
        } else {
            newExpanded.add(monthId);
        }
        setExpandedMonths(newExpanded);
    };

    const getMonthDays = (monthId: string): Day[] => {
        return days.filter((d) => d.monthId === monthId).sort((a, b) => a.date.localeCompare(b.date));
    };

    const getDayOfWeek = (dateStr: string): number => {
        const date = new Date(dateStr);
        return date.getDay();
    };

    const getDayName = (dayOfWeek: number): string => {
        const dayNames = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
        return dayNames[dayOfWeek];
    };

    const formatDate = (dateStr: string): string => {
        const [year, month, day] = dateStr.split('-');
        return `${parseInt(day)}`;
    };

    // Check if it's a real activity (not just weekend marking)
    const hasRealActivity = (day: Day): boolean => {
        if (!day.entries?.length) return false;
        const detail = day.entries[0].detail;
        if (detail.includes('วันเสาร์') || detail.includes('วันอาทิตย์')) return false;
        return true;
    };

    const getActivityCount = (monthDays: Day[]): number => {
        return monthDays.filter(d => hasRealActivity(d)).length;
    };

    const startEditing = (day: Day) => {
        setEditingDay(day.id);
        setEditEntries(day.entries?.length ? [...day.entries] : [{ id: Date.now().toString(), detail: '', responsible: '' }]);
    };

    const cancelEditing = () => {
        setEditingDay(null);
        setEditEntries([]);
    };

    const addEntry = () => {
        setEditEntries([...editEntries, { id: Date.now().toString(), detail: '', responsible: '' }]);
    };

    const updateEntry = (index: number, field: keyof DayEntry, value: string) => {
        const newEntries = [...editEntries];
        newEntries[index] = { ...newEntries[index], [field]: value };
        setEditEntries(newEntries);
    };

    const removeEntry = (index: number) => {
        setEditEntries(editEntries.filter((_, i) => i !== index));
    };

    const saveChanges = async (day: Day) => {
        setIsLoading(true);
        try {
            const filteredEntries = editEntries.filter(e => e.detail.trim() !== '');
            const updatedDay: Day = {
                ...day,
                entries: filteredEntries,
            };

            const response = await fetch('/api/days', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedDay),
            });

            if (response.ok) {
                await refreshData();
                setEditingDay(null);
                setEditEntries([]);
            }
        } catch (error) {
            console.error('Error saving day:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            {yearMonths.map((month) => {
                const monthDays = getMonthDays(month.id);
                const activityCount = getActivityCount(monthDays);
                const isExpanded = expandedMonths.has(month.id);

                return (
                    <div key={month.id} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        <button
                            className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-teal-500 to-blue-600 text-white hover:from-teal-600 hover:to-blue-700 transition-all"
                            onClick={() => toggleMonth(month.id)}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-xl">📅</span>
                                <span className="font-semibold text-lg">{month.name}</span>
                                <span className="bg-white/20 px-2 py-1 rounded-full text-sm">
                                    {activityCount} กิจกรรม ✨
                                </span>
                            </div>
                            <span className="text-2xl transition-transform duration-300" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                                ▼
                            </span>
                        </button>

                        {isExpanded && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="px-4 py-2 text-left w-20">วันที่</th>
                                            <th className="px-4 py-2 text-left w-24">วัน</th>
                                            <th className="px-4 py-2 text-left">รายละเอียด</th>
                                            <th className="px-4 py-2 text-left">ผู้รับผิดชอบ</th>
                                            <th className="px-4 py-2 text-center w-24">ไฟล์แนบ</th>
                                            {isAdmin && <th className="px-4 py-2 text-center w-32">จัดการ</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {monthDays.map((day) => {
                                            const dayOfWeek = getDayOfWeek(day.date);
                                            const dayColorClass = dayColorClasses[dayOfWeek];
                                            const hasAttachments = (day.attachments?.length || 0) > 0;
                                            const isEditing = editingDay === day.id;
                                            const isActivity = hasRealActivity(day);
                                            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                                            if (isEditing && isAdmin) {
                                                return (
                                                    <tr key={day.id} className="border-b border-gray-100 bg-blue-50">
                                                        <td className={`px-4 py-3 font-bold text-center ${dayColorClass}`}>
                                                            {formatDate(day.date)}
                                                        </td>
                                                        <td className={`px-4 py-3 ${dayColorClass}`}>
                                                            {getDayName(dayOfWeek)}
                                                        </td>
                                                        <td className="px-4 py-3" colSpan={2}>
                                                            <div className="space-y-2">
                                                                {editEntries.map((entry, idx) => (
                                                                    <div key={entry.id} className="flex gap-2 items-center">
                                                                        <input
                                                                            type="text"
                                                                            value={entry.detail}
                                                                            onChange={(e) => updateEntry(idx, 'detail', e.target.value)}
                                                                            placeholder="รายละเอียด"
                                                                            className="flex-1 px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
                                                                        />
                                                                        <input
                                                                            type="text"
                                                                            value={entry.responsible}
                                                                            onChange={(e) => updateEntry(idx, 'responsible', e.target.value)}
                                                                            placeholder="ผู้รับผิดชอบ"
                                                                            className="w-32 px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
                                                                        />
                                                                        <button
                                                                            onClick={() => removeEntry(idx)}
                                                                            className="text-red-500 hover:text-red-700 px-2"
                                                                            title="ลบ"
                                                                        >
                                                                            ✕
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                                <button
                                                                    onClick={addEntry}
                                                                    className="text-sm text-teal-600 hover:text-teal-800"
                                                                >
                                                                    ➕ เพิ่มรายการ
                                                                </button>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">-</td>
                                                        <td className="px-4 py-3 text-center">
                                                            <div className="flex gap-1 justify-center">
                                                                <button
                                                                    onClick={() => saveChanges(day)}
                                                                    disabled={isLoading}
                                                                    className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 disabled:opacity-50"
                                                                >
                                                                    {isLoading ? '...' : '✓'}
                                                                </button>
                                                                <button
                                                                    onClick={cancelEditing}
                                                                    className="px-2 py-1 bg-gray-400 text-white rounded text-xs hover:bg-gray-500"
                                                                >
                                                                    ✕
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            }

                                            return (
                                                <tr
                                                    key={day.id}
                                                    className={`border-b border-gray-100 hover:bg-gray-50 ${isActivity ? 'bg-amber-50/50' : ''}`}
                                                >
                                                    <td className={`px-4 py-3 font-bold text-center ${dayColorClass}`}>
                                                        {formatDate(day.date)}
                                                    </td>
                                                    <td className={`px-4 py-3 ${dayColorClass}`}>
                                                        {getDayName(dayOfWeek)}
                                                        {isWeekend && <span className="ml-1 text-xs opacity-70">🌟</span>}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {day.entries?.map((entry, idx) => (
                                                            <div key={idx} className={`mb-1 last:mb-0 ${isActivity ? 'text-amber-700 font-medium' : ''}`}>
                                                                {entry.detail}
                                                            </div>
                                                        )) || <span className="text-gray-400">-</span>}
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-600">
                                                        {day.entries?.map((entry, idx) => (
                                                            <div key={idx} className="mb-1 last:mb-0">
                                                                {entry.responsible ? (
                                                                    <span className="inline-flex items-center gap-1">
                                                                        👤 {entry.responsible}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-gray-400">-</span>
                                                                )}
                                                            </div>
                                                        )) || <span className="text-gray-400">-</span>}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        {hasAttachments ? (
                                                            <button
                                                                onClick={() => onViewAttachments && day.attachments && onViewAttachments(day.attachments)}
                                                                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-xs"
                                                            >
                                                                📎 {day.attachments?.length}
                                                            </button>
                                                        ) : (
                                                            <span className="text-gray-400">-</span>
                                                        )}
                                                    </td>
                                                    {isAdmin && (
                                                        <td className="px-4 py-3 text-center">
                                                            <button
                                                                onClick={() => startEditing(day)}
                                                                className="px-3 py-1 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-xs"
                                                            >
                                                                ✏️ แก้ไข
                                                            </button>
                                                        </td>
                                                    )}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
