/**
 * RealtimeDbImage Component
 * SIKILAT - Sistem Informasi Laporan Kegiatan Terintegrasi
 * 
 * Komponen untuk menampilkan gambar dari Firebase Realtime Database.
 * Mendukung format rtdb://xxx dan URL biasa.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { resolveImageUrl, isRealtimeDbImage } from '@/lib/realtimeDbImages';

interface RealtimeDbImageProps {
  src: string;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
}

export default function RealtimeDbImage({ 
  src, 
  alt, 
  className = '',
  fallback = null 
}: RealtimeDbImageProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const loadImage = async () => {
      if (!src) {
        setIsLoading(false);
        setHasError(true);
        return;
      }

      // If it's a realtime DB reference, fetch the actual image
      if (isRealtimeDbImage(src)) {
        try {
          setIsLoading(true);
          const resolvedUrl = await resolveImageUrl(src);
          if (resolvedUrl) {
            setImageSrc(resolvedUrl);
            setHasError(false);
          } else {
            setHasError(true);
          }
        } catch (error) {
          console.error('Failed to load image from Realtime DB:', error);
          setHasError(true);
        } finally {
          setIsLoading(false);
        }
      } else {
        // Regular URL or base64, use directly
        setImageSrc(src);
        setIsLoading(false);
      }
    };

    loadImage();
  }, [src]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 animate-pulse ${className}`}>
        <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }

  if (hasError || !imageSrc) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <div className={`flex items-center justify-center bg-gray-100 text-gray-400 ${className}`}>
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img 
      src={imageSrc} 
      alt={alt} 
      className={className}
      onError={() => setHasError(true)}
    />
  );
}
