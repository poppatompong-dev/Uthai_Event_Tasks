import { NextRequest, NextResponse } from 'next/server';
import { getDrive, FOLDER_ID } from '@/lib/google';
import { Readable } from 'stream';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';

// Maximum file size: 5MB after compression
const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

// Local upload directory (fallback)
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

// Try to import sharp, but handle if it fails
let sharp: typeof import('sharp') | null = null;
try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    sharp = require('sharp');
} catch {
    console.warn('Sharp module not available, server-side image compression disabled');
}

async function compressImage(buffer: Buffer, mimeType: string): Promise<Buffer> {
    if (!sharp || !mimeType.startsWith('image/')) {
        return buffer;
    }

    try {
        let sharpInstance = sharp(buffer);
        const metadata = await sharpInstance.metadata();

        // Resize if too large
        if (metadata.width && metadata.width > 2000) {
            sharpInstance = sharpInstance.resize(2000, undefined, { withoutEnlargement: true });
        } else if (metadata.height && metadata.height > 2000) {
            sharpInstance = sharpInstance.resize(undefined, 2000, { withoutEnlargement: true });
        }

        // Convert to JPEG with quality 85
        return await sharpInstance.jpeg({ quality: 85, mozjpeg: true }).toBuffer();
    } catch (error) {
        console.error('Image compression error:', error);
        return buffer;
    }
}

async function createThumbnail(buffer: Buffer, mimeType: string): Promise<Buffer | null> {
    if (!sharp || !mimeType.startsWith('image/')) {
        return null;
    }

    try {
        return await sharp(buffer)
            .resize(200, 200, { fit: 'cover' })
            .jpeg({ quality: 70 })
            .toBuffer();
    } catch (error) {
        console.error('Thumbnail creation error:', error);
        return null;
    }
}

function bufferToStream(buffer: Buffer): Readable {
    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    return readable;
}

// Ensure upload directory exists
async function ensureUploadDir() {
    try {
        await mkdir(UPLOAD_DIR, { recursive: true });
    } catch {
        // Directory already exists
    }
}

// Upload to local storage as fallback
async function uploadToLocal(buffer: Buffer, fileName: string, mimeType: string): Promise<{ id: string; url: string; thumbnailUrl: string }> {
    await ensureUploadDir();

    const timestamp = Date.now();
    const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fullFileName = `${timestamp}_${safeFileName}`;
    const filePath = path.join(UPLOAD_DIR, fullFileName);

    await writeFile(filePath, buffer);

    // Create thumbnail for images
    let thumbnailUrl = `/uploads/${fullFileName}`;
    if (mimeType.startsWith('image/')) {
        try {
            const thumbnail = await createThumbnail(buffer, mimeType);
            if (thumbnail) {
                const thumbFileName = `thumb_${fullFileName}`;
                const thumbPath = path.join(UPLOAD_DIR, thumbFileName);
                await writeFile(thumbPath, thumbnail);
                thumbnailUrl = `/uploads/${thumbFileName}`;
            }
        } catch {
            // Continue without thumbnail
        }
    }

    return {
        id: fullFileName,
        url: `/uploads/${fullFileName}`,
        thumbnailUrl,
    };
}

// Upload to Google Drive with improved error handling
async function uploadToGoogleDrive(buffer: Buffer, fileName: string, mimeType: string) {
    // Validate FOLDER_ID
    if (!FOLDER_ID) {
        throw new Error('GOOGLE_DRIVE_FOLDER_ID is not configured');
    }

    let drive;
    try {
        drive = getDrive();
    } catch (authError) {
        console.error('Google Drive authentication failed:', authError);
        throw new Error('Google Drive authentication failed. Please check service account credentials.');
    }

    const fileMetadata = {
        name: `${Date.now()}_${fileName}`,
        parents: [FOLDER_ID],
    };

    const media = {
        mimeType: mimeType,
        body: bufferToStream(buffer),
    };

    console.log(`Uploading to Google Drive: ${fileName} (${buffer.length} bytes)`);

    let uploadedFile;
    try {
        uploadedFile = await drive.files.create({
            requestBody: fileMetadata,
            media: media,
            fields: 'id, name, mimeType, size',
        });
    } catch (uploadError) {
        console.error('Google Drive upload error:', uploadError);
        const errorMessage = uploadError instanceof Error ? uploadError.message : 'Unknown upload error';
        throw new Error(`Failed to upload to Google Drive: ${errorMessage}`);
    }

    if (!uploadedFile.data.id) {
        throw new Error('No file ID returned from Google Drive');
    }

    console.log(`Uploaded file ID: ${uploadedFile.data.id}`);

    // Set public permissions
    try {
        await drive.permissions.create({
            fileId: uploadedFile.data.id,
            requestBody: {
                role: 'reader',
                type: 'anyone',
            },
        });
    } catch (permError) {
        console.warn('Failed to set public permissions:', permError);
        // Continue anyway - file is uploaded but may not be publicly accessible
    }

    // Generate direct view/download URL
    const fileUrl = `https://drive.google.com/uc?export=view&id=${uploadedFile.data.id}`;
    let thumbnailUrl = `https://lh3.googleusercontent.com/d/${uploadedFile.data.id}`;

    // Create thumbnail for images
    if (mimeType.startsWith('image/')) {
        try {
            const thumbnail = await createThumbnail(buffer, mimeType);
            if (thumbnail) {
                const thumbMetadata = {
                    name: `thumb_${Date.now()}_${fileName}`,
                    parents: [FOLDER_ID],
                };

                const thumbMedia = {
                    mimeType: 'image/jpeg',
                    body: bufferToStream(thumbnail),
                };

                const thumbFile = await drive.files.create({
                    requestBody: thumbMetadata,
                    media: thumbMedia,
                    fields: 'id',
                });

                if (thumbFile.data.id) {
                    await drive.permissions.create({
                        fileId: thumbFile.data.id,
                        requestBody: {
                            role: 'reader',
                            type: 'anyone',
                        },
                    });
                    thumbnailUrl = `https://lh3.googleusercontent.com/d/${thumbFile.data.id}`;
                }
            }
        } catch (thumbError) {
            console.warn('Thumbnail creation failed:', thumbError);
            // Continue without custom thumbnail
        }
    }

    return {
        id: uploadedFile.data.id,
        url: fileUrl,
        thumbnailUrl,
    };
}

export async function POST(request: NextRequest) {
    console.log('=== Upload API Called ===');

    try {
        let formData;
        try {
            formData = await request.formData();
        } catch (parseError) {
            console.error('Error parsing form data:', parseError);
            return NextResponse.json(
                { success: false, error: 'ไม่สามารถอ่านข้อมูลไฟล์ได้' },
                { status: 400 }
            );
        }

        const files = formData.getAll('files') as File[];

        if (!files || files.length === 0) {
            return NextResponse.json(
                { success: false, error: 'กรุณาเลือกไฟล์ที่ต้องการอัปโหลด' },
                { status: 400 }
            );
        }

        console.log(`Processing ${files.length} files`);

        const uploadedFiles = [];
        const errors: string[] = [];

        // Check if Google Drive is available
        let useGoogleDrive = true;
        let driveCheckError = '';

        if (!FOLDER_ID) {
            console.log('FOLDER_ID not configured, using local storage');
            useGoogleDrive = false;
            driveCheckError = 'GOOGLE_DRIVE_FOLDER_ID not set';
        } else {
            try {
                getDrive();
                console.log('Google Drive authentication successful');
            } catch (authError) {
                console.warn('Google Drive auth failed:', authError);
                useGoogleDrive = false;
                driveCheckError = authError instanceof Error ? authError.message : 'Auth failed';
            }
        }

        console.log(`Upload mode: ${useGoogleDrive ? 'Google Drive' : 'Local Storage'}`);
        if (!useGoogleDrive) {
            console.log(`Reason: ${driveCheckError}`);
        }

        for (const file of files) {
            try {
                // Validate file size
                if (file.size > MAX_SIZE_BYTES) {
                    errors.push(`ไฟล์ ${file.name} ใหญ่เกินไป (สูงสุด ${MAX_SIZE_MB}MB)`);
                    continue;
                }

                const arrayBuffer = await file.arrayBuffer();
                let fileBuffer: Buffer = Buffer.from(arrayBuffer);
                const mimeType = file.type || 'application/octet-stream';
                const fileName = file.name;

                console.log(`Processing: ${fileName}, size: ${fileBuffer.length} bytes, type: ${mimeType}`);

                // Compress image if possible (server-side)
                if (mimeType.startsWith('image/') && sharp) {
                    try {
                        const compressed = await compressImage(fileBuffer, mimeType);
                        if (compressed.length < fileBuffer.length) {
                            console.log(`Server compressed ${fileName}: ${fileBuffer.length} -> ${compressed.length} bytes`);
                            fileBuffer = compressed;
                        }
                    } catch (compressError) {
                        console.warn(`Server compression failed for ${fileName}:`, compressError);
                        // Continue with original
                    }
                }

                let result;

                if (useGoogleDrive) {
                    try {
                        result = await uploadToGoogleDrive(fileBuffer, fileName, mimeType);
                        console.log(`Google Drive upload success: ${fileName} -> ${result.url}`);
                    } catch (driveError) {
                        console.error('Google Drive upload failed:', driveError);
                        const errorMsg = driveError instanceof Error ? driveError.message : 'Unknown error';

                        // Try local fallback
                        console.log('Trying local storage fallback...');
                        try {
                            result = await uploadToLocal(fileBuffer, fileName, mimeType);
                            errors.push(`${fileName}: บันทึกในเครื่องแทน (Google Drive: ${errorMsg})`);
                        } catch (localError) {
                            console.error('Local fallback also failed:', localError);
                            errors.push(`${fileName}: ${errorMsg}`);
                            continue;
                        }
                    }
                } else {
                    result = await uploadToLocal(fileBuffer, fileName, mimeType);
                }

                uploadedFiles.push({
                    id: result.id,
                    name: fileName,
                    url: result.url,
                    thumbnailUrl: result.thumbnailUrl,
                    mimeType: mimeType,
                    size: fileBuffer.length,
                });

                console.log(`Uploaded: ${fileName} -> ${result.url}`);
            } catch (fileError) {
                console.error(`Error uploading ${file.name}:`, fileError);
                const errorMessage = fileError instanceof Error ? fileError.message : 'Unknown error';
                errors.push(`${file.name}: ${errorMessage}`);
            }
        }

        if (uploadedFiles.length === 0) {
            const errorDetail = errors.length > 0 ? errors.join('; ') : 'All uploads failed';
            console.error('All uploads failed:', errorDetail);

            return NextResponse.json(
                {
                    success: false,
                    error: 'ไม่สามารถอัปโหลดไฟล์ได้',
                    details: errorDetail
                },
                { status: 500 }
            );
        }

        console.log(`=== Upload Complete: ${uploadedFiles.length} files ===`);

        return NextResponse.json({
            success: true,
            files: uploadedFiles,
            partialErrors: errors.length > 0 ? errors : undefined,
        });
    } catch (error) {
        console.error('File upload error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'เกิดข้อผิดพลาดในการอัปโหลด กรุณาลองใหม่',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { fileId } = await request.json();

        if (!fileId) {
            return NextResponse.json(
                { success: false, error: 'File ID is required' },
                { status: 400 }
            );
        }

        // Check if it's a local file or Google Drive file
        if (fileId.includes('_') && !fileId.startsWith('http')) {
            // Local file
            try {
                const filePath = path.join(UPLOAD_DIR, fileId);
                await unlink(filePath);

                // Try to delete thumbnail too
                const thumbPath = path.join(UPLOAD_DIR, `thumb_${fileId}`);
                try {
                    await unlink(thumbPath);
                } catch {
                    // Thumbnail may not exist
                }
            } catch (unlinkError) {
                console.warn('Failed to delete local file:', unlinkError);
            }
        } else {
            // Google Drive file
            try {
                const drive = getDrive();
                await drive.files.delete({ fileId });
            } catch (driveError) {
                console.warn('Failed to delete from Google Drive:', driveError);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('File delete error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete file' },
            { status: 500 }
        );
    }
}
