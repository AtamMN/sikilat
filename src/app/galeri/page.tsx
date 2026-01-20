/**
 * Galeri Page
 * SIKILAT - Sistem Informasi Laporan Kegiatan Terintegrasi
 * 
 * Halaman untuk melihat semua foto dokumentasi kegiatan.
 */

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAllLaporan } from '@/services/laporanService';
import LoadingSpinner from '@/components/LoadingSpinner';
import { isRealtimeDbImage, resolveImageUrl } from '@/lib/realtimeDbImages';

interface GalleryImage {
  src: string;
  laporanId: string;
  namaKegiatan: string;
  tanggal: string;
  hari: number;
}

export default function GaleriPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [kegiatanList, setKegiatanList] = useState<string[]>([]);

  useEffect(() => {
    const loadImages = async () => {
      setIsLoading(true);
      try {
        const result = await getAllLaporan();
        if (result.success && result.data) {
          const allImages: GalleryImage[] = [];
          const kegiatanNames: Set<string> = new Set();

          for (const laporan of result.data) {
            kegiatanNames.add(laporan.namaKegiatan);
            
            if (laporan.uraianKegiatan) {
              for (const uraian of laporan.uraianKegiatan) {
                if (uraian.gambar && uraian.gambar.length > 0) {
                  for (const gambar of uraian.gambar) {
                    let imageSrc = gambar;
                    
                    // Resolve rtdb:// images (legacy)
                    if (isRealtimeDbImage(gambar)) {
                      try {
                        const resolved = await resolveImageUrl(gambar);
                        if (resolved) {
                          imageSrc = resolved;
                        } else {
                          continue; // Skip if can't resolve
                        }
                      } catch {
                        continue; // Skip failed images
                      }
                    }

                    allImages.push({
                      src: imageSrc,
                      laporanId: laporan.id || '',
                      namaKegiatan: laporan.namaKegiatan,
                      tanggal: uraian.tanggal,
                      hari: uraian.hari,
                    });
                  }
                }
              }
            }
          }

          setImages(allImages);
          setKegiatanList(Array.from(kegiatanNames));
        }
      } catch (error) {
        console.error('Failed to load images:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadImages();
  }, []);

  const filteredImages = filter === 'all' 
    ? images 
    : images.filter(img => img.namaKegiatan === filter);

  const formatTanggal = (dateString: string): string => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" text="Memuat galeri..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Kembali
            </Link>
            <div className="h-6 w-px bg-gray-300" />
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              📸 Galeri Dokumentasi
            </h1>
          </div>
          
          {/* Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Filter:</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Semua Kegiatan</option>
              {kegiatanList.map((kegiatan, idx) => (
                <option key={idx} value={kegiatan}>{kegiatan}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{filteredImages.length} Foto</h2>
              <p className="text-blue-100">
                {filter === 'all' 
                  ? `Dari ${kegiatanList.length} kegiatan` 
                  : `Kegiatan: ${filter}`
                }
              </p>
            </div>
            <div className="text-6xl opacity-30">📷</div>
          </div>
        </div>

        {/* Gallery Grid */}
        {filteredImages.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Belum ada foto</h3>
            <p className="text-gray-500">
              {filter === 'all' 
                ? 'Tambahkan foto saat membuat laporan kegiatan'
                : 'Tidak ada foto untuk kegiatan ini'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredImages.map((image, index) => (
              <div
                key={index}
                className="group relative aspect-square bg-gray-200 rounded-xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-300"
                onClick={() => setSelectedImage(image)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.src}
                  alt={`Dokumentasi ${image.namaKegiatan}`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-white text-sm font-medium truncate">{image.namaKegiatan}</p>
                    <p className="text-white/70 text-xs">Hari ke-{image.hari}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
            onClick={() => setSelectedImage(null)}
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="max-w-5xl max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedImage.src}
              alt={`Dokumentasi ${selectedImage.namaKegiatan}`}
              className="max-h-[80vh] max-w-full object-contain rounded-lg"
            />
            <div className="mt-4 text-center text-white">
              <h3 className="text-lg font-semibold">{selectedImage.namaKegiatan}</h3>
              <p className="text-gray-300">
                Hari ke-{selectedImage.hari} • {formatTanggal(selectedImage.tanggal)}
              </p>
              <Link
                href={`/laporan?id=${selectedImage.laporanId}`}
                className="inline-block mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm transition-colors"
              >
                Lihat Laporan →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
