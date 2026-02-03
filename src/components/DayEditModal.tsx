'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/context';
import { Day, Month, Attachment, DayEntry } from '@/lib/types';
import FileUpload from './FileUpload';

interface DayEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    day: Day | null;
    month: Month | null;
}

export default function DayEditModal({ isOpen, onClose, day, month }: DayEditModalProps) {
    const { days, setDays, refreshData } = useApp();
    const [entries, setEntries] = useState<DayEntry[]>(day?.entries || []);
    const [attachments, setAttachments] = useState<Attachment[]>(day?.attachments || []);
    const [isLoading, setIsLoading] = useState(false);

    React.useEffect(() => {
        if (day) {
            setEntries(day.entries || []);
            setAttachments(day.attachments || []);
        }
    }, [day]);

    const handleAddEntry = () => {
        setEntries([
            ...entries,
            { id: Date.now().toString(), detail: '', responsible: '' },
        ]);
    };

    const handleUpdateEntry = (index: number, field: keyof DayEntry, value: string) => {
        const newEntries = [...entries];
        newEntries[index] = { ...newEntries[index], [field]: value };
        setEntries(newEntries);
    };

    const handleRemoveEntry = (index: number) => {
        setEntries(entries.filter((_, i) => i !== index));
    };

    const handleFilesUploaded = (files: Attachment[]) => {
        setAttachments([...attachments, ...files]);
    };

    const handleRemoveAttachment = async (attachmentId: string) => {
        try {
            await fetch('/api/upload', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileId: attachmentId }),
            });
            setAttachments(attachments.filter((a) => a.id !== attachmentId));
        } catch (error) {
            console.error('Error removing attachment:', error);
        }
    };

    const handleSave = async () => {
        if (!day) return;

        setIsLoading(true);
        try {
            const updatedDay: Day = {
                ...day,
                entries,
                attachments,
            };

            const response = await fetch('/api/days', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedDay),
            });

            if (response.ok) {
                await refreshData();
                onClose();
            }
        } catch (error) {
            console.error('Error saving day:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen || !day || !month) return null;

    const formatDate = () => {
        const [year, monthNum, dayNum] = day.date.split('-');
        const thaiYear = parseInt(year) + 543;
        const dayNames = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
        const date = new Date(day.date);
        return `วัน${dayNames[date.getDay()]}ที่ ${parseInt(dayNum)} ${month.name}`;
    };

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
                className="modal-content-lg"
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: 'white',
                    borderRadius: '20px',
                    maxWidth: '700px',
                    width: '100%',
                    maxHeight: '90vh',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                }}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-teal-500 to-blue-600 px-6 py-4 text-white">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        ✏️ แก้ไขข้อมูลวัน
                    </h2>
                    <p className="text-white/80 mt-1">{formatDate()}</p>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Entries */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-gray-700">รายละเอียดกิจกรรม</h3>
                            <button
                                type="button"
                                onClick={handleAddEntry}
                                className="px-3 py-1 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-colors"
                            >
                                ➕ เพิ่มกิจกรรม
                            </button>
                        </div>

                        {entries.length === 0 ? (
                            <p className="text-gray-500 text-sm text-center py-4 bg-gray-50 rounded-lg">
                                ยังไม่มีกิจกรรม - คลิก "เพิ่มกิจกรรม" เพื่อเริ่มต้น
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {entries.map((entry, index) => (
                                    <div key={entry.id} className="p-4 bg-gray-50 rounded-xl space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-500">กิจกรรมที่ {index + 1}</span>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveEntry(index)}
                                                className="text-red-500 hover:text-red-700 text-sm"
                                            >
                                                🗑️ ลบ
                                            </button>
                                        </div>
                                        <input
                                            type="text"
                                            value={entry.detail}
                                            onChange={(e) => handleUpdateEntry(index, 'detail', e.target.value)}
                                            placeholder="รายละเอียดกิจกรรม"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                        />
                                        <input
                                            type="text"
                                            value={entry.responsible}
                                            onChange={(e) => handleUpdateEntry(index, 'responsible', e.target.value)}
                                            placeholder="ผู้รับผิดชอบ"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* File Upload */}
                    <div>
                        <h3 className="font-semibold text-gray-700 mb-3">ไฟล์แนบ</h3>
                        <FileUpload
                            onFilesUploaded={handleFilesUploaded}
                            existingAttachments={attachments}
                            onRemoveAttachment={handleRemoveAttachment}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t flex gap-3">
                    <button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="flex-1 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                    >
                        {isLoading ? '⏳ กำลังบันทึก...' : '💾 บันทึก'}
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all"
                    >
                        ยกเลิก
                    </button>
                </div>
            </div>
        </div>
    );
}
