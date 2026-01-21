/**
 * Laporan Majalah Page
 * SIKILAT - Sistem Informasi Laporan Kegiatan Terintegrasi
 * 
 * Halaman output laporan dalam format majalah yang lebih visual dan modern.
 */

'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLaporan } from '@/context/LaporanContext';
import { getLaporanById } from '@/services/laporanService';
import { LaporanType } from '@/types/laporan';
import LoadingSpinner from '@/components/LoadingSpinner';
import { resolveImageUrl, isRealtimeDbImage } from '@/lib/realtimeDbImages';

// Helper untuk format tanggal
const formatTanggal = (dateString: string): string => {
  if (!dateString) return '-';
  
  const options: Intl.DateTimeFormatOptions = { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  };
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', options);
  } catch {
    return dateString;
  }
};

// Helper untuk format bulan tahun
const formatBulanTahun = (dateString: string): string => {
  if (!dateString) return '-';
  
  const options: Intl.DateTimeFormatOptions = { 
    month: 'long', 
    year: 'numeric' 
  };
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', options);
  } catch {
    return dateString;
  }
};

export default function LaporanMajalahPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <LoadingSpinner size="lg" text="Memuat laporan..." />
      </div>
    }>
      <MajalahContent />
    </Suspense>
  );
}

function MajalahContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const laporanId = searchParams.get('id');
  
  const { currentLaporan, isLoading, loadCurrentLaporan } = useLaporan();
  const [laporan, setLaporan] = useState<LaporanType | null>(null);
  const [isLoadingById, setIsLoadingById] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [resolvedImages, setResolvedImages] = useState<string[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);

  // Load laporan by ID from URL or from context
  useEffect(() => {
    const loadLaporan = async () => {
      if (laporanId) {
        // Load by ID from URL - langsung dari Firestore
        setIsLoadingById(true);
        setLoadError(null);
        try {
          const response = await getLaporanById(laporanId);
          if (response.success && response.data) {
            setLaporan(response.data);
          } else {
            setLoadError(response.error || 'Laporan tidak ditemukan');
          }
        } catch (err) {
          console.error('Error loading laporan:', err);
          setLoadError('Gagal memuat laporan');
        } finally {
          setIsLoadingById(false);
        }
      } else if (!currentLaporan) {
        loadCurrentLaporan();
      }
    };
    
    loadLaporan();
  }, [laporanId, currentLaporan, loadCurrentLaporan]);

  // Use laporan from URL or from context
  const displayLaporan = laporanId ? laporan : currentLaporan;
  const displayLoading = laporanId ? isLoadingById : isLoading;

  // Resolve images - new format is base64, legacy is rtdb://
  useEffect(() => {
    const resolveImages = async () => {
      if (!displayLaporan?.uraianKegiatan) {
        setResolvedImages([]);
        return;
      }

      // Collect all images from all uraian kegiatan
      const allGambar: string[] = [];
      for (const uraian of displayLaporan.uraianKegiatan) {
        if (uraian.gambar && uraian.gambar.length > 0) {
          allGambar.push(...uraian.gambar);
        }
      }

      if (allGambar.length === 0) {
        setResolvedImages([]);
        return;
      }
      
      // Check if any image needs resolving (legacy rtdb:// references)
      const needsResolving = allGambar.some(img => isRealtimeDbImage(img));
      if (!needsResolving) {
        // No legacy images - just use as is
        setResolvedImages(allGambar);
        return;
      }

      setIsLoadingImages(true);
      
      // Set timeout for legacy images
      const timeoutId = setTimeout(() => {
        console.warn('Legacy image resolve timeout - skipping rtdb images');
        setResolvedImages(allGambar.filter(img => !isRealtimeDbImage(img)));
        setIsLoadingImages(false);
      }, 5000);

      try {
        const resolved = await Promise.all(
          allGambar.map(async (img) => {
            if (!isRealtimeDbImage(img)) {
              return img; // Return base64 or http as-is
            }
            try {
              const resolvedUrl = await resolveImageUrl(img);
              return resolvedUrl || '';
            } catch {
              return '';
            }
          })
        );
        clearTimeout(timeoutId);
        setResolvedImages(resolved.filter(url => url !== ''));
      } catch (error) {
        console.error('Failed to resolve images:', error);
        clearTimeout(timeoutId);
        setResolvedImages(allGambar.filter(img => !isRealtimeDbImage(img)));
      } finally {
        setIsLoadingImages(false);
      }
    };

    resolveImages();
  }, [displayLaporan]);

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 100);
  };

  const handleBack = () => {
    router.push('/laporan');
  };

  const handleBackToForm = () => {
    router.push('/');
  };

  if (displayLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <LoadingSpinner size="lg" text="Memuat laporan..." />
      </div>
    );
  }

  if (loadError || !displayLaporan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Laporan Tidak Ditemukan
          </h2>
          <p className="text-gray-600 mb-6">
            {loadError || 'Silakan buat laporan baru terlebih dahulu.'}
          </p>
          <button
            onClick={handleBackToForm}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Buat Laporan Baru
          </button>
        </div>
      </div>
    );
  }

  // Use resolved images instead of raw gambarList
  const gambarList = resolvedImages;
  const heroImage = gambarList[0];
  const otherImages = gambarList.slice(1);

  // Show loading state while images are being resolved
  if (isLoadingImages) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <LoadingSpinner size="lg" text="Memuat gambar..." />
      </div>
    );
  }

  return (
    <>
      {/* Action Buttons - Hidden when printing */}
      <div className="print:hidden bg-gray-900 sticky top-0 z-50 border-b border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap gap-3 justify-between items-center">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Kembali ke Format Surat
          </button>
          <div className="flex gap-3">
            <button
              onClick={handleBackToForm}
              className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
            >
              📝 Buat Laporan Baru
            </button>
            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              {isPrinting ? 'Mempersiapkan...' : 'Cetak Majalah'}
            </button>
          </div>
        </div>
      </div>

      {/* Magazine Container */}
      <div className="magazine-container bg-gray-900 min-h-screen print:bg-white">
        
        {/* Cover Page */}
        <div className="magazine-page cover-page relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900">
            <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />
          </div>

          {/* Hero Image */}
          {heroImage && !heroImage.startsWith('rtdb://') && (
            <div className="absolute inset-0">
              <img 
                src={heroImage} 
                alt="Cover"
                className="w-full h-full object-cover opacity-40"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
            </div>
          )}

          {/* Content */}
          <div className="relative z-10 h-full flex flex-col justify-between p-12 text-white">
            {/* Header */}
            <div className="flex justify-between items-start">
              <div>
                <span className="text-sm font-medium tracking-widest uppercase opacity-80">
                  Laporan Kegiatan
                </span>
                <div className="w-20 h-1 bg-gradient-to-r from-yellow-400 to-orange-500 mt-2" />
              </div>
              <div className="text-right">
                <p className="text-sm opacity-80">Edisi</p>
                <p className="text-2xl font-bold">{formatBulanTahun(displayLaporan.waktuMulai)}</p>
              </div>
            </div>

            {/* Title */}
            <div className="flex-1 flex flex-col justify-center">
              <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6 drop-shadow-lg">
                {displayLaporan.namaKegiatan}
              </h1>
              <div className="flex flex-wrap gap-4 text-lg">
                <span className="flex items-center gap-2 bg-white/20 backdrop-blur px-4 py-2 rounded-full">
                  📍 {displayLaporan.tempatPelaksanaan}
                </span>
                <span className="flex items-center gap-2 bg-white/20 backdrop-blur px-4 py-2 rounded-full">
                  📅 {formatTanggal(displayLaporan.uraianKegiatan?.[0]?.tanggal || displayLaporan.waktuMulai)}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-end">
              <div>
                <p className="text-sm opacity-80">Balai Bahasa Provinsi Jawa Barat</p>
                <p className="text-xs opacity-60">Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi</p>
              </div>
              <div className="text-6xl font-black opacity-20">
                SIKILAT
              </div>
            </div>
          </div>
        </div>

        {/* Content Page 1 - Pendahuluan */}
        <div className="magazine-page content-page bg-white">
          <div className="h-full flex flex-col">
            {/* Page Header */}
            <div className="flex justify-between items-center pb-4 border-b-2 border-gray-200">
              <span className="text-sm font-semibold text-purple-600 tracking-wider">PENDAHULUAN</span>
              <span className="text-sm text-gray-400">01</span>
            </div>

            {/* Content */}
            <div className="flex-1 py-8 grid grid-cols-2 gap-8">
              {/* Left Column - Pendahuluan */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-black text-gray-900 mb-4 leading-tight">
                    Latar Belakang / Dasar Hukum / Tujuan
                  </h2>
                  <div className="text-gray-700 leading-relaxed text-justify rich-text-content text-sm" dangerouslySetInnerHTML={{ __html: displayLaporan.pendahuluan }} />
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-600 text-white p-5 rounded-xl">
                    <p className="text-xs uppercase tracking-wider opacity-80 mb-1">Waktu</p>
                    <p className="font-bold">{displayLaporan.waktuMulai}</p>
                    <p className="text-sm opacity-80">s.d. {displayLaporan.waktuSelesai}</p>
                  </div>
                  <div className="bg-green-600 text-white p-5 rounded-xl">
                    <p className="text-xs uppercase tracking-wider opacity-80 mb-1">Tempat</p>
                    <p className="font-bold text-sm">{displayLaporan.tempatPelaksanaan}</p>
                  </div>
                </div>

                <div className="border-2 border-gray-200 p-5 rounded-xl">
                  <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">Sumber Pendanaan</p>
                  <p className="font-semibold text-gray-800">{displayLaporan.sumberPendanaan}</p>
                </div>

                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-5 rounded-r-xl">
                  <p className="text-xs uppercase tracking-wider text-yellow-700 mb-2">Penanggung Jawab</p>
                  <p className="font-bold text-gray-900">{displayLaporan.pelaksana?.[0]?.nama}</p>
                  <p className="text-sm text-gray-600">{displayLaporan.pelaksana?.[0]?.jabatan}</p>
                  {displayLaporan.pelaksana?.[0]?.nip && (
                    <p className="text-xs text-gray-500 mt-1">NIP. {displayLaporan.pelaksana[0].nip}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Page 2 - Uraian Kegiatan */}
        <div className="magazine-page content-page bg-white">
          <div className="h-full flex flex-col">
            {/* Page Header */}
            <div className="flex justify-between items-center pb-4 border-b-2 border-gray-200">
              <span className="text-sm font-semibold text-purple-600 tracking-wider">URAIAN KEGIATAN</span>
              <span className="text-sm text-gray-400">02</span>
            </div>

            {/* Content */}
            <div className="flex-1 py-8">
              <div className="mb-6">
                <h2 className="text-4xl font-black text-gray-900 mb-2">
                  Pelaksanaan Kegiatan
                </h2>
                <div className="w-24 h-1 bg-gradient-to-r from-purple-600 to-pink-600" />
              </div>

              <div className="grid grid-cols-3 gap-6">
                {/* Main Text - 2 columns */}
                <div className="col-span-2">
                  <div 
                    className="text-gray-700 leading-relaxed text-justify text-lg rich-text-content first-letter:text-6xl first-letter:font-bold first-letter:float-left first-letter:mr-3 first-letter:text-purple-600"
                    dangerouslySetInnerHTML={{ __html: displayLaporan.uraianKegiatan?.[0]?.deskripsi || '' }}
                  />
                </div>

                {/* Sidebar with images */}
                <div className="space-y-4">
                  {otherImages.slice(0, 2).filter(img => img && !img.startsWith('rtdb://')).map((img, index) => (
                    <div key={index} className="relative group overflow-hidden rounded-xl shadow-lg">
                      <img 
                        src={img} 
                        alt={`Dokumentasi ${index + 2}`}
                        className="w-full h-40 object-cover transform group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                        <p className="text-white text-xs">Dokumentasi {index + 2}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Page 3 - Galeri & Penutup */}
        <div className="magazine-page content-page bg-white">
          <div className="h-full flex flex-col overflow-hidden">
            {/* Page Header */}
            <div className="flex justify-between items-center pb-4 border-b-2 border-gray-200 flex-shrink-0">
              <span className="text-sm font-semibold text-purple-600 tracking-wider">GALERI & PENUTUP</span>
              <span className="text-sm text-gray-400">03</span>
            </div>

            {/* Content */}
            <div className="flex-1 py-6 grid grid-cols-2 gap-8 overflow-hidden">
              {/* Left - Gallery */}
              <div className="overflow-hidden">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">📸 Galeri Dokumentasi</h3>
                {gambarList.filter(img => img && !img.startsWith('rtdb://')).length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {gambarList.filter(img => img && !img.startsWith('rtdb://')).slice(0, 4).map((img, index) => (
                      <div key={index} className="relative group overflow-hidden rounded-lg shadow-md aspect-square">
                        <img 
                          src={img} 
                          alt={`Foto ${index + 1}`}
                          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                          <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-sm font-medium">
                            Foto {index + 1}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-100 rounded-xl p-8 text-center text-gray-500">
                    <p>Tidak ada dokumentasi foto</p>
                  </div>
                )}
              </div>

              {/* Right - Penutup */}
              <div className="flex flex-col h-full overflow-hidden">
                <div className="flex-1 overflow-hidden space-y-4">
                  <div className="max-h-[35%] overflow-hidden">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">💡 Rekomendasi</h3>
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-4 rounded-xl max-h-[calc(100%-2rem)] overflow-hidden">
                      <div className="text-gray-700 leading-relaxed rich-text-content text-sm line-clamp-6" dangerouslySetInnerHTML={{ __html: displayLaporan.rekomendasi }} />
                    </div>
                  </div>

                  <div className="max-h-[35%] overflow-hidden">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">🙏 Ucapan Terima Kasih</h3>
                    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-4 rounded-xl max-h-[calc(100%-2rem)] overflow-hidden">
                      <div className="text-gray-700 leading-relaxed rich-text-content text-sm line-clamp-6" dangerouslySetInnerHTML={{ __html: displayLaporan.ucapanTerimakasih }} />
                    </div>
                  </div>
                </div>

                {/* Signature - Fixed at bottom */}
                <div className="bg-gray-900 text-white p-4 rounded-xl flex-shrink-0 mt-4">
                  <p className="text-xs opacity-70 mb-2">Penanggung Jawab Kegiatan</p>
                  <p className="text-lg font-bold">{displayLaporan.pelaksana?.[0]?.nama}</p>
                  <p className="text-xs opacity-70">{displayLaporan.pelaksana?.[0]?.jabatan}</p>
                  <div className="mt-3 pt-3 border-t border-gray-700 text-xs opacity-50">
                    {formatTanggal(new Date().toISOString())}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Back Cover */}
        <div className="magazine-page back-cover relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900" />
          
          <div className="relative z-10 h-full flex flex-col justify-center items-center text-white p-12 text-center">
            <div className="mb-8">
              <h2 className="text-4xl font-black mb-2">SIKILAT</h2>
              <p className="text-lg opacity-80">Sistem Informasi Laporan Kegiatan Terintegrasi</p>
            </div>
            
            <div className="w-32 h-1 bg-gradient-to-r from-transparent via-white to-transparent mb-8 opacity-50" />
            
            <div className="space-y-2 text-sm opacity-70">
              <p>Balai Bahasa Provinsi Jawa Barat</p>
              <p>Badan Pengembangan dan Pembinaan Bahasa</p>
              <p>Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi</p>
            </div>
            
            <div className="mt-12 text-xs opacity-40">
              <p>Jalan Sumbawa Nomor 11 Bandung 40113</p>
              <p>balaibahasajabar.kemdikbud.go.id</p>
            </div>
          </div>
        </div>

      </div>

      {/* Magazine Styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 0;
          }
          
          body {
            print-color-adjust: exact !important;
            -webkit-print-color-adjust: exact !important;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          
          .magazine-container {
            background: white !important;
          }
          
          .magazine-page {
            page-break-after: always;
            page-break-inside: avoid;
            box-shadow: none !important;
            margin: 0 !important;
          }
        }
        
        .magazine-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2rem;
          padding: 2rem;
        }
        
        .magazine-page {
          width: 297mm;
          height: 210mm;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }
        
        .cover-page,
        .back-cover {
          background: linear-gradient(135deg, #1e3a8a 0%, #7c3aed 50%, #db2777 100%);
        }
        
        .content-page {
          padding: 2rem 3rem;
        }
        
        @media screen and (max-width: 1200px) {
          .magazine-page {
            width: 100%;
            height: auto;
            min-height: 100vh;
          }
          
          .content-page .grid {
            grid-template-columns: 1fr !important;
          }
          
          .content-page .col-span-2 {
            grid-column: span 1 !important;
          }
        }
      `}</style>
    </>
  );
}
