'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Attachment } from '@/lib/types';

interface FileUploadProps {
    onFilesUploaded: (files: Attachment[]) => void;
    existingAttachments?: Attachment[];
    onRemoveAttachment?: (attachmentId: string) => void;
}

export default function FileUpload({ onFilesUploaded, existingAttachments = [], onRemoveAttachment }: FileUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const compressImageClient = async (file: File): Promise<File> => {
        const maxSize = 5000 * 1024; // 5000KB

        if (!file.type.startsWith('image/') || file.size <= maxSize) {
            return file;
        }

        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                let { width, height } = img;
                const maxDim = 2000;

                if (width > maxDim || height > maxDim) {
                    if (width > height) {
                        height = (height / width) * maxDim;
                        width = maxDim;
                    } else {
                        width = (width / height) * maxDim;
                        height = maxDim;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                ctx?.drawImage(img, 0, 0, width, height);

                let quality = 0.9;
                const tryCompress = () => {
                    canvas.toBlob(
                        (blob) => {
                            if (blob && (blob.size <= maxSize || quality <= 0.1)) {
                                resolve(new File([blob], file.name, { type: 'image/jpeg' }));
                            } else {
                                quality -= 0.1;
                                tryCompress();
                            }
                        },
                        'image/jpeg',
                        quality
                    );
                };
                tryCompress();
            };

            img.src = URL.createObjectURL(file);
        });
    };

    const handleUpload = async (files: FileList) => {
        if (!files.length) return;

        setIsUploading(true);
        setUploadProgress(0);

        try {
            const formData = new FormData();
            let processedCount = 0;

            for (const file of Array.from(files)) {
                // Check file size before upload (max 25MB)
                if (file.size > 25 * 1024 * 1024) {
                    alert(`ไฟล์ ${file.name} มีขนาดใหญ่เกินไป (สูงสุด 25MB)`);
                    continue;
                }

                try {
                    const compressedFile = await compressImageClient(file);
                    formData.append('files', compressedFile);
                } catch {
                    // If compression fails, use original file
                    formData.append('files', file);
                }
                processedCount++;
                setUploadProgress((processedCount / files.length) * 50);
            }

            // Check if any files to upload
            if (formData.getAll('files').length === 0) {
                throw new Error('ไม่มีไฟล์ที่สามารถอัปโหลดได้');
            }

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            setUploadProgress(90);

            const data = await response.json();

            if (!response.ok) {
                // Show detailed error from API
                throw new Error(data.error || 'เกิดข้อผิดพลาดในการอัปโหลด');
            }

            setUploadProgress(100);

            if (data.success && data.files) {
                onFilesUploaded(data.files);

                // Show partial errors if any
                if (data.partialErrors && data.partialErrors.length > 0) {
                    alert(`อัปโหลดสำเร็จ ${data.files.length} ไฟล์\n\nข้อผิดพลาดบางส่วน:\n${data.partialErrors.join('\n')}`);
                }
            }
        } catch (error) {
            console.error('Upload error:', error);
            const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
            alert(`❌ ${errorMessage}\n\nกรุณาลองใหม่อีกครั้ง หรือตรวจสอบการเชื่อมต่อ Google Drive`);
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleUpload(e.dataTransfer.files);
        }
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleUpload(e.target.files);
        }
    };

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

    return (
        <div className="space-y-4">
            {/* Upload Area */}
            <div
                className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all ${dragActive
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                    }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                />

                {isUploading ? (
                    <div className="space-y-3">
                        <div className="text-4xl animate-bounce">📤</div>
                        <p className="text-gray-600">กำลังอัปโหลด...</p>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-blue-500 h-2 rounded-full transition-all"
                                style={{ width: `${uploadProgress}%` }}
                            />
                        </div>
                        <p className="text-sm text-gray-500">{uploadProgress.toFixed(0)}%</p>
                    </div>
                ) : (
                    <>
                        <div className="text-5xl mb-3">📁</div>
                        <p className="text-gray-700 font-medium mb-2">
                            ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์
                        </p>
                        <p className="text-sm text-gray-500 mb-3">
                            รองรับไฟล์: รูปภาพ, PDF, Word, Excel, PowerPoint
                        </p>
                        <p className="text-xs text-gray-400">
                            ไฟล์รูปจะถูกบีบอัดอัตโนมัติไม่เกิน 5MB
                        </p>
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="mt-4 px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg"
                        >
                            เลือกไฟล์
                        </button>
                    </>
                )}
            </div>

            {/* Existing Attachments */}
            {existingAttachments.length > 0 && (
                <div className="space-y-2">
                    <h4 className="font-medium text-gray-700">ไฟล์แนบ ({existingAttachments.length})</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {existingAttachments.map((attachment) => (
                            <div
                                key={attachment.id}
                                className="relative group border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                            >
                                {attachment.mimeType.startsWith('image/') ? (
                                    <img
                                        src={attachment.thumbnailUrl || attachment.url}
                                        alt={attachment.name}
                                        className="w-full h-24 object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-24 flex items-center justify-center bg-gray-100">
                                        <span className="text-4xl">{getFileIcon(attachment.mimeType)}</span>
                                    </div>
                                )}
                                <div className="p-2">
                                    <p className="text-xs truncate text-gray-600">{attachment.name}</p>
                                    <p className="text-xs text-gray-400">{formatFileSize(attachment.size)}</p>
                                </div>
                                {onRemoveAttachment && (
                                    <button
                                        onClick={() => onRemoveAttachment(attachment.id)}
                                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
