/**
 * DOCX Generator Service
 * Generates Word documents per Permendikdasmen No 2 Tahun 2026
 * 
 * Specifications:
 * - Font: Arial 12pt
 * - Margins: Top 20mm, Bottom 25mm, Left 30mm, Right 20mm
 * - Paper: A4 (210 x 297mm)
 * - Signature: Position with comma, name without underline, no NIP
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
  PageOrientation,
  convertMillimetersToTwip,
  ImageRun,
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

// ==================== CONSTANTS ====================

// A4 Page settings per Permendikdasmen
const PAGE_WIDTH = convertMillimetersToTwip(210);
const PAGE_HEIGHT = convertMillimetersToTwip(297);
const MARGIN_TOP = convertMillimetersToTwip(7.4);    // 0.74 cm
const MARGIN_BOTTOM = convertMillimetersToTwip(4.9); // 0.49 cm
const MARGIN_LEFT = convertMillimetersToTwip(12.5);  // 1.25 cm
const MARGIN_RIGHT = convertMillimetersToTwip(7.5);  // 0.75 cm

// Font settings per Permendikdasmen for correspondence
const FONT_NAME = 'Arial';
const FONT_SIZE = 24; // 12pt in half-points

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

// Fetch KOP image as ArrayBuffer
const fetchKopImage = async (): Promise<ArrayBuffer | null> => {
  try {
    const response = await fetch('/assets/kop-sikilat.png');
    if (!response.ok) return null;
    return await response.arrayBuffer();
  } catch {
    console.error('Failed to fetch KOP image');
    return null;
  }
};

// ==================== KOP SURAT ====================
// KOP full image: kop-sikilat.png (1661x239 px, ratio 6.95:1)

const createKopSurat = async (): Promise<Paragraph[]> => {
  const kopBuffer = await fetchKopImage();
  
  const kopElements: Paragraph[] = [];
  
  if (kopBuffer) {
    // KOP image size: 18.88 cm x 2.7 cm (sesuai preview)
    // Conversion: ~37.78 units per cm
    // Width: 18.88 * 37.78 ≈ 713
    // Height: 2.7 * 37.78 ≈ 102
    kopElements.push(
      new Paragraph({
        children: [
          new ImageRun({
            data: kopBuffer,
            transformation: {
              width: 713,
              height: 102,
            },
            type: 'png',
          }),
        ],
      })
    );
  }
  
  // Spacing after KOP
  kopElements.push(
    new Paragraph({
      spacing: { after: 300 },
    })
  );
  
  return kopElements;
};

// ==================== SIGNATURE BLOCK ====================
// Per Permendikdasmen: jabatan dengan koma, nama tanpa garis bawah, tanpa NIP

const createSignatureBlock = (
  jabatan: string,
  nama: string,
  tempat?: string,
  tanggal?: string,
  includeDate: boolean = true
): Paragraph[] => {
  const signParagraphs: Paragraph[] = [];
  
  if (includeDate && tempat && tanggal) {
    signParagraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `${tempat}, ${formatTanggal(tanggal)}`,
            size: FONT_SIZE,
            font: FONT_NAME,
          }),
        ],
        alignment: AlignmentType.RIGHT,
        indent: { left: convertMillimetersToTwip(80) },
      })
    );
  }
  
  signParagraphs.push(
    // Position with comma
    new Paragraph({
      children: [
        new TextRun({
          text: `${jabatan},`,
          size: FONT_SIZE,
          font: FONT_NAME,
        }),
      ],
      alignment: AlignmentType.RIGHT,
      indent: { left: convertMillimetersToTwip(80) },
    }),
    // Signature space
    new Paragraph({
      spacing: { before: 600, after: 600 },
    }),
    // Name (no underline per Permendikdasmen)
    new Paragraph({
      children: [
        new TextRun({
          text: nama || '_________________',
          size: FONT_SIZE,
          font: FONT_NAME,
          bold: true,
        }),
      ],
      alignment: AlignmentType.RIGHT,
      indent: { left: convertMillimetersToTwip(80) },
    }),
  );
  
  return signParagraphs;
};

// ==================== SURAT UNDANGAN GENERATOR ====================

const generateSuratUndangan = async (data: Partial<SuratUndanganData>): Promise<(Paragraph | Table)[]> => {
  const kopSurat = await createKopSurat();
  
  const elements: (Paragraph | Table)[] = [
    ...kopSurat,
    
    // Header Info
    new Paragraph({
      children: [
        new TextRun({ text: `Nomor      : ${data.nomorSurat || '_________________'}`, size: FONT_SIZE, font: FONT_NAME }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `Lampiran  : ${data.lampiran || '-'}`, size: FONT_SIZE, font: FONT_NAME }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `Hal           : ${data.perihal || '_________________'}`, size: FONT_SIZE, font: FONT_NAME }),
      ],
      spacing: { after: 300 },
    }),
    
    // Date (right aligned)
    new Paragraph({
      children: [
        new TextRun({
          text: formatTanggal(data.tanggalSurat || ''),
          size: FONT_SIZE,
          font: FONT_NAME,
        }),
      ],
      alignment: AlignmentType.RIGHT,
      spacing: { after: 300 },
    }),
    
    // Recipient with "Yth."
    new Paragraph({
      children: [
        new TextRun({ text: `Yth. ${data.tujuanNama || '_________________'}`, size: FONT_SIZE, font: FONT_NAME }),
      ],
    }),
  ];
  
  if (data.tujuanJabatan) {
    elements.push(
      new Paragraph({
        children: [new TextRun({ text: data.tujuanJabatan, size: FONT_SIZE, font: FONT_NAME })],
      })
    );
  }
  
  elements.push(
    new Paragraph({
      children: [
        new TextRun({ text: data.tujuanAlamat || 'di Tempat', size: FONT_SIZE, font: FONT_NAME }),
      ],
      spacing: { after: 300 },
    }),
    
    // Opening paragraph with indent
    new Paragraph({
      children: [
        new TextRun({
          text: data.paragrafPembuka || 'Sehubungan dengan akan dilaksanakannya kegiatan sebagaimana tersebut di atas, kami mengundang Bapak/Ibu untuk hadir pada:',
          size: FONT_SIZE,
          font: FONT_NAME,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      indent: { firstLine: convertMillimetersToTwip(12.7) },
      spacing: { after: 200 },
    }),
    
    // Event details
    new Paragraph({
      children: [
        new TextRun({ text: `hari           : ${data.hari || formatHari(data.tanggal || '')}`, size: FONT_SIZE, font: FONT_NAME }),
      ],
      indent: { left: convertMillimetersToTwip(15) },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `tanggal      : ${formatTanggal(data.tanggal || '')}`, size: FONT_SIZE, font: FONT_NAME }),
      ],
      indent: { left: convertMillimetersToTwip(15) },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `pukul         : ${data.pukul || '_____ WIB'}`, size: FONT_SIZE, font: FONT_NAME }),
      ],
      indent: { left: convertMillimetersToTwip(15) },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `tempat       : ${data.tempat || '_________________'}`, size: FONT_SIZE, font: FONT_NAME }),
      ],
      indent: { left: convertMillimetersToTwip(15) },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `acara         : ${data.acara || '_________________'}`, size: FONT_SIZE, font: FONT_NAME }),
      ],
      indent: { left: convertMillimetersToTwip(15) },
      spacing: { after: 300 },
    }),
    
    // Closing paragraph
    new Paragraph({
      children: [
        new TextRun({
          text: data.paragrafPenutup || 'Demikian undangan ini kami sampaikan. Atas perhatian dan kehadiran Bapak/Ibu, kami ucapkan terima kasih.',
          size: FONT_SIZE,
          font: FONT_NAME,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      indent: { firstLine: convertMillimetersToTwip(12.7) },
      spacing: { after: 500 },
    }),
    
    // Signature block
    ...createSignatureBlock(
      data.penandatangan?.jabatan || 'Kepala Balai Bahasa Provinsi Jawa Barat',
      data.penandatangan?.nama || '',
      undefined,
      undefined,
      false
    ),
  );
  
  return elements;
};

// ==================== SURAT TUGAS GENERATOR ====================

const generateSuratTugas = async (data: Partial<SuratTugasData>): Promise<(Paragraph | Table)[]> => {
  const kopSurat = await createKopSurat();
  
  const elements: (Paragraph | Table)[] = [
    ...kopSurat,
    
    // Title centered
    new Paragraph({
      children: [
        new TextRun({
          text: 'SURAT TUGAS',
          bold: true,
          size: 28,
          font: FONT_NAME,
        }),
      ],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Nomor: ${data.nomorSurat || '_________________'}`,
          size: FONT_SIZE,
          font: FONT_NAME,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
    }),
    
    // Legal Basis
    new Paragraph({
      children: [
        new TextRun({ text: 'Dasar:', bold: true, size: FONT_SIZE, font: FONT_NAME }),
      ],
      spacing: { after: 100 },
    }),
  ];
  
  // List of legal bases
  (data.dasarHukum || ['']).forEach((dasar, i) => {
    elements.push(
      new Paragraph({
        children: [
          new TextRun({ text: `${i + 1}. ${dasar || '_________________'}`, size: FONT_SIZE, font: FONT_NAME }),
        ],
        indent: { left: convertMillimetersToTwip(10) },
      })
    );
  });
  
  elements.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'MEMERINTAHKAN', bold: true, size: FONT_SIZE, font: FONT_NAME }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 300, after: 300 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Kepada:', bold: true, size: FONT_SIZE, font: FONT_NAME }),
      ],
      spacing: { after: 200 },
    }),
  );
  
  // Employee table per Permendikdasmen format
  const tableRows = [
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'No.', bold: true, size: 22, font: FONT_NAME })], alignment: AlignmentType.CENTER })], width: { size: 8, type: WidthType.PERCENTAGE } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Nama, NIP, Pangkat, dan Golongan', bold: true, size: 22, font: FONT_NAME })], alignment: AlignmentType.CENTER })], width: { size: 52, type: WidthType.PERCENTAGE } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Jabatan', bold: true, size: 22, font: FONT_NAME })], alignment: AlignmentType.CENTER })], width: { size: 40, type: WidthType.PERCENTAGE } }),
      ],
    }),
  ];
  
  (data.daftarPegawai || []).forEach((pegawai, i) => {
    const namaInfo = [
      pegawai.nama || '-',
      pegawai.nip ? `NIP ${pegawai.nip}` : '',
      pegawai.golongan ? `Golongan ${pegawai.golongan}` : '',
    ].filter(Boolean).join('\n');
    
    tableRows.push(
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${i + 1}`, size: 22, font: FONT_NAME })], alignment: AlignmentType.CENTER })] }),
          new TableCell({ 
            children: namaInfo.split('\n').map(line => 
              new Paragraph({ children: [new TextRun({ text: line, size: 22, font: FONT_NAME })] })
            )
          }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: pegawai.jabatan || '-', size: 22, font: FONT_NAME })] })] }),
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
        new TextRun({ text: 'Untuk:', bold: true, size: FONT_SIZE, font: FONT_NAME }),
      ],
      spacing: { before: 300, after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: data.tujuanTugas || '_________________', size: FONT_SIZE, font: FONT_NAME }),
      ],
      indent: { left: convertMillimetersToTwip(10) },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `Tempat    : ${data.tempatTugas || '_________________'}`, size: FONT_SIZE, font: FONT_NAME }),
      ],
      indent: { left: convertMillimetersToTwip(10) },
      spacing: { before: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Waktu      : ${formatTanggal(data.waktuMulai || '')} s.d. ${formatTanggal(data.waktuSelesai || '')}`,
          size: FONT_SIZE,
          font: FONT_NAME,
        }),
      ],
      indent: { left: convertMillimetersToTwip(10) },
    }),
  );
  
  // Standard closing text per Permendikdasmen
  elements.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'Surat tugas ini dibuat untuk dilaksanakan dengan penuh tanggung jawab dan yang bersangkutan diharapkan membuat laporan.',
          size: FONT_SIZE,
          font: FONT_NAME,
          italics: true,
        }),
      ],
      spacing: { before: 300, after: 400 },
    }),
  );
  
  // Signature block
  elements.push(
    ...createSignatureBlock(
      data.penandatangan?.jabatan || 'Kepala Balai Bahasa Provinsi Jawa Barat',
      data.penandatangan?.nama || '',
      data.tempatSurat || 'Bandung',
      data.tanggalSurat || '',
      true
    )
  );
  
  return elements;
};

// ==================== SPK LEMBUR GENERATOR ====================

const generateSpkLembur = async (data: Partial<SpkLemburData>): Promise<(Paragraph | Table)[]> => {
  const kopSurat = await createKopSurat();
  
  const elements: (Paragraph | Table)[] = [
    ...kopSurat,
    
    // Title
    new Paragraph({
      children: [
        new TextRun({
          text: 'SURAT PERINTAH KERJA LEMBUR',
          bold: true,
          size: 28,
          font: FONT_NAME,
        }),
      ],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Nomor: ${data.nomorSurat || '_________________'}`,
          size: FONT_SIZE,
          font: FONT_NAME,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({
          text: 'Kepala Balai Bahasa Provinsi Jawa Barat memerintahkan kepada pegawai yang namanya tercantum di bawah ini untuk melaksanakan kerja lembur:',
          size: FONT_SIZE,
          font: FONT_NAME,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200 },
    }),
  ];
  
  // Overtime employee table
  const tableRows = [
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'No', bold: true, size: 20, font: FONT_NAME })], alignment: AlignmentType.CENTER })], width: { size: 5, type: WidthType.PERCENTAGE } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Nama/NIP', bold: true, size: 20, font: FONT_NAME })], alignment: AlignmentType.CENTER })], width: { size: 18, type: WidthType.PERCENTAGE } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Jabatan', bold: true, size: 20, font: FONT_NAME })], alignment: AlignmentType.CENTER })], width: { size: 15, type: WidthType.PERCENTAGE } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Gol', bold: true, size: 20, font: FONT_NAME })], alignment: AlignmentType.CENTER })], width: { size: 7, type: WidthType.PERCENTAGE } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Tanggal', bold: true, size: 20, font: FONT_NAME })], alignment: AlignmentType.CENTER })], width: { size: 15, type: WidthType.PERCENTAGE } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Waktu', bold: true, size: 20, font: FONT_NAME })], alignment: AlignmentType.CENTER })], width: { size: 12, type: WidthType.PERCENTAGE } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Uraian Pekerjaan', bold: true, size: 20, font: FONT_NAME })], alignment: AlignmentType.CENTER })], width: { size: 28, type: WidthType.PERCENTAGE } }),
      ],
    }),
  ];
  
  (data.daftarPegawai || []).forEach((pegawai, i) => {
    tableRows.push(
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${i + 1}`, size: 20, font: FONT_NAME })], alignment: AlignmentType.CENTER })] }),
          new TableCell({
            children: [
              new Paragraph({ children: [new TextRun({ text: pegawai.nama || '-', size: 20, font: FONT_NAME })] }),
              new Paragraph({ children: [new TextRun({ text: pegawai.nip || '-', size: 18, font: FONT_NAME, italics: true })] }),
            ],
          }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: pegawai.jabatan || '-', size: 20, font: FONT_NAME })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: pegawai.golongan || '-', size: 20, font: FONT_NAME })], alignment: AlignmentType.CENTER })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: formatTanggal(pegawai.tanggalLembur), size: 20, font: FONT_NAME })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${pegawai.waktuMulai || '-'} - ${pegawai.waktuSelesai || '-'}`, size: 20, font: FONT_NAME })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: pegawai.uraianPekerjaan || '-', size: 20, font: FONT_NAME })] })] }),
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
          new TextRun({ text: `Keterangan: ${data.keterangan}`, size: FONT_SIZE, font: FONT_NAME }),
        ],
        spacing: { before: 200 },
      })
    );
  }
  
  // Signature block
  elements.push(
    ...createSignatureBlock(
      data.penandatangan?.jabatan || 'Kepala Balai Bahasa Provinsi Jawa Barat',
      data.penandatangan?.nama || '',
      data.tempatSurat || 'Bandung',
      data.tanggalSurat || '',
      true
    )
  );
  
  return elements;
};

// ==================== LAPORAN RBD GENERATOR ====================

const generateLaporanRBD = async (data: Partial<LaporanRBDData>): Promise<(Paragraph | Table)[]> => {
  const kopSurat = await createKopSurat();
  
  const elements: (Paragraph | Table)[] = [
    ...kopSurat,
    
    // Header Info
    new Paragraph({
      children: [
        new TextRun({ text: `Nomor      : ${data.nomorSurat || '_________________'}`, size: FONT_SIZE, font: FONT_NAME }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Lampiran  : Tersedia', size: FONT_SIZE, font: FONT_NAME }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `Hal           : ${data.perihal || '_________________'}`, size: FONT_SIZE, font: FONT_NAME }),
      ],
      spacing: { after: 300 },
    }),
    
    // Date
    new Paragraph({
      children: [
        new TextRun({
          text: formatTanggal(data.tanggalSurat || ''),
          size: FONT_SIZE,
          font: FONT_NAME,
        }),
      ],
      alignment: AlignmentType.RIGHT,
      spacing: { after: 300 },
    }),
    
    // Recipient
    new Paragraph({
      children: [
        new TextRun({ text: `Yth. ${data.tujuanNama || '_________________'}`, size: FONT_SIZE, font: FONT_NAME }),
      ],
    }),
  ];
  
  if (data.tujuanJabatan) {
    elements.push(
      new Paragraph({
        children: [new TextRun({ text: data.tujuanJabatan, size: FONT_SIZE, font: FONT_NAME })],
      })
    );
  }
  
  elements.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'di Tempat', size: FONT_SIZE, font: FONT_NAME }),
      ],
      spacing: { after: 300 },
    }),
    
    // Content
    new Paragraph({
      children: [
        new TextRun({
          text: data.paragrafPengantar || 'Dengan hormat, bersama ini kami sampaikan...',
          size: FONT_SIZE,
          font: FONT_NAME,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      indent: { firstLine: convertMillimetersToTwip(12.7) },
      spacing: { after: 500 },
    }),
    
    // Signature block
    ...createSignatureBlock(
      data.penandatangan?.jabatan || 'Kepala Balai Bahasa Provinsi Jawa Barat',
      data.penandatangan?.nama || '',
      undefined,
      undefined,
      false
    ),
  );
  
  return elements;
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
      children = await generateSuratUndangan(data as Partial<SuratUndanganData>);
      break;
    case 'surat_tugas':
      children = await generateSuratTugas(data as Partial<SuratTugasData>);
      break;
    case 'spk_lembur':
      children = await generateSpkLembur(data as Partial<SpkLemburData>);
      break;
    case 'laporan_rbd':
      children = await generateLaporanRBD(data as Partial<LaporanRBDData>);
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
