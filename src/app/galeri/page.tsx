/**
 * Galeri Page
 * SIKILAT - Sistem Informasi Laporan Kegiatan Terintegrasi
 * 
 * Halaman untuk melihat semua foto dokumentasi kegiatan.
 */

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAllLaporan, getLaporanById, updateLaporan } from '@/services/laporanService';
import LoadingSpinner from '@/components/LoadingSpinner';
import { isRealtimeDbImage, resolveImageUrl } from '@/lib/realtimeDbImages';
import { formatTanggal } from '@/utils/dateFormat';

interface GalleryImage {
  src: string;
  originalSrc: string; // Original URL/path for deletion
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<GalleryImage | null>(null);

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
                      originalSrc: gambar, // Keep original for deletion
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

  // Delete image from laporan
  const handleDeleteImage = async (image: GalleryImage) => {
    if (!image.laporanId) {
      alert('Tidak dapat menghapus gambar: ID laporan tidak ditemukan');
      return;
    }

    setIsDeleting(true);
    try {
      // Get the full laporan
      const result = await getLaporanById(image.laporanId);
      if (!result.success || !result.data) {
        throw new Error('Laporan tidak ditemukan');
      }

      const laporan = result.data;
      
      // Find and update the uraianKegiatan that contains this image
      const updatedUraian = laporan.uraianKegiatan?.map(uraian => {
        if (uraian.hari === image.hari && uraian.tanggal === image.tanggal) {
          // Remove the image from this uraian's gambar array
          return {
            ...uraian,
            gambar: uraian.gambar?.filter(g => g !== image.originalSrc) || []
          };
        }
        return uraian;
      });

      // Update the laporan
      const updateResult = await updateLaporan(image.laporanId, {
        uraianKegiatan: updatedUraian
      });

      if (updateResult.success) {
        // Remove from local state
        setImages(prev => prev.filter(img => 
          !(img.laporanId === image.laporanId && 
            img.originalSrc === image.originalSrc && 
            img.hari === image.hari)
        ));
        setSelectedImage(null);
        setDeleteConfirm(null);
      } else {
        throw new Error(updateResult.error || 'Gagal menghapus gambar');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert(`Gagal menghapus gambar: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDeleting(false);
    }
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
                {/* Delete button on hover */}
                <button
                  className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteConfirm(image);
                  }}
                  title="Hapus gambar"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
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
              <div className="flex items-center justify-center gap-3 mt-3">
                <Link
                  href={`/laporan?id=${selectedImage.laporanId}`}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm transition-colors"
                >
                  Lihat Laporan →
                </Link>
                <button
                  onClick={() => setDeleteConfirm(selectedImage)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div 
          className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4"
          onClick={() => !isDeleting && setDeleteConfirm(null)}
        >
          <div 
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Hapus Gambar?</h3>
              <p className="text-gray-600 mb-6">
                Apakah Anda yakin ingin menghapus gambar dari kegiatan <strong>{deleteConfirm.namaKegiatan}</strong> (Hari ke-{deleteConfirm.hari})? Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  disabled={isDeleting}
                  className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  onClick={() => handleDeleteImage(deleteConfirm)}
                  disabled={isDeleting}
                  className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Menghapus...
                    </>
                  ) : (
                    'Ya, Hapus'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
