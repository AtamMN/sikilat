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

// Props untuk konten laporan
interface LaporanContentProps {
  laporan: LaporanType;
  uraianKegiatan: UraianHari[] | null;
}

// Komponen konten laporan yang dapat di-reuse
const LaporanDocumentContent: React.FC<LaporanContentProps> = ({ laporan, uraianKegiatan }) => {
  return (
    <>
      {/* Kop Surat - Kemendikdasmen 2026 */}
      <header className="kop-surat">
        <div className="flex items-center gap-0">
          <div className="flex-shrink-0 pr-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/assets/2. Logo Jenama_sekunder.png" 
              alt="Logo Kemendikdasmen" 
              className="h-16 w-auto"
            />
          </div>
          <div className="w-[2px] h-16 bg-[#297bbf] flex-shrink-0" />
          <div className="pl-4 flex-1">
            <h1 className="text-[11pt] font-bold text-[#297bbf]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Balai Bahasa Provinsi Jawa Barat
            </h1>
            <div className="text-[7pt] text-black mt-1 space-y-0" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 500 }}>
              <p>Jalan Sumbawa Nomor 11 Bandung 40113</p>
              <p>www.balaibahasajabar.kemdikdasmen.go.id</p>
              <p>☎ 177 | (022) 7271083</p>
            </div>
          </div>
        </div>
      </header>
      
      <hr className="border-gray-300 mb-4" />

      {/* Judul Laporan */}
      <div className="text-center mb-4">
        <h2 className="text-base font-bold uppercase tracking-wide">LAPORAN KEGIATAN</h2>
        <h3 className="text-sm font-semibold mt-1 uppercase">
          {laporan.namaKegiatan}
        </h3>
      </div>

      {/* BAB I: PENDAHULUAN */}
      <section className="mb-4 compact-section">
        <h3 className="text-sm font-bold mb-2">BAB I. PENDAHULUAN</h3>
        
        <div className="space-y-2 text-justify text-[11pt] leading-snug">
          <div>
            <h4 className="font-semibold text-[11pt] mb-0.5">A. Latar Belakang / Dasar Hukum / Tujuan</h4>
            <div className="pl-4 rich-text-content" dangerouslySetInnerHTML={{ __html: laporan.pendahuluan }} />
          </div>

          <div>
            <h4 className="font-semibold text-[11pt] mb-0.5">B. Waktu dan Tempat Pelaksanaan</h4>
            <div className="pl-4">
              <table className="text-[11pt]">
                <tbody>
                  <tr>
                    <td className="pr-3">Hari/Tanggal</td>
                    <td className="pr-2">:</td>
                    <td>{formatTanggal(laporan.uraianKegiatan?.[0]?.tanggal || laporan.waktuMulai)}</td>
                  </tr>
                  <tr>
                    <td className="pr-3">Waktu</td>
                    <td className="pr-2">:</td>
                    <td>{laporan.waktuMulai} s.d. {laporan.waktuSelesai}</td>
                  </tr>
                  <tr>
                    <td className="pr-3">Tempat</td>
                    <td className="pr-2">:</td>
                    <td>{laporan.tempatPelaksanaan}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-[11pt] mb-0.5">C. Pelaksana</h4>
            <div className="pl-4 text-[11pt]">
              {laporan.pelaksana?.map((p, i) => (
                <p key={i} className="leading-snug">
                  {p.nama} ({p.jabatan})
                  {p.nip && ` - NIP. ${p.nip}`}
                </p>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-[11pt] mb-0.5">D. Sumber Pendanaan</h4>
            <p className="pl-4 text-[11pt]">{laporan.sumberPendanaan}</p>
          </div>
        </div>
      </section>

      {/* BAB II: URAIAN KEGIATAN */}
      <section className="mb-4 compact-section">
        <h3 className="text-sm font-bold mb-2">BAB II. URAIAN KEGIATAN</h3>
        
        {(uraianKegiatan || laporan.uraianKegiatan)?.map((uraian, index) => (
          <div key={index} className="mb-3 avoid-break">
            <h4 className="font-semibold text-[11pt] mb-1">
              Hari ke-{uraian.hari} ({formatTanggalSingkat(uraian.tanggal)})
            </h4>
            <div 
              className="text-justify text-[11pt] leading-snug pl-4 rich-text-content"
              dangerouslySetInnerHTML={{ __html: uraian.deskripsi }}
            />
            
            {/* Dokumentasi Foto */}
            {uraian.gambar && uraian.gambar.length > 0 && (
              <div className="mt-3 avoid-break">
                <p className="font-medium text-[10pt] mb-2 pl-4">Dokumentasi:</p>
                <div className="dokumentasi-grid pl-4">
                  {uraian.gambar.map((img, imgIndex) => (
                    <figure key={imgIndex}>
                      {img && !img.startsWith('rtdb://') ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={img} alt={`Dokumentasi ${imgIndex + 1}`} />
                      ) : (
                        <div className="w-full h-[120px] bg-gray-100 rounded border flex items-center justify-center">
                          <span className="text-gray-400 text-xs">Memuat...</span>
                        </div>
                      )}
                      <figcaption>Gambar {imgIndex + 1}</figcaption>
                    </figure>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </section>

      {/* BAB III: PENUTUP */}
      <section className="mb-4 compact-section">
        <h3 className="text-sm font-bold mb-2">BAB III. PENUTUP</h3>
        
        <div className="space-y-2 text-justify text-[11pt] leading-snug">
          <div>
            <h4 className="font-semibold text-[11pt] mb-0.5">A. Rekomendasi</h4>
            <div className="pl-4 rich-text-content" dangerouslySetInnerHTML={{ __html: laporan.rekomendasi }} />
          </div>

          <div>
            <h4 className="font-semibold text-[11pt] mb-0.5">B. Ucapan Terima Kasih</h4>
            <div className="pl-4 rich-text-content" dangerouslySetInnerHTML={{ __html: laporan.ucapanTerimakasih }} />
          </div>
        </div>
      </section>

      {/* Tanda Tangan */}
      <div className="signature-section flex justify-end avoid-break">
        <div className="signature-box">
          <p className="text-[11pt]">Bandung, {formatTanggalSingkat(new Date().toISOString())}</p>
          <p className="mt-0.5 text-[11pt]">Penanggung Jawab Kegiatan,</p>
          
          <div className="signature-space flex items-end justify-center">
            {/* Space for signature */}
          </div>
          
          <p className="font-semibold underline">
            {laporan.pelaksana?.[0]?.nama || '________________________'}
          </p>
          {laporan.pelaksana?.[0]?.nip && (
            <p className="text-sm">NIP. {laporan.pelaksana[0].nip}</p>
          )}
        </div>
      </div>

      {/* Mengetahui Section */}
      <div className="mt-4 border-t pt-4 avoid-break">
        <div className="flex justify-between">
          <div className="signature-box">
            <p className="text-[11pt]">Mengetahui,</p>
            <p className="text-[11pt]">Kepala Balai Bahasa Provinsi Jawa Barat</p>
            
            <div className="signature-space flex items-end justify-center">
              {/* Space for signature */}
            </div>
            
            <p className="font-semibold underline">________________________</p>
            <p className="text-sm">NIP. ________________________</p>
          </div>
        </div>
      </div>
    </>
  );
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
  
  // Ref untuk mengukur tinggi konten
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);
  const [pagesReady, setPagesReady] = useState(false);
  
  // A4 content height dalam pixel
  // Total A4: 297mm, Padding: 20mm top + 20mm bottom = 40mm
  // Area konten: 297mm - 40mm = 257mm
  // Browser 96 DPI: 1mm = 3.7795275591px
  // 257mm × 3.7795 ≈ 971px
  const A4_CONTENT_HEIGHT_PX = 971;

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

  // Mengukur tinggi konten untuk menentukan jumlah halaman
  useEffect(() => {
    // Delay measurement to ensure images are loaded
    const measureContent = () => {
      if (contentRef.current) {
        // Mengukur tinggi total konten
        const height = contentRef.current.scrollHeight;
        setContentHeight(height);
        setPagesReady(true);
      }
    };
    
    // Initial measurement
    const timer = setTimeout(measureContent, 100);
    
    // Re-measure when images load
    const handleImageLoad = () => {
      measureContent();
    };
    
    if (contentRef.current) {
      const images = contentRef.current.querySelectorAll('img');
      images.forEach(img => {
        if (!img.complete) {
          img.addEventListener('load', handleImageLoad);
        }
      });
    }
    
    return () => {
      clearTimeout(timer);
    };
  }, [displayLaporan, resolvedUraian]);

  // Hitung jumlah halaman yang dibutuhkan
  const totalPages = Math.max(1, Math.ceil(contentHeight / A4_CONTENT_HEIGHT_PX));
  
  // Generate array halaman untuk rendering
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i);

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
              onClick={() => router.push(laporanId ? `/laporan/majalah?id=${laporanId}` : '/laporan/majalah')}
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

      {/* 
        A4 Paper Preview - Multi-Page dengan JavaScript Pagination
        1. Render konten di container tersembunyi untuk mengukur tinggi
        2. Render halaman-halaman terpisah dengan viewport clipping
        3. Setiap halaman menampilkan bagian konten yang sesuai
      */}
      <div className="print-wrapper">
        {/* Hidden container untuk mengukur tinggi konten */}
        <div 
          ref={contentRef}
          className="content-measure"
          aria-hidden="true"
        >
          <LaporanDocumentContent 
            laporan={displayLaporan} 
            uraianKegiatan={resolvedUraian} 
          />
        </div>
        
        {/* Visible multi-page preview */}
        {pagesReady && pageNumbers.map((pageNum) => (
          <div key={pageNum} className="a4-page-wrapper">
            <div className="a4-page">
              <div 
                className="page-viewport"
                style={{
                  height: `${A4_CONTENT_HEIGHT_PX}px`,
                  overflow: 'hidden',
                }}
              >
                <div 
                  className="page-content"
                  style={{
                    transform: `translateY(-${pageNum * A4_CONTENT_HEIGHT_PX}px)`,
                  }}
                >
                  <LaporanDocumentContent 
                    laporan={displayLaporan} 
                    uraianKegiatan={resolvedUraian} 
                  />
                </div>
              </div>
            </div>
            
            {/* Page number indicator - di luar halaman */}
            <div className="print:hidden page-indicator">
              Halaman {pageNum + 1} dari {totalPages}
            </div>
          </div>
        ))}
        
        {/* Loading indicator sebelum pages ready */}
        {!pagesReady && (
          <div className="a4-page flex items-center justify-center">
            <div className="text-gray-400">Memuat preview...</div>
          </div>
        )}
        
        {/* Print-only: Single flowing content tanpa clipping */}
        <div className="print-content-only">
          <LaporanDocumentContent 
            laporan={displayLaporan} 
            uraianKegiatan={resolvedUraian} 
          />
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap');
        
        /* 
         * A4 Paper Multi-Page Preview
         * - Konten diukur di container tersembunyi
         * - Setiap halaman menampilkan bagian konten yang sesuai dengan viewport clipping
         * - Saat print, gunakan konten flowing normal
         */
        
        /* ========== WRAPPER ========== */
        .print-wrapper {
          background: #1f2937;
          min-height: 100vh;
          padding: 2rem 1rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2rem;
        }
        
        /* ========== HIDDEN MEASURE CONTAINER ========== */
        /* Container ini harus memiliki layout yang IDENTIK dengan area konten di dalam .a4-page */
        /* .a4-page width=210mm, padding=15mm kiri-kanan → konten width = 180mm */
        .content-measure {
          position: absolute;
          left: -9999px;
          top: 0;
          width: 180mm; /* Sama dengan lebar konten di dalam a4-page */
          visibility: hidden;
          pointer-events: none;
          
          /* Styling HARUS sama dengan a4-page content */
          font-family: 'Times New Roman', Times, serif;
          font-size: 11pt;
          line-height: 1.5;
          background: white;
        }
        
        /* ========== A4 PAGE ========== */
        .a4-page {
          /* Ukuran A4 */
          width: 210mm;
          height: 297mm; /* Fixed height untuk setiap halaman */
          
          /* Padding/margin kertas */
          padding: 20mm 15mm;
          
          /* Visual */
          background: white;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          
          /* Typography */
          font-family: 'Times New Roman', Times, serif;
          font-size: 11pt;
          line-height: 1.5;
          
          /* Box model */
          box-sizing: border-box;
          
          /* Overflow control */
          overflow: hidden;
          position: relative;
          flex-shrink: 0;
        }
        
        /* Page viewport - area yang menampilkan konten */
        .page-viewport {
          width: 100%;
          overflow: hidden;
          /* Height di-set via inline style */
        }
        
        /* Page content - konten yang bisa di-transform untuk pagination */
        .page-content {
          width: 180mm; /* Sama dengan content-measure */
          /* Transform di-set via inline style */
        }
        
        /* A4 Page Wrapper */
        .a4-page-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        /* Page number indicator - di luar halaman */
        .page-indicator {
          text-align: center;
          font-size: 10pt;
          color: #9ca3af;
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }
        
        /* Print-only content - hidden on screen */
        .print-content-only {
          display: none;
        }
        
        /* Kop Surat */
        .kop-surat {
          padding-bottom: 12px;
          margin-bottom: 12px;
        }
        
        /* ========== PRINT STYLES ========== */
        @media print {
          /* Hapus header/footer browser */
          @page {
            size: A4 portrait;
            margin: 0;
          }
          
          /* Force warna */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          html, body {
            width: 210mm;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          
          /* Sembunyikan elemen non-print */
          .no-print,
          .print\\:hidden {
            display: none !important;
          }
          
          /* Reset wrapper */
          .print-wrapper {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            display: block !important;
            gap: 0 !important;
          }
          
          /* Sembunyikan halaman preview multi-page */
          .a4-page {
            display: none !important;
          }
          
          /* Sembunyikan measurement container */
          .content-measure {
            display: none !important;
          }
          
          /* Tampilkan print-only content dengan styling A4 */
          .print-content-only {
            display: block !important;
            width: 210mm !important;
            padding: 20mm 15mm !important;
            margin: 0 !important;
            background: white !important;
            font-family: 'Times New Roman', Times, serif;
            font-size: 11pt;
            line-height: 1.5;
          }
          
          /* Page break controls */
          .avoid-break {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          
          h1, h2, h3, h4, h5, h6 {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
          
          img, figure {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          
          .signature-section,
          .kop-surat {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          
          section {
            page-break-inside: auto;
          }
          
          p {
            orphans: 3;
            widows: 3;
          }
        }
        
        /* ========== MOBILE ========== */
        @media screen and (max-width: 800px) {
          .print-wrapper {
            padding: 1rem;
          }
          
          .a4-page {
            width: 100%;
            min-height: auto;
            padding: 15mm 10mm;
            font-size: 10pt;
          }
        }
        
        /* ========== CONTENT STYLES ========== */
        .rich-text-content p {
          margin-bottom: 0.5em;
        }
        
        .rich-text-content ul,
        .rich-text-content ol {
          margin-left: 1.5em;
          margin-bottom: 0.5em;
        }
        
        .rich-text-content li {
          margin-bottom: 0.25em;
        }
        
        /* Dokumentasi grid */
        .dokumentasi-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-top: 8px;
        }
        
        .dokumentasi-grid figure {
          break-inside: avoid;
          page-break-inside: avoid;
        }
        
        .dokumentasi-grid img {
          width: 100%;
          height: auto;
          max-height: 150px;
          object-fit: contain;
          background: #f9fafb;
          border-radius: 4px;
          border: 1px solid #e5e7eb;
        }
        
        .dokumentasi-grid figcaption {
          font-size: 9pt;
          color: #6b7280;
          text-align: center;
          margin-top: 4px;
        }
        
        /* Signature */
        .signature-section {
          margin-top: 2rem;
          break-inside: avoid;
          page-break-inside: avoid;
        }
        
        .signature-box {
          text-align: center;
        }
        
        .signature-space {
          height: 60px;
        }
        
        /* Section spacing */
        .compact-section {
          margin-bottom: 1em;
        }
      `}</style>
    </>
  );
}
