/**
 * Buat Laporan Page
 * SIKILAT - Sistem Informasi Laporan Kegiatan Terintegrasi
 * 
 * Halaman untuk membuat laporan kegiatan baru.
 * Menggunakan react-hook-form untuk manajemen state form.
 */

'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useLaporan } from '@/context/LaporanContext';
import { LaporanFormInput } from '@/types/laporan';
import { getLaporanById } from '@/services/laporanService';
import FormInput from '@/components/FormInput';
import ImageUpload from '@/components/ImageUpload';
import LoadingSpinner from '@/components/LoadingSpinner';
import RichTextEditor from '@/components/RichTextEditor';

function BuatLaporanContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get('id');
  
  const { submitForm, isLoading, error, setError, saveDraftData, isDraftSaved } = useLaporan();
  const [images, setImages] = useState<string[]>([]);
  const [isLoadingDraft, setIsLoadingDraft] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'warning'>('success');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingStatus, setEditingStatus] = useState<string | null>(null);

  // Generate tanggal hari ini dalam format DD/MM/YYYY
  const getTodayDate = () => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = String(today.getFullYear());
    return `${day}/${month}/${year}`;
  };

  // Konversi tanggal dari berbagai format ke DD/MM/YYYY
  const formatToDisplayDate = (dateString: string): string => {
    if (!dateString) return getTodayDate();
    
    // Jika sudah dalam format DD/MM/YYYY, kembalikan langsung
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
      return dateString;
    }
    
    // Parse tanggal dari berbagai format
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return getTodayDate();
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear());
    return `${day}/${month}/${year}`;
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch,
    setValue,
    control,
  } = useForm<LaporanFormInput>({
    defaultValues: {
      namaKegiatan: '',
      tanggal: getTodayDate(), // Set tanggal default ke hari ini
      waktuMulai: '',
      waktuSelesai: '',
      lokasi: '',
      deskripsi: '',
      penanggungJawab: '',
      jabatanPenanggungJawab: '',
      nipPenanggungJawab: '',
      pendahuluan: '',
      sumberPendanaan: '',
      rekomendasi: '',
      ucapanTerimakasih: '',
    },
  });

  // Watch form values for auto-save
  const formValues = watch();

  // Load draft by ID from URL if provided
  useEffect(() => {
    const loadDraftById = async () => {
      if (!draftId) return;
      
      setIsLoadingDraft(true);
      try {
        const response = await getLaporanById(draftId);
        if (response.success && response.data) {
          const draft = response.data;
          
          // Store the ID and status for later use when submitting
          setEditingId(draftId);
          setEditingStatus(draft.status || 'draft');
          
          // Populate form with draft data
          setValue('namaKegiatan', draft.namaKegiatan || '');
          setValue('tanggal', formatToDisplayDate(draft.uraianKegiatan?.[0]?.tanggal || ''));
          setValue('waktuMulai', draft.waktuMulai || '');
          setValue('waktuSelesai', draft.waktuSelesai || '');
          setValue('lokasi', draft.tempatPelaksanaan || '');
          setValue('deskripsi', draft.uraianKegiatan?.[0]?.deskripsi || '');
          setValue('penanggungJawab', draft.pelaksana?.[0]?.nama || '');
          setValue('jabatanPenanggungJawab', draft.pelaksana?.[0]?.jabatan || '');
          setValue('nipPenanggungJawab', draft.pelaksana?.[0]?.nip || '');
          setValue('pendahuluan', draft.pendahuluan || '');
          setValue('sumberPendanaan', draft.sumberPendanaan || '');
          setValue('rekomendasi', draft.rekomendasi || '');
          setValue('ucapanTerimakasih', draft.ucapanTerimakasih || '');
          
          if (draft.uraianKegiatan?.[0]?.gambar) {
            setImages(draft.uraianKegiatan[0].gambar);
          }
        }
      } catch (err) {
        console.error('Error loading draft:', err);
      } finally {
        setIsLoadingDraft(false);
      }
    };
    
    loadDraftById();
  }, [draftId, setValue]);

  // Auto-save draft every 30 seconds
  useEffect(() => {
    if (!isDirty) return;
    
    const autoSaveInterval = setInterval(() => {
      saveDraftData(formValues);
    }, 30000);

    return () => clearInterval(autoSaveInterval);
  }, [isDirty, formValues, saveDraftData]);

  const onSubmit = async (data: LaporanFormInput) => {
    setError(null);
    
    const formData: LaporanFormInput = {
      ...data,
      gambarPreview: images,
    };

    // Pass the editing ID if we're editing an existing report
    const result = await submitForm(formData, undefined, editingId || undefined);
    
    if (result.success) {
      // Jika ada warning (gambar gagal upload), tampilkan popup dulu
      if (result.warning) {
        setToastType('warning');
        setToastMessage(result.warning);
        setShowToast(true);
        // Tetap redirect setelah user menutup popup
        setTimeout(() => {
          router.push('/laporan');
        }, 100);
      } else {
        router.push('/laporan');
      }
    }
  };

  const handleSaveDraft = async () => {
    const result = await saveDraftData({
      ...formValues,
      gambarPreview: images,
    });
    
    if (result.warning) {
      setToastType('warning');
      setToastMessage(`Draft disimpan, namun ${result.warning}`);
    } else {
      setToastType('success');
      setToastMessage('Draft berhasil disimpan!');
    }
    setShowToast(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* Modal Popup Notification */}
      {showToast && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
            onClick={() => setShowToast(false)}
          />
          
          {/* Modal Content */}
          <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-sm mx-4 animate-pop-in">
            {/* Icon - Success or Warning */}
            <div className="flex justify-center mb-4">
              {toastType === 'success' ? (
                <div className="bg-green-100 rounded-full p-4">
                  <div className="bg-green-500 rounded-full p-3">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-100 rounded-full p-4">
                  <div className="bg-yellow-500 rounded-full p-3">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
            
            {/* Message */}
            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
              {toastType === 'success' ? 'Berhasil!' : 'Peringatan'}
            </h3>
            <p className="text-gray-600 text-center mb-6">{toastMessage}</p>
            
            {/* Button */}
            <button 
              onClick={() => setShowToast(false)}
              className={`w-full font-semibold py-3 px-6 rounded-xl transition-colors text-white ${
                toastType === 'success' 
                  ? 'bg-green-500 hover:bg-green-600' 
                  : 'bg-yellow-500 hover:bg-yellow-600'
              }`}
            >
              OK
            </button>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/"
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <div className="bg-blue-600 text-white p-3 rounded-lg">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Buat Laporan Baru</h1>
                <p className="text-gray-600">Isi form untuk membuat laporan kegiatan</p>
              </div>
            </div>
          </div>
          {isDraftSaved && (
            <div className="mt-4 text-sm text-green-600 flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Draft tersimpan otomatis
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Informasi Kegiatan */}
          <section className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
              📋 Informasi Kegiatan
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <FormInput
                  label="Nama Kegiatan"
                  name="namaKegiatan"
                  placeholder="Contoh: Workshop Penulisan Ilmiah"
                  required
                  register={register}
                  error={errors.namaKegiatan}
                />
              </div>
              <FormInput
                label="Tanggal Pelaksanaan"
                name="tanggal"
                type="text"
                required
                register={register}
                error={errors.tanggal}
                disabled={true}
              />
              <FormInput
                label="Lokasi/Tempat"
                name="lokasi"
                placeholder="Contoh: Aula Balai Bahasa Jawa Barat"
                required
                register={register}
                error={errors.lokasi}
              />
              <FormInput
                label="Waktu Mulai"
                name="waktuMulai"
                type="text"
                placeholder="Contoh: 08:00 WIB"
                required
                register={register}
                error={errors.waktuMulai}
              />
              <FormInput
                label="Waktu Selesai"
                name="waktuSelesai"
                type="text"
                placeholder="Contoh: 16:00 WIB"
                required
                register={register}
                error={errors.waktuSelesai}
              />
            </div>
          </section>

          {/* Pendahuluan */}
          <section className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
              📝 Pendahuluan
            </h2>
            <div className="space-y-4">
              <Controller
                name="pendahuluan"
                control={control}
                rules={{ required: 'Pendahuluan wajib diisi' }}
                render={({ field }) => (
                  <RichTextEditor
                    label="Latar Belakang / Dasar Hukum / Tujuan"
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Tuliskan latar belakang kegiatan, dasar hukum pelaksanaan (SK, Peraturan), serta tujuan kegiatan..."
                    required
                    error={errors.pendahuluan}
                    minHeight="180px"
                    helpText="Anda dapat menggunakan format tebal, miring, dan daftar untuk menyusun konten"
                  />
                )}
              />
              <FormInput
                label="Sumber Pendanaan"
                name="sumberPendanaan"
                placeholder="Contoh: DIPA Balai Bahasa Provinsi Jawa Barat Tahun 2024"
                required
                register={register}
                error={errors.sumberPendanaan}
              />
            </div>
          </section>

          {/* Pelaksana */}
          <section className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
              👤 Penanggung Jawab
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label="Nama Penanggung Jawab"
                name="penanggungJawab"
                placeholder="Contoh: Dr. Ahmad Sudrajat, M.Pd."
                required
                register={register}
                error={errors.penanggungJawab}
              />
              <FormInput
                label="Jabatan"
                name="jabatanPenanggungJawab"
                placeholder="Contoh: Kepala Seksi Pengembangan"
                required
                register={register}
                error={errors.jabatanPenanggungJawab}
              />
              <FormInput
                label="NIP"
                name="nipPenanggungJawab"
                placeholder="Contoh: 197501152001121001"
                register={register}
                error={errors.nipPenanggungJawab}
                helpText="Opsional"
              />
            </div>
          </section>

          {/* Uraian Kegiatan */}
          <section className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
              📄 Uraian Kegiatan
            </h2>
            <Controller
              name="deskripsi"
              control={control}
              rules={{ required: 'Deskripsi Kegiatan wajib diisi' }}
              render={({ field }) => (
                <RichTextEditor
                  label="Deskripsi Kegiatan"
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Jelaskan proses pelaksanaan kegiatan secara detail..."
                  required
                  error={errors.deskripsi}
                  minHeight="200px"
                />
              )}
            />
          </section>

          {/* Dokumentasi */}
          <section className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
              📷 Dokumentasi Kegiatan
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Upload foto dokumentasi kegiatan (maksimal 5 foto)
            </p>
            <ImageUpload
              onImagesChange={setImages}
              maxImages={5}
              existingImages={images}
            />
          </section>

          {/* Penutup */}
          <section className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
              📌 Penutup
            </h2>
            <div className="space-y-4">
              <Controller
                name="rekomendasi"
                control={control}
                rules={{ required: 'Rekomendasi wajib diisi' }}
                render={({ field }) => (
                  <RichTextEditor
                    label="Rekomendasi"
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Tuliskan rekomendasi untuk Balai Bahasa Provinsi Jawa Barat/Badan Pengembangan dan Pembinaan Bahasa..."
                    required
                    error={errors.rekomendasi}
                    minHeight="150px"
                  />
                )}
              />
              <Controller
                name="ucapanTerimakasih"
                control={control}
                rules={{ required: 'Ucapan Terima Kasih wajib diisi' }}
                render={({ field }) => (
                  <RichTextEditor
                    label="Ucapan Terima Kasih"
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Tuliskan ucapan terima kasih kepada pihak-pihak terkait..."
                    required
                    error={errors.ucapanTerimakasih}
                    minHeight="120px"
                  />
                )}
              />
            </div>
          </section>

          {/* Action Buttons */}
          <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
            {/* Output Format Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>💡 Tips:</strong> Setelah submit, Anda dapat memilih format output: 
                <span className="font-medium"> Surat Resmi (A4)</span> atau 
                <span className="font-medium"> Majalah (visual modern)</span>
              </p>
            </div>
            
            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={isLoading}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg
                         hover:bg-gray-50 transition-colors duration-200
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                💾 Simpan Draft
              </button>
              <button
                type="button"
                onClick={() => reset()}
                disabled={isLoading}
                className="px-6 py-2.5 border border-red-300 text-red-700 rounded-lg
                         hover:bg-red-50 transition-colors duration-200
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🔄 Reset Form
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-8 py-2.5 bg-blue-600 text-white rounded-lg
                         hover:bg-blue-700 transition-colors duration-200
                         disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    📤 Submit & Lihat Laporan
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Loading Draft Overlay */}
      {isLoadingDraft && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-8 flex flex-col items-center gap-4">
            <LoadingSpinner size="lg" />
            <p className="text-gray-700">Memuat draft...</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-8 flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-700">Memuat halaman...</p>
      </div>
    </div>
  );
}

// Export with Suspense wrapper for useSearchParams
export default function BuatLaporanPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <BuatLaporanContent />
    </Suspense>
  );
}