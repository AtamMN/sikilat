/**
 * Laporan Template Page
 * SIKILAT - Sistem Informasi Laporan Kegiatan Terintegrasi
 * 
 * Halaman template output laporan resmi dengan format A4.
 * Dilengkapi CSS untuk print/PDF.
 */

'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLaporan } from '@/context/LaporanContext';
import { getLaporanById } from '@/services/laporanService';
import { LaporanType, UraianHari } from '@/types/laporan';
import LoadingSpinner from '@/components/LoadingSpinner';
import { resolveImageUrl, isRealtimeDbImage } from '@/lib/realtimeDbImages';

// Helper untuk format tanggal
const formatTanggal = (dateString: string): string => {
  if (!dateString) return '-';
  
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', options);
  } catch {
    return dateString;
  }
};

// Helper untuk format tanggal singkat
const formatTanggalSingkat = (dateString: string): string => {
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

export default function LaporanPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" text="Memuat laporan..." />
      </div>
    }>
      <LaporanContent />
    </Suspense>
  );
}

function LaporanContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const laporanId = searchParams.get('id');
  
  const { currentLaporan, isLoading, loadCurrentLaporan } = useLaporan();
  const [isPrinting, setIsPrinting] = useState(false);
  const [laporan, setLaporan] = useState<LaporanType | null>(null);
  const [isLoadingById, setIsLoadingById] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [resolvedUraian, setResolvedUraian] = useState<UraianHari[] | null>(null);
  const [isResolvingImages, setIsResolvingImages] = useState(false);

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
        // Load from context (untuk redirect setelah submit)
        loadCurrentLaporan();
      }
    };
    
    loadLaporan();
  }, [laporanId, currentLaporan, loadCurrentLaporan]);

  // Use laporan from URL or from context
  const displayLaporan = laporanId ? laporan : currentLaporan;
  const displayLoading = laporanId ? isLoadingById : isLoading;

  // Resolve images from Realtime Database (legacy support)
  // New images are stored directly as base64 in Firestore
  useEffect(() => {
    const resolveImages = async () => {
      if (!displayLaporan?.uraianKegiatan) {
        setResolvedUraian(null);
        return;
      }

      // Check if any image needs resolving (legacy rtdb:// references)
      const needsResolving = displayLaporan.uraianKegiatan.some(
        uraian => uraian.gambar?.some(img => isRealtimeDbImage(img))
      );

      if (!needsResolving) {
        // No legacy images - just use as is (new base64 format)
        setResolvedUraian(displayLaporan.uraianKegiatan);
        return;
      }

      setIsResolvingImages(true);
      
      // Set a shorter timeout - skip legacy images quickly if they fail
      const timeoutId = setTimeout(() => {
        console.warn('Legacy image resolve timeout - skipping rtdb images');
        setResolvedUraian(displayLaporan.uraianKegiatan.map(uraian => ({
          ...uraian,
          // Keep only non-rtdb images (base64 or http)
          gambar: uraian.gambar?.filter(img => !isRealtimeDbImage(img)) || [],
        })));
        setIsResolvingImages(false);
      }, 5000); // 5 seconds max for legacy images

      try {
        const resolved = await Promise.all(
          displayLaporan.uraianKegiatan.map(async (uraian) => {
            if (!uraian.gambar || uraian.gambar.length === 0) {
              return uraian;
            }

            const resolvedGambar = await Promise.all(
              uraian.gambar.map(async (img) => {
                // If it's not an rtdb reference, return as-is
                if (!isRealtimeDbImage(img)) {
                  return img;
                }
                // Try to resolve legacy rtdb reference
                try {
                  const resolvedUrl = await resolveImageUrl(img);
                  return resolvedUrl || '';
                } catch {
                  console.warn('Failed to resolve legacy image:', img);
                  return '';
                }
              })
            );

            return {
              ...uraian,
              gambar: resolvedGambar.filter(url => url !== ''),
            };
          })
        );
        clearTimeout(timeoutId);
        setResolvedUraian(resolved);
      } catch (error) {
        console.error('Failed to resolve images:', error);
        clearTimeout(timeoutId);
        // Skip all rtdb images on error
        setResolvedUraian(displayLaporan.uraianKegiatan.map(uraian => ({
          ...uraian,
          gambar: uraian.gambar?.filter(img => !isRealtimeDbImage(img)) || [],
        })));
      } finally {
        setIsResolvingImages(false);
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
    router.push('/');
  };

  const handleNewLaporan = () => {
    router.push('/');
  };

  if (displayLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" text="Memuat laporan..." />
      </div>
    );
  }

  if (isResolvingImages) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" text="Memuat gambar..." />
      </div>
    );
  }

  if (loadError || !displayLaporan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
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
            onClick={handleNewLaporan}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Buat Laporan Baru
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Action Buttons - Hidden when printing */}
      <div className="print:hidden bg-gray-100 sticky top-0 z-50 border-b">
        <div className="max-w-[210mm] mx-auto px-4 py-3 flex flex-wrap gap-3 justify-between items-center">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Kembali ke Form
          </button>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleNewLaporan}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              📝 Buat Laporan Baru
            </button>
            <button
              onClick={() => router.push('/laporan/majalah')}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors flex items-center gap-2"
            >
              📰 Format Majalah
            </button>
            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              {isPrinting ? 'Mempersiapkan...' : 'Cetak Surat'}
            </button>
          </div>
        </div>
      </div>

      {/* A4 Paper Container */}
      <div className="bg-gray-100 min-h-screen py-8 print:bg-white print:py-0">
        <div className="a4-paper bg-white mx-auto shadow-lg print:shadow-none">
          
          {/* Kop Surat */}
          <header className="border-b-4 border-black pb-4 mb-6">
            <div className="flex items-center gap-4">
              {/* Logo Placeholder */}
              <div className="w-20 h-20 bg-gray-200 rounded flex items-center justify-center print:bg-white print:border print:border-gray-300">
                <span className="text-xs text-gray-500 text-center">LOGO<br/>INSTANSI</span>
              </div>
              
              <div className="flex-1 text-center">
                <p className="text-sm font-medium">KEMENTERIAN PENDIDIKAN, KEBUDAYAAN, RISET, DAN TEKNOLOGI</p>
                <p className="text-sm font-medium">BADAN PENGEMBANGAN DAN PEMBINAAN BAHASA</p>
                <h1 className="text-lg font-bold">BALAI BAHASA PROVINSI JAWA BARAT</h1>
                <p className="text-xs mt-1">
                  Jalan Sumbawa Nomor 11 Bandung 40113
                </p>
                <p className="text-xs">
                  Telepon: (022) 7271083, Faksimile: (022) 7271083
                </p>
                <p className="text-xs">
                  Laman: balaibahasajabar.kemdikbud.go.id, Pos-el: balaibahasabandung@kemdikbud.go.id
                </p>
              </div>

              {/* Logo Placeholder 2 */}
              <div className="w-20 h-20 bg-gray-200 rounded flex items-center justify-center print:bg-white print:border print:border-gray-300">
                <span className="text-xs text-gray-500 text-center">LOGO<br/>KEDUA</span>
              </div>
            </div>
          </header>

          {/* Judul Laporan */}
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold uppercase tracking-wide">LAPORAN KEGIATAN</h2>
            <h3 className="text-lg font-semibold mt-2 uppercase">
              {displayLaporan.namaKegiatan}
            </h3>
          </div>

          {/* BAB I: PENDAHULUAN */}
          <section className="mb-6">
            <h3 className="text-base font-bold mb-4">BAB I. PENDAHULUAN</h3>
            
            <div className="space-y-4 text-justify leading-relaxed">
              <div>
                <h4 className="font-semibold mb-1">A. Latar Belakang / Dasar Hukum / Tujuan</h4>
                <div className="pl-4 rich-text-content" dangerouslySetInnerHTML={{ __html: displayLaporan.pendahuluan }} />
              </div>

              <div>
                <h4 className="font-semibold mb-1">B. Waktu dan Tempat Pelaksanaan</h4>
                <div className="pl-4">
                  <table className="text-sm">
                    <tbody>
                      <tr>
                        <td className="pr-4">Hari/Tanggal</td>
                        <td className="pr-2">:</td>
                        <td>{formatTanggal(displayLaporan.uraianKegiatan?.[0]?.tanggal || displayLaporan.waktuMulai)}</td>
                      </tr>
                      <tr>
                        <td className="pr-4">Waktu</td>
                        <td className="pr-2">:</td>
                        <td>{displayLaporan.waktuMulai} s.d. {displayLaporan.waktuSelesai}</td>
                      </tr>
                      <tr>
                        <td className="pr-4">Tempat</td>
                        <td className="pr-2">:</td>
                        <td>{displayLaporan.tempatPelaksanaan}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-1">C. Pelaksana</h4>
                <div className="pl-4">
                  {displayLaporan.pelaksana?.map((p, i) => (
                    <p key={i}>
                      {p.nama} ({p.jabatan})
                      {p.nip && ` - NIP. ${p.nip}`}
                    </p>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-1">D. Sumber Pendanaan</h4>
                <p className="pl-4">{displayLaporan.sumberPendanaan}</p>
              </div>
            </div>
          </section>

          {/* BAB II: URAIAN KEGIATAN */}
          <section className="mb-6">
            <h3 className="text-base font-bold mb-4">BAB II. URAIAN KEGIATAN</h3>
            
            {(resolvedUraian || displayLaporan.uraianKegiatan)?.map((uraian, index) => (
              <div key={index} className="mb-4">
                <h4 className="font-semibold mb-2">
                  Hari ke-{uraian.hari} ({formatTanggalSingkat(uraian.tanggal)})
                </h4>
                <div 
                  className="text-justify leading-relaxed pl-4 rich-text-content"
                  dangerouslySetInnerHTML={{ __html: uraian.deskripsi }}
                />
                
                {/* Dokumentasi Foto */}
                {uraian.gambar && uraian.gambar.length > 0 && (
                  <div className="mt-4">
                    <p className="font-medium mb-2 pl-4">Dokumentasi:</p>
                    <div className="grid grid-cols-2 gap-4 pl-4">
                      {uraian.gambar.map((img, imgIndex) => (
                        <figure key={imgIndex} className="text-center">
                          {/* Hanya render img jika bukan rtdb:// URL */}
                          {img && !img.startsWith('rtdb://') ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img 
                              src={img} 
                              alt={`Dokumentasi ${imgIndex + 1}`}
                              className="w-full h-48 object-cover rounded border"
                            />
                          ) : (
                            <div className="w-full h-48 bg-gray-100 rounded border flex items-center justify-center">
                              <div className="text-center text-gray-400">
                                <svg className="w-8 h-8 mx-auto animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                <p className="text-xs mt-2">Memuat...</p>
                              </div>
                            </div>
                          )}
                          <figcaption className="text-xs text-gray-600 mt-1">
                            Gambar {imgIndex + 1}
                          </figcaption>
                        </figure>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </section>

          {/* BAB III: PENUTUP */}
          <section className="mb-8">
            <h3 className="text-base font-bold mb-4">BAB III. PENUTUP</h3>
            
            <div className="space-y-4 text-justify leading-relaxed">
              <div>
                <h4 className="font-semibold mb-1">A. Rekomendasi</h4>
                <div className="pl-4 rich-text-content" dangerouslySetInnerHTML={{ __html: displayLaporan.rekomendasi }} />
              </div>

              <div>
                <h4 className="font-semibold mb-1">B. Ucapan Terima Kasih</h4>
                <div className="pl-4 rich-text-content" dangerouslySetInnerHTML={{ __html: displayLaporan.ucapanTerimakasih }} />
              </div>
            </div>
          </section>

          {/* Tanda Tangan */}
          <div className="mt-12 flex justify-end">
            <div className="text-center">
              <p>Bandung, {formatTanggalSingkat(new Date().toISOString())}</p>
              <p className="mt-1">Penanggung Jawab Kegiatan,</p>
              
              <div className="h-20 flex items-end justify-center">
                {/* Space for signature */}
              </div>
              
              <p className="font-semibold underline">
                {displayLaporan.pelaksana?.[0]?.nama || '________________________'}
              </p>
              {displayLaporan.pelaksana?.[0]?.nip && (
                <p className="text-sm">NIP. {displayLaporan.pelaksana[0].nip}</p>
              )}
            </div>
          </div>

          {/* Mengetahui Section */}
          <div className="mt-8 border-t pt-6">
            <div className="flex justify-between">
              <div className="text-center">
                <p>Mengetahui,</p>
                <p>Kepala Balai Bahasa Provinsi Jawa Barat</p>
                
                <div className="h-20 flex items-end justify-center">
                  {/* Space for signature */}
                </div>
                
                <p className="font-semibold underline">________________________</p>
                <p className="text-sm">NIP. ________________________</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 20mm 15mm;
          }
          
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          
          .a4-paper {
            width: 100% !important;
            max-width: none !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
          }
        }
        
        .a4-paper {
          width: 210mm;
          min-height: 297mm;
          padding: 20mm 15mm;
          font-family: 'Times New Roman', Times, serif;
          font-size: 12pt;
          line-height: 1.5;
        }
        
        @media screen and (max-width: 210mm) {
          .a4-paper {
            width: 100%;
            min-height: auto;
            padding: 15mm 10mm;
          }
        }
      `}</style>
    </>
  );
}
