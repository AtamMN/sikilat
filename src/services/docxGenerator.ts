/**
 * DOCX Generator Service
 * Generates Word documents for various letter types
 */

import {
  Document,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  PageOrientation,
  convertMillimetersToTwip,
  UnderlineType,
} from 'docx';
import { saveAs } from 'file-saver';
import {
  LetterType,
  LetterData,
  SuratUndanganData,
  SuratTugasData,
  SpkLemburData,
  LaporanRBDData,
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

// A4 Page settings in twips (1 inch = 1440 twips)
const PAGE_WIDTH = convertMillimetersToTwip(210);
const PAGE_HEIGHT = convertMillimetersToTwip(297);
const MARGIN_TOP = convertMillimetersToTwip(20);
const MARGIN_BOTTOM = convertMillimetersToTwip(20);
const MARGIN_LEFT = convertMillimetersToTwip(15);
const MARGIN_RIGHT = convertMillimetersToTwip(15);

// ==================== KOP SURAT ====================

const createKopSurat = (): Paragraph[] => {
  return [
    new Paragraph({
      children: [
        new TextRun({
          text: 'Balai Bahasa Provinsi Jawa Barat',
          bold: true,
          size: 28, // 14pt
          color: '297bbf',
          font: 'Montserrat',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'Jalan Sumbawa Nomor 11 Bandung 40113',
          size: 18, // 9pt
          font: 'Montserrat',
        }),
      ],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'www.balaibahasajabar.kemdikdasmen.go.id | ☎ 177 | (022) 7271083',
          size: 18,
          font: 'Montserrat',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 12, color: '000000' },
      },
      spacing: { after: 300 },
    }),
  ];
};

// ==================== SURAT UNDANGAN GENERATOR ====================

const generateSuratUndangan = (data: Partial<SuratUndanganData>): Paragraph[] => {
  const paragraphs: Paragraph[] = [
    ...createKopSurat(),
    
    // Header Info - Left side
    new Paragraph({
      children: [
        new TextRun({ text: `Nomor    : ${data.nomorSurat || '_________________'}`, size: 22 }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `Lampiran : ${data.lampiran || '-'}`, size: 22 }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `Perihal   : ${data.perihal || '_________________'}`, size: 22 }),
      ],
      spacing: { after: 300 },
    }),
    
    // Tempat & Tanggal
    new Paragraph({
      children: [
        new TextRun({
          text: `${data.tempatSurat || 'Bandung'}, ${formatTanggal(data.tanggalSurat || '')}`,
          size: 22,
        }),
      ],
      alignment: AlignmentType.RIGHT,
      spacing: { after: 300 },
    }),
    
    // Tujuan
    new Paragraph({
      children: [
        new TextRun({ text: `Yth. ${data.tujuanNama || '_________________'}`, size: 22 }),
      ],
    }),
    ...(data.tujuanJabatan ? [
      new Paragraph({
        children: [new TextRun({ text: data.tujuanJabatan, size: 22 })],
      }),
    ] : []),
    new Paragraph({
      children: [
        new TextRun({ text: data.tujuanAlamat || 'di Tempat', size: 22 }),
      ],
      spacing: { after: 300 },
    }),
    
    // Paragraf Pembuka
    new Paragraph({
      children: [
        new TextRun({
          text: data.paragrafPembuka || 'Sehubungan dengan akan dilaksanakannya kegiatan sebagaimana tersebut di atas, kami mengundang Bapak/Ibu untuk hadir pada:',
          size: 22,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      indent: { firstLine: convertMillimetersToTwip(12.7) }, // 0.5 inch indent
      spacing: { after: 200 },
    }),
    
    // Detail Acara
    new Paragraph({
      children: [
        new TextRun({ text: `Hari       : ${data.hari || formatHari(data.tanggal || '')}`, size: 22 }),
      ],
      indent: { left: convertMillimetersToTwip(15) },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `Tanggal  : ${formatTanggal(data.tanggal || '')}`, size: 22 }),
      ],
      indent: { left: convertMillimetersToTwip(15) },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `Pukul      : ${data.pukul || '_____ WIB'}`, size: 22 }),
      ],
      indent: { left: convertMillimetersToTwip(15) },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `Tempat   : ${data.tempat || '_________________'}`, size: 22 }),
      ],
      indent: { left: convertMillimetersToTwip(15) },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `Acara      : ${data.acara || '_________________'}`, size: 22 }),
      ],
      indent: { left: convertMillimetersToTwip(15) },
      spacing: { after: 300 },
    }),
    
    // Paragraf Penutup
    new Paragraph({
      children: [
        new TextRun({
          text: data.paragrafPenutup || 'Demikian undangan ini kami sampaikan. Atas perhatian dan kehadiran Bapak/Ibu, kami ucapkan terima kasih.',
          size: 22,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      indent: { firstLine: convertMillimetersToTwip(12.7) },
      spacing: { after: 600 },
    }),
    
    // Tanda Tangan
    new Paragraph({
      children: [
        new TextRun({
          text: data.penandatangan?.jabatan || 'Kepala Balai Bahasa Provinsi Jawa Barat',
          size: 22,
        }),
      ],
      alignment: AlignmentType.RIGHT,
      indent: { left: convertMillimetersToTwip(100) },
    }),
    new Paragraph({
      spacing: { after: 600 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: data.penandatangan?.nama || '_________________',
          size: 22,
          bold: true,
          underline: { type: UnderlineType.SINGLE },
        }),
      ],
      alignment: AlignmentType.RIGHT,
      indent: { left: convertMillimetersToTwip(100) },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `NIP. ${data.penandatangan?.nip || '_________________'}`,
          size: 22,
        }),
      ],
      alignment: AlignmentType.RIGHT,
      indent: { left: convertMillimetersToTwip(100) },
    }),
  ];
  
  return paragraphs;
};

// ==================== SURAT TUGAS GENERATOR ====================

const generateSuratTugas = (data: Partial<SuratTugasData>): (Paragraph | Table)[] => {
  const elements: (Paragraph | Table)[] = [
    ...createKopSurat(),
    
    // Judul
    new Paragraph({
      children: [
        new TextRun({
          text: 'SURAT TUGAS',
          bold: true,
          size: 28,
          underline: { type: UnderlineType.SINGLE },
        }),
      ],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Nomor: ${data.nomorSurat || '_________________'}`,
          size: 22,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
    }),
    
    // Dasar
    new Paragraph({
      children: [
        new TextRun({ text: 'Dasar:', bold: true, size: 22 }),
      ],
      spacing: { after: 100 },
    }),
  ];
  
  // Dasar Hukum List
  (data.dasarHukum || ['']).forEach((dasar, i) => {
    elements.push(
      new Paragraph({
        children: [
          new TextRun({ text: `${i + 1}. ${dasar || '_________________'}`, size: 22 }),
        ],
        indent: { left: convertMillimetersToTwip(10) },
      })
    );
  });
  
  elements.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'MEMERINTAHKAN', bold: true, size: 22 }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 300, after: 300 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: 'Kepada:', bold: true, size: 22 }),
      ],
      spacing: { after: 200 },
    }),
  );
  
  // Tabel Pegawai
  const tableRows = [
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'No', bold: true, size: 20 })], alignment: AlignmentType.CENTER })], width: { size: 5, type: WidthType.PERCENTAGE } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Nama', bold: true, size: 20 })], alignment: AlignmentType.CENTER })], width: { size: 30, type: WidthType.PERCENTAGE } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'NIP', bold: true, size: 20 })], alignment: AlignmentType.CENTER })], width: { size: 25, type: WidthType.PERCENTAGE } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Jabatan', bold: true, size: 20 })], alignment: AlignmentType.CENTER })], width: { size: 25, type: WidthType.PERCENTAGE } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Golongan', bold: true, size: 20 })], alignment: AlignmentType.CENTER })], width: { size: 15, type: WidthType.PERCENTAGE } }),
      ],
    }),
  ];
  
  (data.daftarPegawai || []).forEach((pegawai, i) => {
    tableRows.push(
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${i + 1}`, size: 20 })], alignment: AlignmentType.CENTER })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: pegawai.nama || '-', size: 20 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: pegawai.nip || '-', size: 20 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: pegawai.jabatan || '-', size: 20 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: pegawai.golongan || '-', size: 20 })], alignment: AlignmentType.CENTER })] }),
        ],
      })
    );
  });
  
  elements.push(
    new Table({
      rows: tableRows,
      width: { size: 100, type: WidthType.PERCENTAGE },
    })
  );
  
  elements.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'Untuk:', bold: true, size: 22 }),
      ],
      spacing: { before: 300, after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: data.tujuanTugas || '_________________', size: 22 }),
      ],
      indent: { left: convertMillimetersToTwip(10) },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `Tempat  : ${data.tempatTugas || '_________________'}`, size: 22 }),
      ],
      indent: { left: convertMillimetersToTwip(10) },
      spacing: { before: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Waktu    : ${formatTanggal(data.waktuMulai || '')} s.d. ${formatTanggal(data.waktuSelesai || '')}`,
          size: 22,
        }),
      ],
      indent: { left: convertMillimetersToTwip(10) },
    }),
  );
  
  if (data.keterangan) {
    elements.push(
      new Paragraph({
        children: [
          new TextRun({ text: `Keterangan : ${data.keterangan}`, size: 22 }),
        ],
        indent: { left: convertMillimetersToTwip(10) },
      })
    );
  }
  
  // Tanda Tangan
  elements.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `${data.tempatSurat || 'Bandung'}, ${formatTanggal(data.tanggalSurat || '')}`,
          size: 22,
        }),
      ],
      alignment: AlignmentType.RIGHT,
      indent: { left: convertMillimetersToTwip(100) },
      spacing: { before: 400 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: data.penandatangan?.jabatan || 'Kepala Balai Bahasa Provinsi Jawa Barat',
          size: 22,
        }),
      ],
      alignment: AlignmentType.RIGHT,
      indent: { left: convertMillimetersToTwip(100) },
    }),
    new Paragraph({ spacing: { after: 600 } }),
    new Paragraph({
      children: [
        new TextRun({
          text: data.penandatangan?.nama || '_________________',
          size: 22,
          bold: true,
          underline: { type: UnderlineType.SINGLE },
        }),
      ],
      alignment: AlignmentType.RIGHT,
      indent: { left: convertMillimetersToTwip(100) },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `NIP. ${data.penandatangan?.nip || '_________________'}`,
          size: 22,
        }),
      ],
      alignment: AlignmentType.RIGHT,
      indent: { left: convertMillimetersToTwip(100) },
    }),
  );
  
  return elements;
};

// ==================== SPK LEMBUR GENERATOR ====================

const generateSpkLembur = (data: Partial<SpkLemburData>): (Paragraph | Table)[] => {
  const elements: (Paragraph | Table)[] = [
    ...createKopSurat(),
    
    // Judul
    new Paragraph({
      children: [
        new TextRun({
          text: 'SURAT PERINTAH KERJA LEMBUR',
          bold: true,
          size: 28,
          underline: { type: UnderlineType.SINGLE },
        }),
      ],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Nomor: ${data.nomorSurat || '_________________'}`,
          size: 22,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: 'Kepala Balai Bahasa Provinsi Jawa Barat memerintahkan kepada pegawai yang namanya tercantum di bawah ini untuk melaksanakan kerja lembur:',
          size: 22,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200 },
    }),
  ];
  
  // Tabel Pegawai Lembur
  const tableRows = [
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'No', bold: true, size: 18 })], alignment: AlignmentType.CENTER })], width: { size: 4, type: WidthType.PERCENTAGE } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Nama/NIP', bold: true, size: 18 })], alignment: AlignmentType.CENTER })], width: { size: 20, type: WidthType.PERCENTAGE } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Jabatan', bold: true, size: 18 })], alignment: AlignmentType.CENTER })], width: { size: 15, type: WidthType.PERCENTAGE } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Gol', bold: true, size: 18 })], alignment: AlignmentType.CENTER })], width: { size: 6, type: WidthType.PERCENTAGE } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Tanggal', bold: true, size: 18 })], alignment: AlignmentType.CENTER })], width: { size: 15, type: WidthType.PERCENTAGE } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Waktu', bold: true, size: 18 })], alignment: AlignmentType.CENTER })], width: { size: 12, type: WidthType.PERCENTAGE } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Uraian Pekerjaan', bold: true, size: 18 })], alignment: AlignmentType.CENTER })], width: { size: 28, type: WidthType.PERCENTAGE } }),
      ],
    }),
  ];
  
  (data.daftarPegawai || []).forEach((pegawai, i) => {
    tableRows.push(
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${i + 1}`, size: 18 })], alignment: AlignmentType.CENTER })] }),
          new TableCell({
            children: [
              new Paragraph({ children: [new TextRun({ text: pegawai.nama || '-', size: 18 })] }),
              new Paragraph({ children: [new TextRun({ text: pegawai.nip || '-', size: 16, italics: true })] }),
            ],
          }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: pegawai.jabatan || '-', size: 18 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: pegawai.golongan || '-', size: 18 })], alignment: AlignmentType.CENTER })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: formatTanggal(pegawai.tanggalLembur), size: 18 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${pegawai.waktuMulai || '-'} - ${pegawai.waktuSelesai || '-'}`, size: 18 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: pegawai.uraianPekerjaan || '-', size: 18 })] })] }),
        ],
      })
    );
  });
  
  elements.push(
    new Table({
      rows: tableRows,
      width: { size: 100, type: WidthType.PERCENTAGE },
    })
  );
  
  if (data.keterangan) {
    elements.push(
      new Paragraph({
        children: [
          new TextRun({ text: `Keterangan: ${data.keterangan}`, size: 22 }),
        ],
        spacing: { before: 200 },
      })
    );
  }
  
  // Tanda Tangan
  elements.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `${data.tempatSurat || 'Bandung'}, ${formatTanggal(data.tanggalSurat || '')}`,
          size: 22,
        }),
      ],
      alignment: AlignmentType.RIGHT,
      indent: { left: convertMillimetersToTwip(100) },
      spacing: { before: 400 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: data.penandatangan?.jabatan || 'Kepala Balai Bahasa Provinsi Jawa Barat',
          size: 22,
        }),
      ],
      alignment: AlignmentType.RIGHT,
      indent: { left: convertMillimetersToTwip(100) },
    }),
    new Paragraph({ spacing: { after: 600 } }),
    new Paragraph({
      children: [
        new TextRun({
          text: data.penandatangan?.nama || '_________________',
          size: 22,
          bold: true,
          underline: { type: UnderlineType.SINGLE },
        }),
      ],
      alignment: AlignmentType.RIGHT,
      indent: { left: convertMillimetersToTwip(100) },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `NIP. ${data.penandatangan?.nip || '_________________'}`,
          size: 22,
        }),
      ],
      alignment: AlignmentType.RIGHT,
      indent: { left: convertMillimetersToTwip(100) },
    }),
  );
  
  return elements;
};

// ==================== LAPORAN RBD GENERATOR ====================

const generateLaporanRBD = (data: Partial<LaporanRBDData>): Paragraph[] => {
  const paragraphs: Paragraph[] = [
    ...createKopSurat(),
    
    // Header Info
    new Paragraph({
      children: [
        new TextRun({ text: `Nomor    : ${data.nomorSurat || '_________________'}`, size: 22 }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Lampiran : Tersedia', size: 22 }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `Perihal   : ${data.perihal || '_________________'}`, size: 22 }),
      ],
      spacing: { after: 300 },
    }),
    
    // Tempat & Tanggal
    new Paragraph({
      children: [
        new TextRun({
          text: `${data.tempatSurat || 'Bandung'}, ${formatTanggal(data.tanggalSurat || '')}`,
          size: 22,
        }),
      ],
      alignment: AlignmentType.RIGHT,
      spacing: { after: 300 },
    }),
    
    // Tujuan
    new Paragraph({
      children: [
        new TextRun({ text: `Yth. ${data.tujuanNama || '_________________'}`, size: 22 }),
      ],
    }),
    ...(data.tujuanJabatan ? [
      new Paragraph({
        children: [new TextRun({ text: data.tujuanJabatan, size: 22 })],
      }),
    ] : []),
    new Paragraph({
      children: [
        new TextRun({ text: 'di Tempat', size: 22 }),
      ],
      spacing: { after: 300 },
    }),
    
    // Konten
    new Paragraph({
      children: [
        new TextRun({
          text: data.paragrafPengantar || 'Dengan hormat, bersama ini kami sampaikan...',
          size: 22,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      indent: { firstLine: convertMillimetersToTwip(12.7) },
      spacing: { after: 600 },
    }),
    
    // Tanda Tangan
    new Paragraph({
      children: [
        new TextRun({
          text: data.penandatangan?.jabatan || 'Kepala Balai Bahasa Provinsi Jawa Barat',
          size: 22,
        }),
      ],
      alignment: AlignmentType.RIGHT,
      indent: { left: convertMillimetersToTwip(100) },
    }),
    new Paragraph({ spacing: { after: 600 } }),
    new Paragraph({
      children: [
        new TextRun({
          text: data.penandatangan?.nama || '_________________',
          size: 22,
          bold: true,
          underline: { type: UnderlineType.SINGLE },
        }),
      ],
      alignment: AlignmentType.RIGHT,
      indent: { left: convertMillimetersToTwip(100) },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `NIP. ${data.penandatangan?.nip || '_________________'}`,
          size: 22,
        }),
      ],
      alignment: AlignmentType.RIGHT,
      indent: { left: convertMillimetersToTwip(100) },
    }),
  ];
  
  return paragraphs;
};

// ==================== MAIN EXPORT FUNCTION ====================

export async function generateDocx(
  letterType: LetterType,
  data: Partial<LetterData>,
  filename?: string
): Promise<void> {
  let children: (Paragraph | Table)[] = [];
  
  switch (letterType) {
    case 'undangan':
      children = generateSuratUndangan(data as Partial<SuratUndanganData>);
      break;
    case 'surat_tugas':
      children = generateSuratTugas(data as Partial<SuratTugasData>);
      break;
    case 'spk_lembur':
      children = generateSpkLembur(data as Partial<SpkLemburData>);
      break;
    case 'laporan_rbd':
      children = generateLaporanRBD(data as Partial<LaporanRBDData>);
      break;
    default:
      throw new Error(`Unknown letter type: ${letterType}`);
  }
  
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          size: {
            width: PAGE_WIDTH,
            height: PAGE_HEIGHT,
            orientation: PageOrientation.PORTRAIT,
          },
          margin: {
            top: MARGIN_TOP,
            bottom: MARGIN_BOTTOM,
            left: MARGIN_LEFT,
            right: MARGIN_RIGHT,
          },
        },
      },
      children,
    }],
  });
  
  // Generate and download
  const { Packer } = await import('docx');
  const blob = await Packer.toBlob(doc);
  
  const defaultFilename = `surat_${letterType}_${new Date().toISOString().split('T')[0]}.docx`;
  saveAs(blob, filename || defaultFilename);
}

export default generateDocx;
