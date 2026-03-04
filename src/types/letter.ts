/**
 * Type definitions untuk Sistem Pembuatan Surat
 * SIKILAT - Sistem Informasi Laporan Kegiatan Terintegrasi
 */

// ==================== LETTER TYPE ENUM ====================

export type LetterType = 
  | 'undangan'      // Surat Undangan/Permohonan (Format Narasi)
  | 'surat_tugas'   // Surat Tugas/Perintah (Format Tabel Umum)
  | 'spk_lembur'    // SPK Lembur (Format Tabel Khusus)
  | 'laporan_rbd'   // Permohonan Laporan RBD (Format Multi-halaman/Lampiran)
  | 'laporan_kegiatan';  // Laporan Kegiatan (Format sama dengan buat-laporan)

export interface LetterTypeOption {
  value: LetterType;
  label: string;
  description: string;
  icon: string;
}

export const LETTER_TYPE_OPTIONS: LetterTypeOption[] = [
  {
    value: 'undangan',
    label: 'Surat Undangan/Permohonan',
    description: 'Format narasi untuk undangan rapat, permohonan narasumber, dll.',
    icon: '📨'
  },
  {
    value: 'surat_tugas',
    label: 'Surat Tugas/Perintah',
    description: 'Format tabel untuk penugasan pegawai dengan daftar nama.',
    icon: '📋'
  },
  {
    value: 'spk_lembur',
    label: 'SPK Lembur',
    description: 'Surat Perintah Kerja Lembur dengan format tabel khusus.',
    icon: '⏰'
  },
  {
    value: 'laporan_rbd',
    label: 'Permohonan Laporan RBD',
    description: 'Format multi-halaman dengan lampiran untuk laporan resmi.',
    icon: '📑'
  },
  {
    value: 'laporan_kegiatan',
    label: 'Laporan Kegiatan',
    description: 'Format laporan kegiatan lengkap dengan pendahuluan, uraian, dan penutup.',
    icon: '📝'
  }
];

// ==================== COMMON TYPES ====================

export interface Pegawai {
  nama: string;
  nip?: string;
  jabatan?: string;
  golongan?: string;
  unitKerja?: string;
}

export interface Penandatangan {
  nama: string;
  nip: string;
  jabatan: string;
}

// ==================== SURAT UNDANGAN ====================

export interface SuratUndanganData {
  type: 'undangan';
  
  // Header
  nomorSurat: string;
  lampiran?: string;
  perihal: string;
  
  // Tujuan
  tujuanNama: string;
  tujuanJabatan?: string;
  tujuanAlamat?: string;
  
  // Konten
  paragrafPembuka: string;
  
  // Detail Acara
  hari: string;
  tanggal: string;
  pukul: string;
  tempat: string;
  acara: string;
  
  // Penutup
  paragrafPenutup: string;
  
  // Penandatangan
  penandatangan: Penandatangan;
  
  // Metadata
  tanggalSurat: string;
  tempatSurat: string;
}

// ==================== SURAT TUGAS ====================

export interface SuratTugasData {
  type: 'surat_tugas';
  
  // Header
  nomorSurat: string;
  
  // Dasar
  dasarHukum: string[];
  
  // Daftar Pegawai
  daftarPegawai: Pegawai[];
  
  // Detail Tugas
  tujuanTugas: string;
  tempatTugas: string;
  waktuMulai: string;
  waktuSelesai: string;
  
  // Keterangan Tambahan
  keterangan?: string;
  
  // Penandatangan
  penandatangan: Penandatangan;
  
  // Metadata
  tanggalSurat: string;
  tempatSurat: string;
}

// ==================== SPK LEMBUR ====================

export interface PegawaiLembur extends Pegawai {
  tanggalLembur: string;
  waktuMulai: string;
  waktuSelesai: string;
  uraianPekerjaan: string;
}

export interface SpkLemburData {
  type: 'spk_lembur';
  
  // Header
  nomorSurat: string;
  
  // Dasar
  dasarHukum: string[];
  
  // Daftar Pegawai Lembur
  daftarPegawai: PegawaiLembur[];
  
  // Keterangan
  keterangan?: string;
  
  // Penandatangan
  penandatangan: Penandatangan;
  
  // Metadata
  tanggalSurat: string;
  tempatSurat: string;
}

// ==================== LAPORAN RBD ====================

export interface LampiranRBD {
  judul: string;
  konten: string;
  tipe: 'tabel' | 'narasi' | 'gambar';
}

export interface LaporanRBDData {
  type: 'laporan_rbd';
  
  // Surat Pengantar
  nomorSurat: string;
  perihal: string;
  tujuanNama: string;
  tujuanJabatan?: string;
  
  // Konten Pengantar
  paragrafPengantar: string;
  
  // Lampiran
  lampiran: LampiranRBD[];
  
  // Penandatangan
  penandatangan: Penandatangan;
  
  // Metadata
  tanggalSurat: string;
  tempatSurat: string;
}

// ==================== LAPORAN KEGIATAN ====================

export interface PelaksanaKegiatan {
  nama: string;
  jabatan: string;
  nip?: string;
}

export interface GambarDokumentasi {
  url: string;
  caption: string;
}

export interface LaporanKegiatanData {
  type: 'laporan_kegiatan';
  
  // Informasi Kegiatan
  namaKegiatan: string;
  tanggal: string;
  waktuMulai: string;
  waktuSelesai: string;
  lokasi: string;
  
  // Pendahuluan
  pendahuluan: string; // Latar Belakang / Dasar Hukum / Tujuan (rich text)
  sumberPendanaan: string;
  
  // Penanggung Jawab
  pelaksana: PelaksanaKegiatan[];
  
  // Uraian Kegiatan
  deskripsi: string; // Rich text
  
  // Dokumentasi
  gambar?: GambarDokumentasi[];
  
  // Penutup
  rekomendasi: string; // Rich text
  ucapanTerimakasih: string; // Rich text
  
  // Metadata
  tanggalSurat: string;
  tempatSurat: string;
}

// ==================== UNION TYPE ====================

export type LetterData = 
  | SuratUndanganData 
  | SuratTugasData 
  | SpkLemburData 
  | LaporanRBDData
  | LaporanKegiatanData;

// ==================== FORM STATE ====================

export interface LetterFormState {
  selectedType: LetterType | null;
  data: Partial<LetterData>;
  isValid: boolean;
  isDirty: boolean;
}

// ==================== HELPER FUNCTIONS ====================

export function getDefaultLetterData(type: LetterType): Partial<LetterData> {
  const today = new Date().toISOString().split('T')[0];
  
  const defaultPenandatangan: Penandatangan = {
    nama: '',
    nip: '',
    jabatan: 'Kepala Balai Bahasa Provinsi Jawa Barat'
  };
  
  switch (type) {
    case 'undangan':
      return {
        type: 'undangan',
        nomorSurat: '',
        perihal: '',
        tujuanNama: '',
        paragrafPembuka: 'Sehubungan dengan akan dilaksanakannya kegiatan sebagaimana tersebut di atas, kami mengundang Bapak/Ibu untuk hadir pada:',
        hari: '',
        tanggal: today,
        pukul: '',
        tempat: '',
        acara: '',
        paragrafPenutup: 'Demikian undangan ini kami sampaikan. Atas perhatian dan kehadiran Bapak/Ibu, kami ucapkan terima kasih.',
        penandatangan: defaultPenandatangan,
        tanggalSurat: today,
        tempatSurat: 'Bandung'
      } as Partial<SuratUndanganData>;
      
    case 'surat_tugas':
      return {
        type: 'surat_tugas',
        nomorSurat: '',
        dasarHukum: [''],
        daftarPegawai: [{ nama: '', nip: '', jabatan: '', golongan: '' }],
        tujuanTugas: '',
        tempatTugas: '',
        waktuMulai: today,
        waktuSelesai: today,
        penandatangan: defaultPenandatangan,
        tanggalSurat: today,
        tempatSurat: 'Bandung'
      } as Partial<SuratTugasData>;
      
    case 'spk_lembur':
      return {
        type: 'spk_lembur',
        nomorSurat: '',
        dasarHukum: [''],
        daftarPegawai: [{
          nama: '',
          nip: '',
          jabatan: '',
          golongan: '',
          tanggalLembur: today,
          waktuMulai: '',
          waktuSelesai: '',
          uraianPekerjaan: ''
        }],
        penandatangan: defaultPenandatangan,
        tanggalSurat: today,
        tempatSurat: 'Bandung'
      } as Partial<SpkLemburData>;
      
    case 'laporan_rbd':
      return {
        type: 'laporan_rbd',
        nomorSurat: '',
        perihal: '',
        tujuanNama: '',
        paragrafPengantar: '',
        lampiran: [],
        penandatangan: defaultPenandatangan,
        tanggalSurat: today,
        tempatSurat: 'Bandung'
      } as Partial<LaporanRBDData>;
      
    case 'laporan_kegiatan':
      return {
        type: 'laporan_kegiatan',
        namaKegiatan: '',
        tanggal: today,
        waktuMulai: '',
        waktuSelesai: '',
        lokasi: '',
        pendahuluan: '',
        sumberPendanaan: '',
        pelaksana: [{ nama: '', jabatan: '', nip: '' }],
        deskripsi: '',
        gambar: [],
        rekomendasi: '',
        ucapanTerimakasih: '',
        tanggalSurat: today,
        tempatSurat: 'Bandung'
      } as Partial<LaporanKegiatanData>;
      
    default:
      return {};
  }
}
