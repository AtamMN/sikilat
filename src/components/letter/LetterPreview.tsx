/**
 * LetterPreview Component
 * Live preview surat dengan format A4 yang sesuai dengan data form
 */

'use client';

import React from 'react';
import { 
  LetterType,
  LetterData,
  SuratUndanganData,
  SuratTugasData,
  SpkLemburData,
  LaporanRBDData
} from '@/types/letter';

// ==================== HELPER FUNCTIONS ====================

const formatTanggal = (dateString: string): string => {
  if (!dateString) return '_______________';
  
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

const formatHari = (dateString: string): string => {
  if (!dateString) return '________';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { weekday: 'long' });
  } catch {
    return dateString;
  }
};

// ==================== KOP SURAT COMPONENT ====================

const KopSurat: React.FC = () => (
  <header className="kop-surat mb-4">
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
    <hr className="border-gray-400 mt-3" />
  </header>
);

// ==================== SURAT UNDANGAN PREVIEW ====================

interface SuratUndanganPreviewProps {
  data: Partial<SuratUndanganData>;
}

const SuratUndanganPreview: React.FC<SuratUndanganPreviewProps> = ({ data }) => {
  return (
    <div className="text-[11pt] leading-relaxed">
      <KopSurat />
      
      {/* Header Info */}
      <div className="flex justify-between mb-6">
        <div className="space-y-1">
          <p>Nomor &nbsp;&nbsp;&nbsp;: {data.nomorSurat || '_________________'}</p>
          <p>Lampiran : {data.lampiran || '-'}</p>
          <p>Perihal &nbsp;&nbsp;: {data.perihal || '_________________'}</p>
        </div>
        <div className="text-right">
          <p>{data.tempatSurat || 'Bandung'}, {formatTanggal(data.tanggalSurat || '')}</p>
        </div>
      </div>
      
      {/* Tujuan */}
      <div className="mb-6">
        <p>Yth. {data.tujuanNama || '_________________'}</p>
        {data.tujuanJabatan && <p>{data.tujuanJabatan}</p>}
        <p>{data.tujuanAlamat || 'di Tempat'}</p>
      </div>
      
      {/* Paragraf Pembuka */}
      <div className="mb-4 text-justify">
        <p className="indent-8">
          {data.paragrafPembuka || 'Sehubungan dengan akan dilaksanakannya kegiatan sebagaimana tersebut di atas, kami mengundang Bapak/Ibu untuk hadir pada:'}
        </p>
      </div>
      
      {/* Detail Acara */}
      <div className="mb-6 pl-8">
        <table className="text-[11pt]">
          <tbody>
            <tr>
              <td className="pr-4 py-1">Hari</td>
              <td className="pr-2">:</td>
              <td>{data.hari || formatHari(data.tanggal || '')}</td>
            </tr>
            <tr>
              <td className="pr-4 py-1">Tanggal</td>
              <td className="pr-2">:</td>
              <td>{formatTanggal(data.tanggal || '')}</td>
            </tr>
            <tr>
              <td className="pr-4 py-1">Pukul</td>
              <td className="pr-2">:</td>
              <td>{data.pukul || '_____ WIB'}</td>
            </tr>
            <tr>
              <td className="pr-4 py-1">Tempat</td>
              <td className="pr-2">:</td>
              <td>{data.tempat || '_________________'}</td>
            </tr>
            <tr>
              <td className="pr-4 py-1">Acara</td>
              <td className="pr-2">:</td>
              <td>{data.acara || '_________________'}</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      {/* Paragraf Penutup */}
      <div className="mb-8 text-justify">
        <p className="indent-8">
          {data.paragrafPenutup || 'Demikian undangan ini kami sampaikan. Atas perhatian dan kehadiran Bapak/Ibu, kami ucapkan terima kasih.'}
        </p>
      </div>
      
      {/* Tanda Tangan */}
      <div className="flex justify-end">
        <div className="text-center">
          <p>{data.penandatangan?.jabatan || 'Kepala Balai Bahasa Provinsi Jawa Barat'}</p>
          <div className="h-16"></div>
          <p className="font-semibold underline">{data.penandatangan?.nama || '_________________'}</p>
          <p>NIP. {data.penandatangan?.nip || '_________________'}</p>
        </div>
      </div>
    </div>
  );
};

// ==================== SURAT TUGAS PREVIEW ====================

interface SuratTugasPreviewProps {
  data: Partial<SuratTugasData>;
}

const SuratTugasPreview: React.FC<SuratTugasPreviewProps> = ({ data }) => {
  return (
    <div className="text-[11pt] leading-relaxed">
      <KopSurat />
      
      {/* Judul */}
      <div className="text-center mb-6">
        <h2 className="font-bold text-base underline">SURAT TUGAS</h2>
        <p className="text-sm">Nomor: {data.nomorSurat || '_________________'}</p>
      </div>
      
      {/* Dasar */}
      <div className="mb-4">
        <p className="font-semibold mb-2">Dasar:</p>
        <ol className="list-decimal pl-8 space-y-1">
          {(data.dasarHukum || ['']).map((dasar, i) => (
            <li key={i}>{dasar || '_________________'}</li>
          ))}
        </ol>
      </div>
      
      {/* Memerintahkan */}
      <div className="text-center font-bold my-4">MEMERINTAHKAN</div>
      
      {/* Kepada */}
      <div className="mb-4">
        <p className="font-semibold mb-2">Kepada:</p>
        <table className="w-full border-collapse border border-gray-400 text-[10pt]">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-400 px-2 py-1 w-10">No</th>
              <th className="border border-gray-400 px-2 py-1">Nama</th>
              <th className="border border-gray-400 px-2 py-1">NIP</th>
              <th className="border border-gray-400 px-2 py-1">Jabatan</th>
              <th className="border border-gray-400 px-2 py-1">Golongan</th>
            </tr>
          </thead>
          <tbody>
            {(data.daftarPegawai || []).map((pegawai, i) => (
              <tr key={i}>
                <td className="border border-gray-400 px-2 py-1 text-center">{i + 1}</td>
                <td className="border border-gray-400 px-2 py-1">{pegawai.nama || '-'}</td>
                <td className="border border-gray-400 px-2 py-1">{pegawai.nip || '-'}</td>
                <td className="border border-gray-400 px-2 py-1">{pegawai.jabatan || '-'}</td>
                <td className="border border-gray-400 px-2 py-1">{pegawai.golongan || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Untuk */}
      <div className="mb-4">
        <p className="font-semibold mb-2">Untuk:</p>
        <p className="pl-4">{data.tujuanTugas || '_________________'}</p>
      </div>
      
      {/* Waktu & Tempat */}
      <div className="mb-6 pl-4">
        <table className="text-[11pt]">
          <tbody>
            <tr>
              <td className="pr-4 py-1">Tempat</td>
              <td className="pr-2">:</td>
              <td>{data.tempatTugas || '_________________'}</td>
            </tr>
            <tr>
              <td className="pr-4 py-1">Waktu</td>
              <td className="pr-2">:</td>
              <td>
                {formatTanggal(data.waktuMulai || '')} s.d. {formatTanggal(data.waktuSelesai || '')}
              </td>
            </tr>
            {data.keterangan && (
              <tr>
                <td className="pr-4 py-1">Keterangan</td>
                <td className="pr-2">:</td>
                <td>{data.keterangan}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Tanda Tangan */}
      <div className="flex justify-between mt-8">
        <div></div>
        <div className="text-center">
          <p>{data.tempatSurat || 'Bandung'}, {formatTanggal(data.tanggalSurat || '')}</p>
          <p>{data.penandatangan?.jabatan || 'Kepala Balai Bahasa Provinsi Jawa Barat'}</p>
          <div className="h-16"></div>
          <p className="font-semibold underline">{data.penandatangan?.nama || '_________________'}</p>
          <p>NIP. {data.penandatangan?.nip || '_________________'}</p>
        </div>
      </div>
    </div>
  );
};

// ==================== SPK LEMBUR PREVIEW ====================

interface SpkLemburPreviewProps {
  data: Partial<SpkLemburData>;
}

const SpkLemburPreview: React.FC<SpkLemburPreviewProps> = ({ data }) => {
  return (
    <div className="text-[11pt] leading-relaxed">
      <KopSurat />
      
      {/* Judul */}
      <div className="text-center mb-6">
        <h2 className="font-bold text-base underline">SURAT PERINTAH KERJA LEMBUR</h2>
        <p className="text-sm">Nomor: {data.nomorSurat || '_________________'}</p>
      </div>
      
      {/* Intro */}
      <p className="mb-4 text-justify">
        Kepala Balai Bahasa Provinsi Jawa Barat memerintahkan kepada pegawai yang namanya tercantum di 
        bawah ini untuk melaksanakan kerja lembur:
      </p>
      
      {/* Tabel Pegawai Lembur */}
      <div className="mb-6 overflow-x-auto">
        <table className="w-full border-collapse border border-gray-400 text-[9pt]">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-400 px-1 py-1 w-8">No</th>
              <th className="border border-gray-400 px-1 py-1">Nama/NIP</th>
              <th className="border border-gray-400 px-1 py-1">Jabatan</th>
              <th className="border border-gray-400 px-1 py-1">Gol</th>
              <th className="border border-gray-400 px-1 py-1">Tanggal</th>
              <th className="border border-gray-400 px-1 py-1">Waktu</th>
              <th className="border border-gray-400 px-1 py-1">Uraian Pekerjaan</th>
            </tr>
          </thead>
          <tbody>
            {(data.daftarPegawai || []).map((pegawai, i) => (
              <tr key={i}>
                <td className="border border-gray-400 px-1 py-1 text-center">{i + 1}</td>
                <td className="border border-gray-400 px-1 py-1">
                  <div>{pegawai.nama || '-'}</div>
                  <div className="text-[8pt] text-gray-600">{pegawai.nip || '-'}</div>
                </td>
                <td className="border border-gray-400 px-1 py-1">{pegawai.jabatan || '-'}</td>
                <td className="border border-gray-400 px-1 py-1 text-center">{pegawai.golongan || '-'}</td>
                <td className="border border-gray-400 px-1 py-1">{formatTanggal(pegawai.tanggalLembur)}</td>
                <td className="border border-gray-400 px-1 py-1">{pegawai.waktuMulai} - {pegawai.waktuSelesai}</td>
                <td className="border border-gray-400 px-1 py-1">{pegawai.uraianPekerjaan || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Keterangan */}
      {data.keterangan && (
        <p className="mb-6">Keterangan: {data.keterangan}</p>
      )}
      
      {/* Tanda Tangan */}
      <div className="flex justify-between mt-8">
        <div></div>
        <div className="text-center">
          <p>{data.tempatSurat || 'Bandung'}, {formatTanggal(data.tanggalSurat || '')}</p>
          <p>{data.penandatangan?.jabatan || 'Kepala Balai Bahasa Provinsi Jawa Barat'}</p>
          <div className="h-16"></div>
          <p className="font-semibold underline">{data.penandatangan?.nama || '_________________'}</p>
          <p>NIP. {data.penandatangan?.nip || '_________________'}</p>
        </div>
      </div>
    </div>
  );
};

// ==================== LAPORAN RBD PREVIEW ====================

interface LaporanRBDPreviewProps {
  data: Partial<LaporanRBDData>;
}

const LaporanRBDPreview: React.FC<LaporanRBDPreviewProps> = ({ data }) => {
  return (
    <div className="text-[11pt] leading-relaxed">
      <KopSurat />
      
      {/* Header Info */}
      <div className="flex justify-between mb-6">
        <div className="space-y-1">
          <p>Nomor &nbsp;&nbsp;: {data.nomorSurat || '_________________'}</p>
          <p>Lampiran : Tersedia</p>
          <p>Perihal &nbsp;: {data.perihal || '_________________'}</p>
        </div>
        <div className="text-right">
          <p>{data.tempatSurat || 'Bandung'}, {formatTanggal(data.tanggalSurat || '')}</p>
        </div>
      </div>
      
      {/* Tujuan */}
      <div className="mb-6">
        <p>Yth. {data.tujuanNama || '_________________'}</p>
        {data.tujuanJabatan && <p>{data.tujuanJabatan}</p>}
        <p>di Tempat</p>
      </div>
      
      {/* Konten */}
      <div className="mb-8 text-justify">
        <p className="indent-8 whitespace-pre-wrap">
          {data.paragrafPengantar || 'Dengan hormat, bersama ini kami sampaikan...'}
        </p>
      </div>
      
      {/* Info Lampiran */}
      <div className="mb-8 p-4 bg-purple-50 border border-purple-200 rounded">
        <p className="text-purple-800 text-sm flex items-center gap-2">
          <span>📎</span>
          <span>Lampiran akan ditampilkan di halaman berikutnya</span>
        </p>
      </div>
      
      {/* Tanda Tangan */}
      <div className="flex justify-end">
        <div className="text-center">
          <p>{data.penandatangan?.jabatan || 'Kepala Balai Bahasa Provinsi Jawa Barat'}</p>
          <div className="h-16"></div>
          <p className="font-semibold underline">{data.penandatangan?.nama || '_________________'}</p>
          <p>NIP. {data.penandatangan?.nip || '_________________'}</p>
        </div>
      </div>
    </div>
  );
};

// ==================== MAIN PREVIEW COMPONENT ====================

interface LetterPreviewProps {
  selectedType: LetterType | null;
  data: Partial<LetterData>;
}

export const LetterPreview: React.FC<LetterPreviewProps> = ({
  selectedType,
  data
}) => {
  if (!selectedType) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center text-gray-500 p-8">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-lg font-medium">Preview Surat</p>
          <p className="text-sm mt-1">Pilih jenis surat untuk melihat preview</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden print:shadow-none print:rounded-none">
      {/* Preview Header - Hidden in print */}
      <div className="bg-gray-800 text-white px-4 py-2 flex items-center justify-between no-print">
        <span className="text-sm font-medium">📄 Preview Surat</span>
        <span className="text-xs text-gray-400">A4 Format • Real-time</span>
      </div>
      
      {/* A4 Paper */}
      <div className="p-4 bg-gray-100 max-h-[80vh] overflow-auto print:p-0 print:bg-white print:max-h-none print:overflow-visible">
        <div 
          className="bg-white mx-auto shadow-md print:shadow-none print:m-0"
          style={{
            width: '210mm',
            minHeight: '297mm',
            padding: '20mm 15mm',
            fontFamily: "'Times New Roman', Times, serif",
            fontSize: '11pt',
            lineHeight: 1.5,
            boxSizing: 'border-box'
          }}
        >
          {selectedType === 'undangan' && (
            <SuratUndanganPreview data={data as Partial<SuratUndanganData>} />
          )}
          {selectedType === 'surat_tugas' && (
            <SuratTugasPreview data={data as Partial<SuratTugasData>} />
          )}
          {selectedType === 'spk_lembur' && (
            <SpkLemburPreview data={data as Partial<SpkLemburData>} />
          )}
          {selectedType === 'laporan_rbd' && (
            <LaporanRBDPreview data={data as Partial<LaporanRBDData>} />
          )}
        </div>
      </div>
    </div>
  );
};

export default LetterPreview;
