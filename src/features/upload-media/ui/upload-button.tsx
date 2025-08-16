'use client';

import React, { useRef } from 'react';
import { Button } from '../../../shared/ui';
import { APP_CONFIG } from '../../../shared/config';
import { useUploadMedia } from '../api';
import { useUploadStore } from '../model';
import { generateId } from '../../../shared/lib';

interface UploadButtonProps {
  albumId?: string;
  multiple?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children?: React.ReactNode;
  className?: string;
}

export function UploadButton({
  albumId,
  multiple = true,
  variant = 'primary',
  size = 'md',
  children = '파일 업로드',
  className,
}: UploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addUpload, updateUpload, setUploading } = useUploadStore();
  const uploadMutation = useUploadMedia();

  const acceptedTypes = [
    ...APP_CONFIG.supportedFormats.images.map(ext => `.${ext}`),
    ...APP_CONFIG.supportedFormats.videos.map(ext => `.${ext}`),
  ].join(',');

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setUploading(true);

    // Add files to upload queue
    const uploadProgresses = files.map(file => ({
      fileId: generateId(),
      filename: file.name,
      progress: 0,
      status: 'pending' as const,
    }));

    uploadProgresses.forEach(addUpload);

    try {
      await uploadMutation.mutateAsync({
        files,
        albumId,
        onProgress: (filename, progress) => {
          const upload = uploadProgresses.find(u => u.filename === filename);
          if (upload) {
            updateUpload(upload.fileId, {
              progress,
              status: progress === 100 ? 'processing' : 'uploading',
            });
          }
        },
      });

      // Mark all as completed
      uploadProgresses.forEach(upload => {
        updateUpload(upload.fileId, {
          progress: 100,
          status: 'completed',
        });
      });
    } catch (error) {
      // Mark all as error
      uploadProgresses.forEach(upload => {
        updateUpload(upload.fileId, {
          status: 'error',
          error: error instanceof Error ? error.message : 'Upload failed',
        });
      });
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleButtonClick}
        loading={uploadMutation.isPending}
        className={className}
      >
        {children}
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={acceptedTypes}
        onChange={handleFileSelect}
        className="hidden"
      />
    </>
  );
}