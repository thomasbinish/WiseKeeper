"use client";

import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, FileText, Image as ImageIcon } from 'lucide-react';
import { fileStorage } from '@/lib/fileStorage';
import { Attachment } from '@/types';

interface FileUploaderProps {
    onUpload: (attachmentId: string) => void;
    onRemove: (attachmentId: string) => void;
    attachments: string[]; // Array of attachment IDs
}

export function FileUploader({ onUpload, onRemove, attachments }: FileUploaderProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<Map<string, File>>(new Map());

    // Load file metadata on mount or when attachments change
    // Note: In a real app, we might want to store metadata separately in localStorage
    // For now, we'll just show the ID or a generic name since we only store blobs in IndexedDB
    // To improve this, we should store Attachment metadata in localStorage alongside the transaction

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setIsUploading(true);
            try {
                const file = e.target.files[0];
                const id = await fileStorage.saveFile(file);

                // Store file in local state for preview (optional, if we want to show name immediately)
                setUploadedFiles(prev => new Map(prev).set(id, file));

                onUpload(id);
            } catch (error) {
                console.error("Upload failed:", error);
            } finally {
                setIsUploading(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        }
    };

    const handleRemove = async (id: string) => {
        try {
            await fileStorage.deleteFile(id);
            onRemove(id);
            setUploadedFiles(prev => {
                const next = new Map(prev);
                next.delete(id);
                return next;
            });
        } catch (error) {
            console.error("Delete failed:", error);
        }
    };

    return (
        <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
                {attachments.map(id => (
                    <div key={id} className="flex items-center gap-2 bg-muted p-2 rounded-md border">
                        <FileText className="h-4 w-4 text-blue-500" />
                        <span className="text-xs font-mono truncate max-w-[100px]">{id}</span>
                        <button
                            onClick={() => handleRemove(id)}
                            className="text-muted-foreground hover:text-destructive"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </div>
                ))}
            </div>

            <div className="flex items-center gap-2">
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*,application/pdf"
                    onChange={handleFileSelect}
                />
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                >
                    <Upload className="h-4 w-4 mr-2" />
                    {isUploading ? 'Uploading...' : 'Attach Bill'}
                </Button>
                <span className="text-xs text-muted-foreground">
                    (Images or PDF)
                </span>
            </div>
        </div>
    );
}
