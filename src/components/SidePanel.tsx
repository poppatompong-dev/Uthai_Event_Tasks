'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/context';
import { Month, Day, Attachment, DayEntry } from '@/lib/types';

interface SidePanelProps {
    isOpen: boolean;
    onClose: () => void;
    onViewAttachments?: (attachments: Attachment[]) => void;
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

export default function SidePanel({ isOpen, onClose, onViewAttachments }: SidePanelProps) {
    const { months, days, selectedYear, isAdmin, refreshData } = useApp();
    const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
    const [editingDay, setEditingDay] = useState<string | null>(null);
    const [editEntries, setEditEntries] = useState<DayEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

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

    const expandAll = () => {
        setExpandedMonths(new Set(yearMonths.map((m) => m.id)));
    };

    const collapseAll = () => {
        setExpandedMonths(new Set());
    };

    const getMonthDays = (monthId: string): Day[] => {
        return days.filter((d) => d.monthId === monthId).sort((a, b) => a.date.localeCompare(b.date));
    };

    const getDayOfWeek = (dateStr: string): number => {
        const date = new Date(dateStr);
        return date.getDay();
    };

    const getDayName = (dayOfWeek: number): string => {
        const dayNames = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
        return dayNames[dayOfWeek];
    };

    const formatDate = (dateStr: string): string => {
        const [year, month, day] = dateStr.split('-');
        return `${parseInt(day)}`;
    };

    const hasActivity = (day: Day): boolean => {
        if (!day.entries?.length) return false;
        const detail = day.entries[0].detail;
        if (detail.includes('วันเสาร์') || detail.includes('วันอาทิตย์')) return false;
        return true;
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

    const deleteEntry = async (day: Day) => {
        if (!confirm('ต้องการลบกิจกรรมทั้งหมดของวันนี้หรือไม่?')) return;

        setIsLoading(true);
        try {
            const updatedDay: Day = {
                ...day,
                entries: [],
            };

            const response = await fetch('/api/days', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedDay),
            });

            if (response.ok) {
                await refreshData();
            }
        } catch (error) {
            console.error('Error deleting entries:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filterDays = (monthDays: Day[]): Day[] => {
        if (!searchQuery.trim()) return monthDays;
        return monthDays.filter(day => {
            const detail = day.entries?.map(e => e.detail + ' ' + e.responsible).join(' ') || '';
            return detail.toLowerCase().includes(searchQuery.toLowerCase());
        });
    };

    const getActivityStats = () => {
        let total = 0;
        let withActivity = 0;
        yearMonths.forEach(month => {
            const monthDays = getMonthDays(month.id);
            total += monthDays.length;
            monthDays.forEach(day => {
                if (hasActivity(day)) withActivity++;
            });
        });
        return { total, withActivity };
    };

    const stats = getActivityStats();

    return (
        <>
            {/* Overlay */}
            <div
                className={`side-panel-overlay ${isOpen ? 'open' : ''}`}
                onClick={onClose}
            />

            {/* Panel */}
            <div className={`side-panel ${isOpen ? 'open' : ''}`}>
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-6 py-4 text-white sticky top-0 z-20">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-3xl">📋</span>
                            <div>
                                <h2 className="text-xl font-bold">รายละเอียดกิจกรรม</h2>
                                <p className="text-sm opacity-80">จัดการกิจกรรมและผู้รับผิดชอบ</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <span className="text-2xl">✕</span>
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="flex gap-4 mt-4">
                        <div className="bg-white/20 px-4 py-2 rounded-lg">
                            <div className="text-2xl font-bold">{stats.total}</div>
                            <div className="text-xs opacity-80">วันทั้งหมด</div>
                        </div>
                        <div className="bg-white/20 px-4 py-2 rounded-lg">
                            <div className="text-2xl font-bold">{stats.withActivity}</div>
                            <div className="text-xs opacity-80">มีกิจกรรม</div>
                        </div>
                    </div>

                    {/* Search & Controls */}
                    <div className="mt-4 space-y-2">
                        <input
                            type="text"
                            placeholder="🔍 ค้นหากิจกรรม..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg bg-white/20 text-white placeholder-white/60 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={expandAll}
                                className="flex-1 px-3 py-1.5 bg-white/20 rounded-lg text-sm hover:bg-white/30 transition-colors"
                            >
                                📂 เปิดทั้งหมด
                            </button>
                            <button
                                onClick={collapseAll}
                                className="flex-1 px-3 py-1.5 bg-white/20 rounded-lg text-sm hover:bg-white/30 transition-colors"
                            >
                                📁 ปิดทั้งหมด
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                    {yearMonths.map((month) => {
                        const monthDays = filterDays(getMonthDays(month.id));
                        const activeDays = monthDays.filter(d => hasActivity(d));
                        const isExpanded = expandedMonths.has(month.id);

                        return (
                            <div key={month.id} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                <button
                                    className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-teal-500 to-blue-600 text-white hover:from-teal-600 hover:to-blue-700 transition-all"
                                    onClick={() => toggleMonth(month.id)}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl">📅</span>
                                        <span className="font-semibold">{month.name}</span>
                                        <span className="bg-white/20 px-2 py-0.5 rounded-full text-sm">
                                            {activeDays.length} กิจกรรม
                                        </span>
                                    </div>
                                    <span className={`text-xl transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                                        ▼
                                    </span>
                                </button>

                                {isExpanded && (
                                    <div className="divide-y divide-gray-100">
                                        {monthDays.map((day) => {
                                            const dayOfWeek = getDayOfWeek(day.date);
                                            const dayColorClass = dayColorClasses[dayOfWeek];
                                            const hasAttachments = (day.attachments?.length || 0) > 0;
                                            const isEditing = editingDay === day.id;
                                            const hasActivityFlag = hasActivity(day);

                                            if (isEditing && isAdmin) {
                                                return (
                                                    <div key={day.id} className="p-4 bg-blue-50">
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <span className={`px-2 py-1 rounded ${dayColorClass} text-sm`}>
                                                                {formatDate(day.date)} {getDayName(dayOfWeek)}
                                                            </span>
                                                            <span className="text-gray-500 text-sm">✏️ แก้ไขกิจกรรม</span>
                                                        </div>

                                                        <div className="space-y-3">
                                                            {editEntries.map((entry, idx) => (
                                                                <div key={entry.id} className="bg-white p-3 rounded-lg shadow-sm space-y-2">
                                                                    <div className="flex items-center justify-between">
                                                                        <span className="text-xs text-gray-500">กิจกรรมที่ {idx + 1}</span>
                                                                        <button
                                                                            onClick={() => removeEntry(idx)}
                                                                            className="text-red-500 hover:text-red-700 text-sm"
                                                                        >
                                                                            🗑️
                                                                        </button>
                                                                    </div>
                                                                    <input
                                                                        type="text"
                                                                        value={entry.detail}
                                                                        onChange={(e) => updateEntry(idx, 'detail', e.target.value)}
                                                                        placeholder="รายละเอียดกิจกรรม"
                                                                        className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
                                                                    />
                                                                    <input
                                                                        type="text"
                                                                        value={entry.responsible}
                                                                        onChange={(e) => updateEntry(idx, 'responsible', e.target.value)}
                                                                        placeholder="ผู้รับผิดชอบ"
                                                                        className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
                                                                    />
                                                                </div>
                                                            ))}

                                                            <button
                                                                onClick={addEntry}
                                                                className="w-full py-2 border-2 border-dashed border-teal-300 text-teal-600 rounded-lg hover:bg-teal-50 transition-colors text-sm"
                                                            >
                                                                ➕ เพิ่มกิจกรรม
                                                            </button>
                                                        </div>

                                                        <div className="flex gap-2 mt-4">
                                                            <button
                                                                onClick={() => saveChanges(day)}
                                                                disabled={isLoading}
                                                                className="flex-1 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 text-sm font-medium"
                                                            >
                                                                {isLoading ? '⏳ กำลังบันทึก...' : '💾 บันทึก'}
                                                            </button>
                                                            <button
                                                                onClick={cancelEditing}
                                                                className="flex-1 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 text-sm font-medium"
                                                            >
                                                                ยกเลิก
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            return (
                                                <div
                                                    key={day.id}
                                                    className={`p-3 hover:bg-gray-50 ${hasActivityFlag ? 'bg-amber-50/50' : ''}`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        {/* Date Badge */}
                                                        <div className={`px-2 py-1 rounded text-sm font-bold min-w-[50px] text-center ${dayColorClass}`}>
                                                            {formatDate(day.date)} {getDayName(dayOfWeek)}
                                                        </div>

                                                        {/* Content */}
                                                        <div className="flex-1 min-w-0">
                                                            {day.entries?.length ? (
                                                                <div className="space-y-1">
                                                                    {day.entries.map((entry, idx) => (
                                                                        <div key={idx} className="text-sm">
                                                                            <span className={hasActivityFlag ? 'text-amber-700 font-medium' : 'text-gray-700'}>
                                                                                {entry.detail}
                                                                            </span>
                                                                            {entry.responsible && (
                                                                                <span className="text-gray-500 text-xs ml-2">
                                                                                    👤 {entry.responsible}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <span className="text-gray-400 text-sm">-</span>
                                                            )}
                                                        </div>

                                                        {/* Actions */}
                                                        <div className="flex items-center gap-1 flex-shrink-0">
                                                            {hasAttachments && (
                                                                <button
                                                                    onClick={() => onViewAttachments && day.attachments && onViewAttachments(day.attachments)}
                                                                    className="p-1.5 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 text-xs"
                                                                    title="ดูไฟล์แนบ"
                                                                >
                                                                    📎 {day.attachments?.length}
                                                                </button>
                                                            )}
                                                            {isAdmin && (
                                                                <>
                                                                    <button
                                                                        onClick={() => startEditing(day)}
                                                                        className="p-1.5 bg-amber-100 text-amber-600 rounded hover:bg-amber-200 text-xs"
                                                                        title="แก้ไข"
                                                                    >
                                                                        ✏️
                                                                    </button>
                                                                    {day.entries?.length > 0 && (
                                                                        <button
                                                                            onClick={() => deleteEntry(day)}
                                                                            className="p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200 text-xs"
                                                                            title="ลบกิจกรรม"
                                                                        >
                                                                            🗑️
                                                                        </button>
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
    );
}
