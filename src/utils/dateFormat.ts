/**
 * Date Formatting Utilities
 * SIKILAT - Sistem Informasi Laporan Kegiatan Terintegrasi
 * 
 * Shared date formatting functions untuk konsistensi di seluruh aplikasi
 */

/**
 * Format tanggal: "1 Januari 2026"
 */
export const formatTanggal = (dateString: string, fallback: string = '-'): string => {
  if (!dateString) return fallback;
  
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

/**
 * Format tanggal lengkap dengan hari: "Senin, 1 Januari 2026"
 */
export const formatTanggalLengkap = (dateString: string, fallback: string = '-'): string => {
  if (!dateString) return fallback;
  
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'long',
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

/**
 * Format hari saja: "Senin"
 */
export const formatHari = (dateString: string, fallback: string = '-'): string => {
  if (!dateString) return fallback;
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { weekday: 'long' });
  } catch {
    return dateString;
  }
};

/**
 * Alias untuk formatTanggal (backward compatibility)
 */
export const formatTanggalSingkat = formatTanggal;
