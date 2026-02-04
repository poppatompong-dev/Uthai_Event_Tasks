'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Attachment } from '@/lib/types';

// Import browser-image-compression dynamically
let imageCompression: typeof import('browser-image-compression').default | null = null;

interface FileUploadProps {
    onFilesUploaded: (files: Attachment[]) => void;
    existingAttachments?: Attachment[];
    onRemoveAttachment?: (attachmentId: string) => void;
}

// Maximum file size after compression: 5000KB = 5MB
const MAX_SIZE_KB = 5000;
const MAX_SIZE_BYTES = MAX_SIZE_KB * 1024;

export default function FileUpload({ onFilesUploaded, existingAttachments = [], onRemoveAttachment }: FileUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadStatus, setUploadStatus] = useState('');
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

    // Advanced image compression using browser-image-compression library
    const compressImageAdvanced = async (file: File): Promise<File> => {
        // Only compress images
        if (!file.type.startsWith('image/')) {
            return file;
        }

        // If already small enough, return as-is
        if (file.size <= MAX_SIZE_BYTES) {
            return file;
        }

        try {
            // Dynamically import the compression library
            if (!imageCompression) {
                const module = await import('browser-image-compression');
                imageCompression = module.default;
            }

            const options = {
                maxSizeMB: MAX_SIZE_KB / 1024, // 5MB
                maxWidthOrHeight: 2000,
                useWebWorker: true,
                fileType: 'image/jpeg' as const,
                initialQuality: 0.85,
            };

            console.log(`Compressing ${file.name}: ${(file.size / 1024).toFixed(0)}KB`);
            const compressedFile = await imageCompression(file, options);
            console.log(`Compressed to: ${(compressedFile.size / 1024).toFixed(0)}KB`);

            return compressedFile;
        } catch (error) {
            console.warn('Advanced compression failed, trying canvas fallback:', error);
            return compressImageCanvas(file);
        }
    };

    // Fallback canvas-based compression
    const compressImageCanvas = async (file: File): Promise<File> => {
        if (!file.type.startsWith('image/') || file.size <= MAX_SIZE_BYTES) {
            return file;
        }

        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                let { width, height } = img;
                const maxDim = 2000;

                // Resize if too large
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

                // Progressive quality reduction until size is acceptable
                let quality = 0.9;
                const tryCompress = () => {
                    canvas.toBlob(
                        (blob) => {
                            if (blob && (blob.size <= MAX_SIZE_BYTES || quality <= 0.1)) {
                                const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
                                    type: 'image/jpeg'
                                });
                                console.log(`Canvas compressed: ${(file.size / 1024).toFixed(0)}KB -> ${(compressedFile.size / 1024).toFixed(0)}KB`);
                                resolve(compressedFile);
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

            img.onerror = () => {
                console.warn('Image load failed, using original file');
                resolve(file);
            };

            img.src = URL.createObjectURL(file);
        });
    };

    const handleUpload = async (files: FileList) => {
        if (!files.length) return;

        setIsUploading(true);
        setUploadProgress(0);
        setUploadStatus('กำลังเตรียมไฟล์...');

        try {
            const formData = new FormData();
            let processedCount = 0;
            const totalFiles = files.length;
            const skippedFiles: string[] = [];

            for (const file of Array.from(files)) {
                setUploadStatus(`กำลังประมวลผล ${file.name}...`);

                // Check file size before processing (max 25MB for raw file)
                if (file.size > 25 * 1024 * 1024) {
                    skippedFiles.push(`${file.name} (ไฟล์ใหญ่เกินไป)`);
                    continue;
                }

                try {
                    // Compress image files
                    let processedFile = file;
                    if (file.type.startsWith('image/')) {
                        setUploadStatus(`กำลังบีบอัด ${file.name}...`);
                        processedFile = await compressImageAdvanced(file);
                    }

                    formData.append('files', processedFile);
                    console.log(`Added to upload: ${processedFile.name} (${(processedFile.size / 1024).toFixed(0)}KB)`);
                } catch (compressionError) {
                    console.warn(`Compression failed for ${file.name}, using original:`, compressionError);
                    formData.append('files', file);
                }

                processedCount++;
                setUploadProgress((processedCount / totalFiles) * 40);
            }

            // Check if any files to upload
            const filesToUpload = formData.getAll('files');
            if (filesToUpload.length === 0) {
                throw new Error('ไม่มีไฟล์ที่สามารถอัปโหลดได้');
            }

            setUploadStatus(`กำลังอัปโหลด ${filesToUpload.length} ไฟล์ไปยัง Google Drive...`);
            setUploadProgress(50);

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            setUploadProgress(90);

            const data = await response.json();

            if (!response.ok) {
                console.error('Upload API error:', data);
                throw new Error(data.error || data.details || 'เกิดข้อผิดพลาดในการอัปโหลด');
            }

            setUploadProgress(100);
            setUploadStatus('อัปโหลดสำเร็จ!');

            if (data.success && data.files) {
                onFilesUploaded(data.files);

                // Show summary
                let message = `✅ อัปโหลดสำเร็จ ${data.files.length} ไฟล์`;
                if (skippedFiles.length > 0) {
                    message += `\n\n⚠️ ข้ามไฟล์:\n${skippedFiles.join('\n')}`;
                }
                if (data.partialErrors && data.partialErrors.length > 0) {
                    message += `\n\n⚠️ ข้อผิดพลาดบางส่วน:\n${data.partialErrors.join('\n')}`;
                }

                if (skippedFiles.length > 0 || (data.partialErrors && data.partialErrors.length > 0)) {
                    alert(message);
                }
            }
        } catch (error) {
            console.error('Upload error:', error);
            const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
            setUploadStatus(`❌ ${errorMessage}`);
            alert(`❌ อัปโหลดไม่สำเร็จ\n\n${errorMessage}\n\nกรุณาตรวจสอบ:\n• การเชื่อมต่อ Google Drive\n• Environment Variables ใน Vercel\n• สิทธิ์ของ Service Account`);
        } finally {
            setTimeout(() => {
                setIsUploading(false);
                setUploadProgress(0);
                setUploadStatus('');
            }, 1500);
        }
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleUpload(e.dataTransfer.files);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
                        <p className="text-gray-700 font-medium">{uploadStatus}</p>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                            <div
                                className="bg-gradient-to-r from-blue-500 to-teal-500 h-3 rounded-full transition-all duration-300"
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
                        <p className="text-sm text-gray-500 mb-2">
                            รองรับไฟล์: รูปภาพ, PDF, Word, Excel, PowerPoint
                        </p>
                        <div className="text-xs text-gray-400 space-y-1">
                            <p>📌 อัปโหลดได้ไม่จำกัดจำนวนไฟล์</p>
                            <p>📌 ไฟล์รูปจะถูกบีบอัดอัตโนมัติไม่เกิน {MAX_SIZE_KB / 1000}MB</p>
                            <p>📌 ไฟล์จะถูกบันทึกไปยัง Google Drive</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="mt-4 px-6 py-2.5 bg-gradient-to-r from-blue-500 to-teal-500 text-white rounded-lg hover:from-blue-600 hover:to-teal-600 transition-all shadow-md hover:shadow-lg font-medium"
                        >
                            📎 เลือกไฟล์
                        </button>
                    </>
                )}
            </div>

            {/* Existing Attachments */}
            {existingAttachments.length > 0 && (
                <div className="space-y-2">
                    <h4 className="font-medium text-gray-700 flex items-center gap-2">
                        <span>📎</span>
                        ไฟล์แนบ ({existingAttachments.length} ไฟล์)
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {existingAttachments.map((attachment) => (
                            <div
                                key={attachment.id}
                                className="relative group border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow bg-white"
                            >
                                {attachment.mimeType.startsWith('image/') ? (
                                    <a
                                        href={attachment.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block"
                                    >
                                        <img
                                            src={attachment.thumbnailUrl || attachment.url}
                                            alt={attachment.name}
                                            className="w-full h-24 object-cover hover:opacity-90 transition-opacity"
                                            loading="lazy"
                                        />
                                    </a>
                                ) : (
                                    <a
                                        href={attachment.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full h-24 flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-colors"
                                    >
                                        <span className="text-4xl">{getFileIcon(attachment.mimeType)}</span>
                                    </a>
                                )}
                                <div className="p-2">
                                    <p className="text-xs truncate text-gray-600" title={attachment.name}>
                                        {attachment.name}
                                    </p>
                                    <p className="text-xs text-gray-400">{formatFileSize(attachment.size)}</p>
                                </div>
                                {onRemoveAttachment && (
                                    <button
                                        onClick={() => onRemoveAttachment(attachment.id)}
                                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 flex items-center justify-center"
                                        title="ลบไฟล์นี้"
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
