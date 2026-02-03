'use client';

import React, { useState } from 'react';
import { Attachment } from '@/lib/types';

interface AttachmentGalleryProps {
    attachments: Attachment[];
    isOpen: boolean;
    onClose: () => void;
}

export default function AttachmentGallery({ attachments, isOpen, onClose }: AttachmentGalleryProps) {
    const [selectedIndex, setSelectedIndex] = useState(0);

    if (!isOpen) return null;

    const getFileIcon = (mimeType: string) => {
        if (mimeType.startsWith('image/')) return '🖼️';
        if (mimeType.includes('pdf')) return '📄';
        if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
        if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
        if (mimeType.includes('video')) return '🎬';
        if (mimeType.includes('audio')) return '🎵';
        return '📎';
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const currentAttachment = attachments[selectedIndex];

    const goNext = () => {
        setSelectedIndex((prev) => (prev + 1) % attachments.length);
    };

    const goPrev = () => {
        setSelectedIndex((prev) => (prev - 1 + attachments.length) % attachments.length);
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
                background: 'rgba(0, 0, 0, 0.85)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 99999,
                padding: '16px',
            }}
        >
            <div
                className="relative max-w-5xl w-full max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-teal-500 to-blue-600 text-white">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">📎</span>
                        <h3 className="font-semibold text-lg">ไฟล์แนบ ({attachments.length} ไฟล์)</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors text-xl"
                    >
                        ✕
                    </button>
                </div>

                {/* Main View */}
                <div className="relative h-[60vh] bg-gray-900 flex items-center justify-center">
                    {currentAttachment.mimeType.startsWith('image/') ? (
                        <img
                            src={currentAttachment.url}
                            alt={currentAttachment.name}
                            className="max-w-full max-h-full object-contain"
                        />
                    ) : (
                        <div className="text-center text-white">
                            <span className="text-8xl block mb-4">{getFileIcon(currentAttachment.mimeType)}</span>
                            <p className="text-lg">{currentAttachment.name}</p>
                            <a
                                href={currentAttachment.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block mt-4 px-6 py-2 bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
                            >
                                ดาวน์โหลด / เปิดไฟล์
                            </a>
                        </div>
                    )}

                    {/* Navigation Arrows */}
                    {attachments.length > 1 && (
                        <>
                            <button
                                onClick={goPrev}
                                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/40 transition-colors text-white text-2xl"
                            >
                                ◀
                            </button>
                            <button
                                onClick={goNext}
                                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/40 transition-colors text-white text-2xl"
                            >
                                ▶
                            </button>
                        </>
                    )}
                </div>

                {/* Thumbnails */}
                <div className="p-4 bg-gray-100">
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {attachments.map((attachment, index) => (
                            <button
                                key={attachment.id}
                                onClick={() => setSelectedIndex(index)}
                                className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${index === selectedIndex
                                    ? 'border-blue-500 ring-2 ring-blue-300'
                                    : 'border-gray-300 hover:border-gray-400'
                                    }`}
                            >
                                {attachment.mimeType.startsWith('image/') ? (
                                    <img
                                        src={attachment.thumbnailUrl || attachment.url}
                                        alt={attachment.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                        <span className="text-3xl">{getFileIcon(attachment.mimeType)}</span>
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                        <strong>{currentAttachment.name}</strong>
                        <span className="mx-2">•</span>
                        <span>{formatFileSize(currentAttachment.size)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
