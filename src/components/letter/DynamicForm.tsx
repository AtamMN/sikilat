/**
 * DynamicForm Component
 * Merender form yang berbeda berdasarkan jenis surat yang dipilih
 */

'use client';

import React, { useState, useRef, useCallback } from 'react';
import { 
  LetterType, 
  LetterData, 
  SuratUndanganData, 
  SuratTugasData, 
  SpkLemburData,
  LaporanRBDData,
  LaporanKegiatanData,
  Pegawai,
  PegawaiLembur,
  PelaksanaKegiatan,
  GambarDokumentasi
} from '@/types/letter';
import { validateImageFile } from '@/services/imageService';

interface DynamicFormProps {
  selectedType: LetterType;
  data: Partial<LetterData>;
  onChange: (data: Partial<LetterData>) => void;
}

// ==================== INPUT COMPONENTS ====================

interface InputFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'date' | 'time' | 'textarea';
  placeholder?: string;
  required?: boolean;
  rows?: number;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required = false,
  rows = 3
}) => {
  const baseClasses = "w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors";
  
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {type === 'textarea' ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className={baseClasses + " resize-none"}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={baseClasses}
        />
      )}
    </div>
  );
};

// ==================== IMAGE UPLOAD WITH CAPTION ====================

interface ImageUploadWithCaptionProps {
  images: GambarDokumentasi[];
  onChange: (images: GambarDokumentasi[]) => void;
  maxImages?: number;
}

const ImageUploadWithCaption: React.FC<ImageUploadWithCaptionProps> = ({
  images,
  onChange,
  maxImages = 5,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files) return;
    
    setError(null);
    const remainingSlots = maxImages - images.length;

    if (files.length > remainingSlots) {
      setError(`Maksimal ${maxImages} gambar. Sisa slot: ${remainingSlots}`);
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    const newImages: GambarDokumentasi[] = [];

    for (const file of filesToProcess) {
      const validation = validateImageFile(file);
      if (!validation.success) {
        setError(validation.message || 'File tidak valid');
        continue;
      }

      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.readAsDataURL(file);
      });

      const base64 = await base64Promise;
      newImages.push({
        url: base64,
        caption: `Dokumentasi ${images.length + newImages.length + 1}`,
      });
    }

    onChange([...images, ...newImages]);
  }, [images, maxImages, onChange]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleRemove = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
  };

  const handleCaptionChange = (index: number, caption: string) => {
    const newImages = [...images];
    newImages[index] = { ...newImages[index], caption };
    onChange(newImages);
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {images.length < maxImages && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors
            ${isDragging 
              ? 'border-indigo-500 bg-indigo-50' 
              : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
            }
          `}
        >
          <svg className="w-10 h-10 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm text-gray-600">
            <span className="text-indigo-600 font-medium">Klik untuk upload</span> atau drag & drop
          </p>
          <p className="text-xs text-gray-500 mt-1">PNG, JPG, JPEG (max 5MB)</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}

      {/* Image Previews with Captions */}
      {images.length > 0 && (
        <div className="space-y-4">
          {images.map((img, index) => (
            <div key={index} className="border border-gray-200 rounded-xl overflow-hidden bg-white">
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.caption}
                  className="w-full h-auto block"
                />
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 text-white text-xs rounded">
                  Foto {index + 1}
                </div>
              </div>
              <div className="p-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Keterangan Foto
                </label>
                <input
                  type="text"
                  value={img.caption}
                  onChange={(e) => handleCaptionChange(index, e.target.value)}
                  placeholder="Masukkan keterangan foto..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-sm"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Counter */}
      <p className="text-xs text-gray-500 text-right">
        {images.length} / {maxImages} foto
      </p>
    </div>
  );
};

// ==================== SURAT UNDANGAN FORM ====================

interface SuratUndanganFormProps {
  data: Partial<SuratUndanganData>;
  onChange: (data: Partial<SuratUndanganData>) => void;
}

const SuratUndanganForm: React.FC<SuratUndanganFormProps> = ({ data, onChange }) => {
  const updateField = <K extends keyof SuratUndanganData>(
    field: K, 
    value: SuratUndanganData[K]
  ) => {
    onChange({ ...data, [field]: value });
  };
  
  return (
    <div className="space-y-6">
      {/* Section: Header Surat */}
      <div className="bg-gray-50 p-4 rounded-xl">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm">1</span>
          Header Surat
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Nomor Surat"
            value={data.nomorSurat || ''}
            onChange={(v) => updateField('nomorSurat', v)}
            placeholder="B-xxx/H.27/..."
            required
          />
          <InputField
            label="Lampiran"
            value={data.lampiran || ''}
            onChange={(v) => updateField('lampiran', v)}
            placeholder="1 (satu) berkas"
          />
          <div className="md:col-span-2">
            <InputField
              label="Perihal"
              value={data.perihal || ''}
              onChange={(v) => updateField('perihal', v)}
              placeholder="Undangan Rapat / Permohonan Narasumber"
              required
            />
          </div>
        </div>
      </div>
      
      {/* Section: Tujuan */}
      <div className="bg-gray-50 p-4 rounded-xl">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm">2</span>
          Tujuan Surat
        </h3>
        <div className="grid grid-cols-1 gap-4">
          <InputField
            label="Nama Penerima"
            value={data.tujuanNama || ''}
            onChange={(v) => updateField('tujuanNama', v)}
            placeholder="Yth. Bapak/Ibu..."
            required
          />
          <InputField
            label="Jabatan (opsional)"
            value={data.tujuanJabatan || ''}
            onChange={(v) => updateField('tujuanJabatan', v)}
            placeholder="Kepala Bidang..."
          />
          <InputField
            label="Alamat (opsional)"
            value={data.tujuanAlamat || ''}
            onChange={(v) => updateField('tujuanAlamat', v)}
            placeholder="di Tempat"
          />
        </div>
      </div>
      
      {/* Section: Detail Acara */}
      <div className="bg-gray-50 p-4 rounded-xl">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm">3</span>
          Detail Acara
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Hari"
            value={data.hari || ''}
            onChange={(v) => updateField('hari', v)}
            placeholder="Senin"
            required
          />
          <InputField
            label="Tanggal"
            value={data.tanggal || ''}
            onChange={(v) => updateField('tanggal', v)}
            type="date"
            required
          />
          <InputField
            label="Pukul"
            value={data.pukul || ''}
            onChange={(v) => updateField('pukul', v)}
            placeholder="09.00 - 12.00 WIB"
            required
          />
          <InputField
            label="Tempat"
            value={data.tempat || ''}
            onChange={(v) => updateField('tempat', v)}
            placeholder="Ruang Rapat Lt. 2"
            required
          />
          <div className="md:col-span-2">
            <InputField
              label="Acara"
              value={data.acara || ''}
              onChange={(v) => updateField('acara', v)}
              placeholder="Rapat Koordinasi..."
              required
            />
          </div>
        </div>
      </div>
      
      {/* Section: Konten */}
      <div className="bg-gray-50 p-4 rounded-xl">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm">4</span>
          Konten Surat
        </h3>
        <div className="space-y-4">
          <InputField
            label="Paragraf Pembuka"
            value={data.paragrafPembuka || ''}
            onChange={(v) => updateField('paragrafPembuka', v)}
            type="textarea"
            rows={3}
          />
          <InputField
            label="Paragraf Penutup"
            value={data.paragrafPenutup || ''}
            onChange={(v) => updateField('paragrafPenutup', v)}
            type="textarea"
            rows={3}
          />
        </div>
      </div>
      
      {/* Section: Penandatangan */}
      <div className="bg-gray-50 p-4 rounded-xl">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm">5</span>
          Penandatangan
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Tempat Surat"
            value={data.tempatSurat || ''}
            onChange={(v) => updateField('tempatSurat', v)}
            placeholder="Bandung"
          />
          <InputField
            label="Tanggal Surat"
            value={data.tanggalSurat || ''}
            onChange={(v) => updateField('tanggalSurat', v)}
            type="date"
          />
          <InputField
            label="Nama Penandatangan"
            value={data.penandatangan?.nama || ''}
            onChange={(v) => updateField('penandatangan', { ...data.penandatangan!, nama: v })}
            placeholder="Dr. ..."
            required
          />
          <InputField
            label="NIP"
            value={data.penandatangan?.nip || ''}
            onChange={(v) => updateField('penandatangan', { ...data.penandatangan!, nip: v })}
            placeholder="19xxxxxxxxxx"
          />
          <div className="md:col-span-2">
            <InputField
              label="Jabatan"
              value={data.penandatangan?.jabatan || ''}
              onChange={(v) => updateField('penandatangan', { ...data.penandatangan!, jabatan: v })}
              placeholder="Kepala Balai Bahasa Provinsi Jawa Barat"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== SURAT TUGAS FORM ====================

interface SuratTugasFormProps {
  data: Partial<SuratTugasData>;
  onChange: (data: Partial<SuratTugasData>) => void;
}

const SuratTugasForm: React.FC<SuratTugasFormProps> = ({ data, onChange }) => {
  const updateField = <K extends keyof SuratTugasData>(
    field: K, 
    value: SuratTugasData[K]
  ) => {
    onChange({ ...data, [field]: value });
  };
  
  const addDasarHukum = () => {
    const current = data.dasarHukum || [];
    updateField('dasarHukum', [...current, '']);
  };
  
  const removeDasarHukum = (index: number) => {
    const current = data.dasarHukum || [];
    updateField('dasarHukum', current.filter((_, i) => i !== index));
  };
  
  const updateDasarHukum = (index: number, value: string) => {
    const current = [...(data.dasarHukum || [])];
    current[index] = value;
    updateField('dasarHukum', current);
  };
  
  const addPegawai = () => {
    const current = data.daftarPegawai || [];
    updateField('daftarPegawai', [...current, { nama: '', nip: '', jabatan: '', golongan: '' }]);
  };
  
  const removePegawai = (index: number) => {
    const current = data.daftarPegawai || [];
    updateField('daftarPegawai', current.filter((_, i) => i !== index));
  };
  
  const updatePegawai = (index: number, field: keyof Pegawai, value: string) => {
    const current = [...(data.daftarPegawai || [])];
    current[index] = { ...current[index], [field]: value };
    updateField('daftarPegawai', current);
  };
  
  return (
    <div className="space-y-6">
      {/* Section: Header */}
      <div className="bg-gray-50 p-4 rounded-xl">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm">1</span>
          Header Surat
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Nomor Surat"
            value={data.nomorSurat || ''}
            onChange={(v) => updateField('nomorSurat', v)}
            placeholder="ST-xxx/H.27/..."
            required
          />
          <InputField
            label="Tanggal Surat"
            value={data.tanggalSurat || ''}
            onChange={(v) => updateField('tanggalSurat', v)}
            type="date"
          />
        </div>
      </div>
      
      {/* Section: Dasar Hukum */}
      <div className="bg-gray-50 p-4 rounded-xl">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm">2</span>
          Dasar Hukum
        </h3>
        <div className="space-y-3">
          {(data.dasarHukum || ['']).map((dasar, index) => (
            <div key={index} className="flex gap-2">
              <div className="flex-1">
                <InputField
                  label={`Dasar ${index + 1}`}
                  value={dasar}
                  onChange={(v) => updateDasarHukum(index, v)}
                  placeholder="Peraturan/SK/Undang-undang..."
                />
              </div>
              {(data.dasarHukum?.length || 0) > 1 && (
                <button
                  type="button"
                  onClick={() => removeDasarHukum(index)}
                  className="mt-6 px-3 py-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addDasarHukum}
            className="w-full py-2 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
          >
            + Tambah Dasar Hukum
          </button>
        </div>
      </div>
      
      {/* Section: Daftar Pegawai */}
      <div className="bg-gray-50 p-4 rounded-xl">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm">3</span>
          Daftar Pegawai yang Ditugaskan
        </h3>
        <div className="space-y-4">
          {(data.daftarPegawai || []).map((pegawai, index) => (
            <div key={index} className="bg-white p-4 rounded-xl border border-gray-200">
              <div className="flex justify-between items-center mb-3">
                <span className="font-medium text-gray-700">Pegawai {index + 1}</span>
                {(data.daftarPegawai?.length || 0) > 1 && (
                  <button
                    type="button"
                    onClick={() => removePegawai(index)}
                    className="px-2 py-1 text-red-600 hover:bg-red-50 rounded transition-colors text-sm"
                  >
                    Hapus
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <InputField
                  label="Nama"
                  value={pegawai.nama}
                  onChange={(v) => updatePegawai(index, 'nama', v)}
                  required
                />
                <InputField
                  label="NIP"
                  value={pegawai.nip || ''}
                  onChange={(v) => updatePegawai(index, 'nip', v)}
                />
                <InputField
                  label="Jabatan"
                  value={pegawai.jabatan || ''}
                  onChange={(v) => updatePegawai(index, 'jabatan', v)}
                />
                <InputField
                  label="Golongan"
                  value={pegawai.golongan || ''}
                  onChange={(v) => updatePegawai(index, 'golongan', v)}
                />
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addPegawai}
            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Tambah Pegawai
          </button>
        </div>
      </div>
      
      {/* Section: Detail Tugas */}
      <div className="bg-gray-50 p-4 rounded-xl">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm">4</span>
          Detail Tugas
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <InputField
              label="Tujuan Tugas"
              value={data.tujuanTugas || ''}
              onChange={(v) => updateField('tujuanTugas', v)}
              type="textarea"
              placeholder="Untuk melaksanakan..."
              required
            />
          </div>
          <InputField
            label="Tempat Tugas"
            value={data.tempatTugas || ''}
            onChange={(v) => updateField('tempatTugas', v)}
            placeholder="Balai Bahasa Provinsi Jawa Barat"
          />
          <InputField
            label="Keterangan"
            value={data.keterangan || ''}
            onChange={(v) => updateField('keterangan', v)}
            placeholder="(opsional)"
          />
          <InputField
            label="Waktu Mulai"
            value={data.waktuMulai || ''}
            onChange={(v) => updateField('waktuMulai', v)}
            type="date"
            required
          />
          <InputField
            label="Waktu Selesai"
            value={data.waktuSelesai || ''}
            onChange={(v) => updateField('waktuSelesai', v)}
            type="date"
            required
          />
        </div>
      </div>
      
      {/* Section: Penandatangan */}
      <div className="bg-gray-50 p-4 rounded-xl">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm">5</span>
          Penandatangan
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Nama"
            value={data.penandatangan?.nama || ''}
            onChange={(v) => updateField('penandatangan', { ...data.penandatangan!, nama: v })}
            required
          />
          <InputField
            label="NIP"
            value={data.penandatangan?.nip || ''}
            onChange={(v) => updateField('penandatangan', { ...data.penandatangan!, nip: v })}
          />
          <div className="md:col-span-2">
            <InputField
              label="Jabatan"
              value={data.penandatangan?.jabatan || ''}
              onChange={(v) => updateField('penandatangan', { ...data.penandatangan!, jabatan: v })}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== SPK LEMBUR FORM ====================

interface SpkLemburFormProps {
  data: Partial<SpkLemburData>;
  onChange: (data: Partial<SpkLemburData>) => void;
}

const SpkLemburForm: React.FC<SpkLemburFormProps> = ({ data, onChange }) => {
  const updateField = <K extends keyof SpkLemburData>(
    field: K, 
    value: SpkLemburData[K]
  ) => {
    onChange({ ...data, [field]: value });
  };
  
  const addPegawai = () => {
    const current = data.daftarPegawai || [];
    const today = new Date().toISOString().split('T')[0];
    updateField('daftarPegawai', [...current, {
      nama: '',
      nip: '',
      jabatan: '',
      golongan: '',
      tanggalLembur: today,
      waktuMulai: '',
      waktuSelesai: '',
      uraianPekerjaan: ''
    }]);
  };
  
  const removePegawai = (index: number) => {
    const current = data.daftarPegawai || [];
    updateField('daftarPegawai', current.filter((_, i) => i !== index));
  };
  
  const updatePegawai = (index: number, field: keyof PegawaiLembur, value: string) => {
    const current = [...(data.daftarPegawai || [])];
    current[index] = { ...current[index], [field]: value };
    updateField('daftarPegawai', current);
  };
  
  return (
    <div className="space-y-6">
      {/* Section: Header */}
      <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-sm">1</span>
          Header SPK Lembur
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Nomor SPK"
            value={data.nomorSurat || ''}
            onChange={(v) => updateField('nomorSurat', v)}
            placeholder="SPK-xxx/H.27/..."
            required
          />
          <InputField
            label="Tanggal SPK"
            value={data.tanggalSurat || ''}
            onChange={(v) => updateField('tanggalSurat', v)}
            type="date"
          />
        </div>
      </div>
      
      {/* Section: Daftar Pegawai Lembur */}
      <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-sm">2</span>
          Daftar Pegawai Lembur
        </h3>
        <div className="space-y-4">
          {(data.daftarPegawai || []).map((pegawai, index) => (
            <div key={index} className="bg-white p-4 rounded-xl border border-amber-300">
              <div className="flex justify-between items-center mb-3">
                <span className="font-medium text-gray-700">Pegawai {index + 1}</span>
                {(data.daftarPegawai?.length || 0) > 1 && (
                  <button
                    type="button"
                    onClick={() => removePegawai(index)}
                    className="px-2 py-1 text-red-600 hover:bg-red-50 rounded transition-colors text-sm"
                  >
                    Hapus
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <InputField
                  label="Nama"
                  value={pegawai.nama}
                  onChange={(v) => updatePegawai(index, 'nama', v)}
                  required
                />
                <InputField
                  label="NIP"
                  value={pegawai.nip || ''}
                  onChange={(v) => updatePegawai(index, 'nip', v)}
                />
                <InputField
                  label="Jabatan"
                  value={pegawai.jabatan || ''}
                  onChange={(v) => updatePegawai(index, 'jabatan', v)}
                />
                <InputField
                  label="Golongan"
                  value={pegawai.golongan || ''}
                  onChange={(v) => updatePegawai(index, 'golongan', v)}
                />
                <InputField
                  label="Tanggal Lembur"
                  value={pegawai.tanggalLembur}
                  onChange={(v) => updatePegawai(index, 'tanggalLembur', v)}
                  type="date"
                  required
                />
                <InputField
                  label="Waktu Mulai"
                  value={pegawai.waktuMulai}
                  onChange={(v) => updatePegawai(index, 'waktuMulai', v)}
                  type="time"
                  required
                />
                <InputField
                  label="Waktu Selesai"
                  value={pegawai.waktuSelesai}
                  onChange={(v) => updatePegawai(index, 'waktuSelesai', v)}
                  type="time"
                  required
                />
                <div className="md:col-span-2 lg:col-span-3">
                  <InputField
                    label="Uraian Pekerjaan"
                    value={pegawai.uraianPekerjaan}
                    onChange={(v) => updatePegawai(index, 'uraianPekerjaan', v)}
                    type="textarea"
                    rows={2}
                    required
                  />
                </div>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addPegawai}
            className="w-full py-3 border-2 border-dashed border-amber-400 rounded-xl text-amber-700 hover:border-amber-500 hover:bg-amber-50 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Tambah Pegawai Lembur
          </button>
        </div>
      </div>
      
      {/* Section: Penandatangan */}
      <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-sm">3</span>
          Penandatangan
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Nama"
            value={data.penandatangan?.nama || ''}
            onChange={(v) => updateField('penandatangan', { ...data.penandatangan!, nama: v })}
            required
          />
          <InputField
            label="NIP"
            value={data.penandatangan?.nip || ''}
            onChange={(v) => updateField('penandatangan', { ...data.penandatangan!, nip: v })}
          />
          <div className="md:col-span-2">
            <InputField
              label="Jabatan"
              value={data.penandatangan?.jabatan || ''}
              onChange={(v) => updateField('penandatangan', { ...data.penandatangan!, jabatan: v })}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== LAPORAN RBD FORM ====================

interface LaporanRBDFormProps {
  data: Partial<LaporanRBDData>;
  onChange: (data: Partial<LaporanRBDData>) => void;
}

const LaporanRBDForm: React.FC<LaporanRBDFormProps> = ({ data, onChange }) => {
  const updateField = <K extends keyof LaporanRBDData>(
    field: K, 
    value: LaporanRBDData[K]
  ) => {
    onChange({ ...data, [field]: value });
  };
  
  return (
    <div className="space-y-6">
      {/* Section: Surat Pengantar */}
      <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm">1</span>
          Surat Pengantar
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Nomor Surat"
            value={data.nomorSurat || ''}
            onChange={(v) => updateField('nomorSurat', v)}
            placeholder="B-xxx/H.27/..."
            required
          />
          <InputField
            label="Tanggal Surat"
            value={data.tanggalSurat || ''}
            onChange={(v) => updateField('tanggalSurat', v)}
            type="date"
          />
          <div className="md:col-span-2">
            <InputField
              label="Perihal"
              value={data.perihal || ''}
              onChange={(v) => updateField('perihal', v)}
              placeholder="Permohonan Laporan RBD..."
              required
            />
          </div>
        </div>
      </div>
      
      {/* Section: Tujuan */}
      <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm">2</span>
          Tujuan
        </h3>
        <div className="grid grid-cols-1 gap-4">
          <InputField
            label="Nama Penerima"
            value={data.tujuanNama || ''}
            onChange={(v) => updateField('tujuanNama', v)}
            required
          />
          <InputField
            label="Jabatan"
            value={data.tujuanJabatan || ''}
            onChange={(v) => updateField('tujuanJabatan', v)}
          />
        </div>
      </div>
      
      {/* Section: Konten */}
      <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm">3</span>
          Konten Pengantar
        </h3>
        <InputField
          label="Paragraf Pengantar"
          value={data.paragrafPengantar || ''}
          onChange={(v) => updateField('paragrafPengantar', v)}
          type="textarea"
          rows={5}
          placeholder="Dengan hormat, bersama ini kami sampaikan..."
        />
      </div>
      
      {/* Section: Penandatangan */}
      <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm">4</span>
          Penandatangan
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Nama"
            value={data.penandatangan?.nama || ''}
            onChange={(v) => updateField('penandatangan', { ...data.penandatangan!, nama: v })}
            required
          />
          <InputField
            label="NIP"
            value={data.penandatangan?.nip || ''}
            onChange={(v) => updateField('penandatangan', { ...data.penandatangan!, nip: v })}
          />
          <div className="md:col-span-2">
            <InputField
              label="Jabatan"
              value={data.penandatangan?.jabatan || ''}
              onChange={(v) => updateField('penandatangan', { ...data.penandatangan!, jabatan: v })}
            />
          </div>
        </div>
      </div>
      
      {/* Info Lampiran */}
      <div className="bg-purple-100 p-4 rounded-xl border border-purple-300">
        <div className="flex items-start gap-3">
          <span className="text-2xl">📎</span>
          <div>
            <h4 className="font-medium text-purple-900">Mode Lampiran Aktif</h4>
            <p className="text-sm text-purple-700 mt-1">
              Dokumen ini akan di-generate dengan format multi-halaman. 
              Lampiran dapat ditambahkan setelah surat pengantar selesai.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== LAPORAN KEGIATAN FORM ====================

interface LaporanKegiatanFormProps {
  data: Partial<LaporanKegiatanData>;
  onChange: (data: Partial<LaporanKegiatanData>) => void;
}

const LaporanKegiatanForm: React.FC<LaporanKegiatanFormProps> = ({ data, onChange }) => {
  const updateField = <K extends keyof LaporanKegiatanData>(
    field: K, 
    value: LaporanKegiatanData[K]
  ) => {
    onChange({ ...data, [field]: value });
  };
  
  const updatePelaksana = (index: number, field: keyof PelaksanaKegiatan, value: string) => {
    const newPelaksana = [...(data.pelaksana || [{ nama: '', jabatan: '', nip: '' }])];
    newPelaksana[index] = { ...newPelaksana[index], [field]: value };
    updateField('pelaksana', newPelaksana);
  };
  
  const addPelaksana = () => {
    const newPelaksana = [...(data.pelaksana || []), { nama: '', jabatan: '', nip: '' }];
    updateField('pelaksana', newPelaksana);
  };
  
  const removePelaksana = (index: number) => {
    const newPelaksana = (data.pelaksana || []).filter((_, i) => i !== index);
    updateField('pelaksana', newPelaksana.length > 0 ? newPelaksana : [{ nama: '', jabatan: '', nip: '' }]);
  };
  
  return (
    <div className="space-y-6">
      {/* Section 1: Informasi Kegiatan */}
      <div className="bg-gray-50 p-4 rounded-xl">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm">1</span>
          Informasi Kegiatan
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <InputField
              label="Nama Kegiatan"
              value={data.namaKegiatan || ''}
              onChange={(v) => updateField('namaKegiatan', v)}
              placeholder="Contoh: Workshop Penulisan Ilmiah"
              required
            />
          </div>
          <InputField
            label="Tanggal Pelaksanaan"
            value={data.tanggal || ''}
            onChange={(v) => updateField('tanggal', v)}
            type="date"
            required
          />
          <InputField
            label="Lokasi/Tempat"
            value={data.lokasi || ''}
            onChange={(v) => updateField('lokasi', v)}
            placeholder="Contoh: Aula Balai Bahasa Jawa Barat"
            required
          />
          <InputField
            label="Waktu Mulai"
            value={data.waktuMulai || ''}
            onChange={(v) => updateField('waktuMulai', v)}
            placeholder="Contoh: 08:00 WIB"
            required
          />
          <InputField
            label="Waktu Selesai"
            value={data.waktuSelesai || ''}
            onChange={(v) => updateField('waktuSelesai', v)}
            placeholder="Contoh: 16:00 WIB"
            required
          />
        </div>
      </div>
      
      {/* Section 2: Pendahuluan */}
      <div className="bg-gray-50 p-4 rounded-xl">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm">2</span>
          Pendahuluan
        </h3>
        <div className="space-y-4">
          <InputField
            label="Latar Belakang / Dasar Hukum / Tujuan"
            value={data.pendahuluan || ''}
            onChange={(v) => updateField('pendahuluan', v)}
            type="textarea"
            placeholder="Tuliskan latar belakang kegiatan, dasar hukum pelaksanaan (SK, Peraturan), serta tujuan kegiatan..."
            rows={6}
            required
          />
          <InputField
            label="Sumber Pendanaan"
            value={data.sumberPendanaan || ''}
            onChange={(v) => updateField('sumberPendanaan', v)}
            placeholder="Contoh: DIPA Balai Bahasa Provinsi Jawa Barat Tahun 2026"
            required
          />
        </div>
      </div>
      
      {/* Section 3: Penanggung Jawab */}
      <div className="bg-gray-50 p-4 rounded-xl">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm">3</span>
          Penanggung Jawab / Pelaksana
        </h3>
        <div className="space-y-4">
          {(data.pelaksana || [{ nama: '', jabatan: '', nip: '' }]).map((pelaksana, index) => (
            <div key={index} className="p-4 border border-gray-200 rounded-xl bg-white">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-medium text-gray-600">Pelaksana #{index + 1}</span>
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => removePelaksana(index)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Hapus
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InputField
                  label="Nama"
                  value={pelaksana.nama || ''}
                  onChange={(v) => updatePelaksana(index, 'nama', v)}
                  placeholder="Contoh: Dr. Ahmad Sudrajat, M.Pd."
                  required
                />
                <InputField
                  label="Jabatan"
                  value={pelaksana.jabatan || ''}
                  onChange={(v) => updatePelaksana(index, 'jabatan', v)}
                  placeholder="Contoh: Kepala Seksi Pengembangan"
                  required
                />
                <InputField
                  label="NIP (opsional)"
                  value={pelaksana.nip || ''}
                  onChange={(v) => updatePelaksana(index, 'nip', v)}
                  placeholder="Contoh: 197501152001121001"
                />
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addPelaksana}
            className="w-full py-2 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
          >
            + Tambah Pelaksana
          </button>
        </div>
      </div>
      
      {/* Section 4: Uraian Kegiatan */}
      <div className="bg-gray-50 p-4 rounded-xl">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm">4</span>
          Uraian Kegiatan
        </h3>
        <InputField
          label="Deskripsi Kegiatan"
          value={data.deskripsi || ''}
          onChange={(v) => updateField('deskripsi', v)}
          type="textarea"
          placeholder="Jelaskan proses pelaksanaan kegiatan secara detail..."
          rows={8}
          required
        />
      </div>
      
      {/* Section 5: Dokumentasi */}
      <div className="bg-gray-50 p-4 rounded-xl">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm">5</span>
          Dokumentasi Kegiatan
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Upload foto dokumentasi kegiatan (maksimal 5 foto)
        </p>
        <ImageUploadWithCaption
          images={data.gambar || []}
          onChange={(images) => updateField('gambar', images)}
          maxImages={5}
        />
      </div>
      
      {/* Section 6: Penutup */}
      <div className="bg-gray-50 p-4 rounded-xl">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm">6</span>
          Penutup
        </h3>
        <div className="space-y-4">
          <InputField
            label="Rekomendasi"
            value={data.rekomendasi || ''}
            onChange={(v) => updateField('rekomendasi', v)}
            type="textarea"
            placeholder="Tuliskan rekomendasi untuk Balai Bahasa Provinsi Jawa Barat/Badan Pengembangan dan Pembinaan Bahasa..."
            rows={5}
            required
          />
          <InputField
            label="Ucapan Terima Kasih"
            value={data.ucapanTerimakasih || ''}
            onChange={(v) => updateField('ucapanTerimakasih', v)}
            type="textarea"
            placeholder="Tuliskan ucapan terima kasih kepada pihak-pihak terkait..."
            rows={4}
            required
          />
        </div>
      </div>
      
      {/* Info */}
      <div className="bg-indigo-100 p-4 rounded-xl border border-indigo-300">
        <div className="flex items-start gap-3">
          <span className="text-2xl">📝</span>
          <div>
            <h4 className="font-medium text-indigo-900">Format Laporan Kegiatan</h4>
            <p className="text-sm text-indigo-700 mt-1">
              Laporan ini akan di-generate dengan format resmi yang mencakup pendahuluan, 
              uraian kegiatan, dokumentasi foto, dan penutup lengkap dengan rekomendasi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== MAIN COMPONENT ====================

export const DynamicForm: React.FC<DynamicFormProps> = ({
  selectedType,
  data,
  onChange
}) => {
  switch (selectedType) {
    case 'undangan':
      return (
        <SuratUndanganForm 
          data={data as Partial<SuratUndanganData>} 
          onChange={onChange as (d: Partial<SuratUndanganData>) => void}
        />
      );
    case 'surat_tugas':
      return (
        <SuratTugasForm 
          data={data as Partial<SuratTugasData>} 
          onChange={onChange as (d: Partial<SuratTugasData>) => void}
        />
      );
    case 'spk_lembur':
      return (
        <SpkLemburForm 
          data={data as Partial<SpkLemburData>} 
          onChange={onChange as (d: Partial<SpkLemburData>) => void}
        />
      );
    case 'laporan_rbd':
      return (
        <LaporanRBDForm 
          data={data as Partial<LaporanRBDData>} 
          onChange={onChange as (d: Partial<LaporanRBDData>) => void}
        />
      );
    case 'laporan_kegiatan':
      return (
        <LaporanKegiatanForm 
          data={data as Partial<LaporanKegiatanData>} 
          onChange={onChange as (d: Partial<LaporanKegiatanData>) => void}
        />
      );
    default:
      return null;
  }
};

export default DynamicForm;
