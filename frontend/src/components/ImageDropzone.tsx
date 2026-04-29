'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface UploadedImage {
  id: string;
  imageUrl: string;
  extractedText: string;
}

interface ImageDropzoneProps {
  onUpload: (image: UploadedImage) => void;
  images: UploadedImage[];
}

export function ImageDropzone({ onUpload, images }: ImageDropzoneProps) {
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(
    async (files: File[]) => {
      for (const file of files) {
        setUploading(true);
        try {
          const result = await api.uploadImage(file);
          onUpload(result);
          if (result.extractedText) {
            toast.success('Image uploaded and text extracted!');
          } else {
            toast.success('Image uploaded');
          }
        } catch (err: any) {
          toast.error(err.message || 'Upload failed');
        } finally {
          setUploading(false);
        }
      }
    },
    [onUpload],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'] },
    maxSize: 10 * 1024 * 1024,
  });

  return (
    <div>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
          ${isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'}
          ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-600">Processing image with OCR...</p>
          </div>
        ) : isDragActive ? (
          <div className="flex flex-col items-center gap-2">
            <svg className="w-12 h-12 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-primary-600 font-medium">Drop the image here!</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-600 font-medium">
              Drag & drop error screenshot here
            </p>
            <p className="text-sm text-gray-400">
              or click to select. OCR will extract text automatically.
            </p>
          </div>
        )}
      </div>

      {/* Uploaded images preview */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mt-4">
          {images.map((img) => (
            <div key={img.id} className="border rounded-lg overflow-hidden">
              <img
                src={`${API_URL}${img.imageUrl}`}
                alt="Uploaded"
                className="w-full h-32 object-cover"
              />
              {img.extractedText && (
                <div className="p-2 bg-green-50 text-xs text-green-700">
                  OCR: {img.extractedText.slice(0, 100)}...
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
