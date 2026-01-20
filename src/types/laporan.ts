/**
 * Type definitions for SIKILAT - Sistem Informasi Laporan Kegiatan Terintegrasi
 * 
 * File ini berisi semua type definitions yang digunakan dalam aplikasi
 * untuk memastikan type safety di seluruh codebase.
 */

// ==================== LAPORAN TYPES ====================

/**
 * Type untuk satu hari kegiatan
 */
export interface UraianHari {
  hari: number;
  tanggal: string;
  deskripsi: string;
  gambar?: string[]; // Array of image URLs or base64 strings
}

/**
 * Type untuk data pelaksana kegiatan
 */
export interface Pelaksana {
  nama: string;
  jabatan: string;
  nip?: string;
}

/**
 * Type untuk lampiran dokumen
 */
export interface Lampiran {
  nama: string;
  jenis: 'SK' | 'ST' | 'UNDANGAN' | 'DAFTAR_HADIR' | 'BERITA_ACARA' | 'LAINNYA';
  file?: string; // URL or base64
}

/**
 * Type utama untuk data Laporan Kegiatan
 */
export interface LaporanType {
  id?: string;
  
  // Header
  namaKegiatan: string;
  
  // Pendahuluan
  pendahuluan: string; // Gabungan latar belakang, dasar hukum, dan tujuan
  waktuMulai: string;
  waktuSelesai: string;
  tempatPelaksanaan: string;
  pelaksana: Pelaksana[];
  sumberPendanaan: string;
  
  // Uraian Kegiatan
  uraianKegiatan: UraianHari[];
  
  // Penutup
  rekomendasi: string;
  ucapanTerimakasih: string;
  
  // Lampiran
  lampiran?: Lampiran[];
  
  // Metadata
  createdAt?: string;
  updatedAt?: string;
  status?: 'draft' | 'submitted' | 'approved';
  createdBy?: string;
}

/**
 * Type untuk form input (simplified version untuk form pertama)
 */
export interface LaporanFormInput {
  namaKegiatan: string;
  tanggal: string;
  waktuMulai: string;
  waktuSelesai: string;
  lokasi: string;
  deskripsi: string;
  penanggungJawab: string;
  jabatanPenanggungJawab: string;
  nipPenanggungJawab?: string;
  pendahuluan: string; // Gabungan latar belakang, dasar hukum, dan tujuan
  sumberPendanaan: string;
  rekomendasi: string;
  ucapanTerimakasih: string;
  gambar?: FileList | string[];
  gambarPreview?: string[];
}

/**
 * Type untuk response dari Firebase/service
 */
export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  warning?: string; // Warning message (e.g., some images failed to upload)
}

/**
 * Type untuk user/pembuat laporan
 */
export interface User {
  id: string;
  nama: string;
  email: string;
  jabatan: string;
  role: 'pelaksana' | 'ketua_tim' | 'bendahara' | 'ksu' | 'kepala';
}

/**
 * Type untuk status pantauan laporan
 */
export interface StatusPantauan {
  laporanId: string;
  namaKegiatan: string;
  status: 'belum_mulai' | 'sedang_berjalan' | 'selesai' | 'terlambat';
  progress: number; // 0-100
  lastUpdated: string;
  pelaksana: string;
}
