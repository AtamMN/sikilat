/**
 * Laporan Service
 * SIKILAT - Sistem Informasi Laporan Kegiatan Terintegrasi
 * 
 * Service layer untuk operasi CRUD laporan.
 * Menggunakan Firebase Firestore sebagai database utama.
 * localStorage hanya digunakan untuk menyimpan ID referensi (pointer).
 */

import { LaporanType, LaporanFormInput, ServiceResponse } from '@/types/laporan';
import { 
  saveToLocalStorage, 
  getFromLocalStorage,
  STORAGE_KEYS 
} from '@/lib/storage';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { 
  collection, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';

/**
 * Check if running in browser
 */
const isBrowser = (): boolean => {
  return typeof window !== 'undefined';
};

/**
 * Compress image before storing
 * Resize to max dimension and reduce quality for smaller size
 */
const compressImage = (base64: string, maxWidth = 600, quality = 0.5): Promise<string> => {
  return new Promise((resolve) => {
    if (!isBrowser()) {
      resolve(base64);
      return;
    }

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;

      // Calculate new dimensions
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to JPEG for better compression
      const compressed = canvas.toDataURL('image/jpeg', quality);
      console.log(`Image compressed: ${Math.round(base64.length / 1024)}KB -> ${Math.round(compressed.length / 1024)}KB`);
      resolve(compressed);
    };

    img.onerror = () => {
      console.warn('Failed to load image for compression');
      resolve(base64);
    };

    img.src = base64;
  });
};

/**
 * Result dari proses upload gambar
 */
interface ProcessImagesResult {
  data: Record<string, unknown>;
  failedCount: number;
  totalCount: number;
}

/**
 * Process images in data - compress and store directly in Firestore
 * No more Realtime Database dependency for faster loading
 */
const processImagesForFirebase = async (data: Record<string, unknown>): Promise<ProcessImagesResult> => {
  const processed = { ...data };
  let failedCount = 0;
  let totalCount = 0;
  
  // Process uraianKegiatan gambar
  if (processed.uraianKegiatan && Array.isArray(processed.uraianKegiatan)) {
    const uraianList = processed.uraianKegiatan as Array<Record<string, unknown>>;
    
    for (let i = 0; i < uraianList.length; i++) {
      const uraian = uraianList[i];
      if (uraian.gambar && Array.isArray(uraian.gambar)) {
        const gambarList = uraian.gambar as string[];
        const compressedImages: string[] = [];
        
        for (const gambar of gambarList) {
          if (typeof gambar === 'string' && gambar.startsWith('data:')) {
            totalCount++;
            try {
              // Compress image and store directly (no more RTDB)
              const compressed = await compressImage(gambar);
              compressedImages.push(compressed);
            } catch (error) {
              console.error('Failed to compress image:', error);
              failedCount++;
            }
          } else if (typeof gambar === 'string' && gambar.startsWith('http')) {
            // Already a URL, keep it
            compressedImages.push(gambar);
          } else if (typeof gambar === 'string' && gambar.startsWith('rtdb://')) {
            // Legacy rtdb reference - skip it (will be resolved separately)
            compressedImages.push(gambar);
          }
        }
        
        // Store compressed images directly
        uraian.gambar = compressedImages.length > 0 ? compressedImages : undefined;
      }
    }
    
    processed.uraianKegiatan = uraianList;
  }
  
  return { data: processed, failedCount, totalCount };
};

/**
 * Generate unique ID untuk mock data
 */
const generateId = (): string => {
  return `laporan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Sanitize data for Firebase - remove undefined values and invalid nested entities
 * Firebase tidak menerima undefined, null dalam array, atau nested entities yang tidak valid
 * Base64 images yang sudah dikompresi TETAP disimpan (sudah dikecilkan ukurannya)
 */
const sanitizeForFirebase = (obj: unknown, key?: string): unknown => {
  // Handle null/undefined
  if (obj === null || obj === undefined) {
    return null;
  }
  
  // Handle primitives (string, number, boolean)
  if (typeof obj !== 'object') {
    // Base64 data URLs sekarang diizinkan (sudah dikompresi)
    return obj;
  }
  
  // Handle Date objects - convert to ISO string
  if (obj instanceof Date) {
    return obj.toISOString();
  }
  
  // Handle arrays
  if (Array.isArray(obj)) {
    const filtered = obj
      .filter(item => item !== undefined && item !== null && item !== '')
      .map(item => sanitizeForFirebase(item))
      .filter(item => {
        // Remove empty objects and empty arrays from final result
        if (typeof item === 'object' && item !== null) {
          if (Array.isArray(item)) return item.length > 0;
          return Object.keys(item).length > 0;
        }
        // Remove null values
        if (item === null) return false;
        return true;
      });
    return filtered;
  }
  
  // Handle plain objects
  const sanitized: Record<string, unknown> = {};
  
  for (const [objKey, value] of Object.entries(obj as Record<string, unknown>)) {
    // Skip undefined and null values
    if (value === undefined || value === null) {
      continue;
    }
    
    // Skip empty strings for optional fields (but keep required ones)
    if (value === '' && !['namaKegiatan', 'pendahuluan', 'deskripsi'].includes(objKey)) {
      continue;
    }
    
    const sanitizedValue = sanitizeForFirebase(value, objKey);
    
    // Skip if sanitized value is null, undefined, or empty
    if (sanitizedValue === null || sanitizedValue === undefined) {
      continue;
    }
    
    // Skip empty arrays and empty objects
    if (typeof sanitizedValue === 'object') {
      if (Array.isArray(sanitizedValue) && sanitizedValue.length === 0) {
        continue;
      }
      if (!Array.isArray(sanitizedValue) && Object.keys(sanitizedValue).length === 0) {
        continue;
      }
    }
    
    sanitized[objKey] = sanitizedValue;
  }
  
  return sanitized;
};

/**
 * Convert form input to LaporanType
 */
export const convertFormToLaporan = (formData: LaporanFormInput, isSubmit: boolean = false): LaporanType => {
  // Filter out empty/invalid image strings
  const validImages = (formData.gambarPreview || [])
    .filter(img => img && typeof img === 'string' && img.length > 0);
  
  return {
    id: generateId(),
    namaKegiatan: formData.namaKegiatan || '',
    pendahuluan: formData.pendahuluan || '',
    waktuMulai: formData.waktuMulai || '',
    waktuSelesai: formData.waktuSelesai || '',
    tempatPelaksanaan: formData.lokasi || '',
    pelaksana: [{
      nama: formData.penanggungJawab || '',
      jabatan: formData.jabatanPenanggungJawab || '',
      nip: formData.nipPenanggungJawab || '',
    }],
    sumberPendanaan: formData.sumberPendanaan || '',
    uraianKegiatan: [{
      hari: 1,
      tanggal: formData.tanggal || '',
      deskripsi: formData.deskripsi || '',
      gambar: validImages,
    }],
    rekomendasi: formData.rekomendasi || '',
    ucapanTerimakasih: formData.ucapanTerimakasih || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: isSubmit ? 'submitted' : 'draft',
  };
};

/**
 * Submit Laporan
 * Menyimpan data laporan ke Firestore
 * Jika ada draft yang sudah ada (firebaseId), akan mengupdate dokumen tersebut
 * 
 * @param data - Data laporan yang akan disimpan
 * @param existingDraftId - ID dokumen draft di Firebase (opsional)
 * @returns Promise dengan response sukses/gagal
 */
export const submitLaporan = async (data: LaporanType, existingDraftId?: string): Promise<ServiceResponse<LaporanType>> => {
  // Gunakan Firebase Firestore
  if (isFirebaseConfigured()) {
    try {
      // Hapus id karena Firestore akan generate sendiri
      const { id, ...dataWithoutId } = data;
      
      // Upload gambar ke Imgur dan dapatkan URL
      const { data: dataWithUploadedImages, failedCount, totalCount } = await processImagesForFirebase(dataWithoutId as Record<string, unknown>);
      
      // Sanitize data untuk Firebase
      const sanitizedData = sanitizeForFirebase(dataWithUploadedImages) as Record<string, unknown>;
      
      console.log('Submitting to Firebase:', JSON.stringify(sanitizedData, null, 2));
      
      let docId: string;
      
      // Jika ada draft ID yang sudah ada, update dokumen tersebut
      if (existingDraftId) {
        console.log('Updating existing draft:', existingDraftId);
        const docRef = doc(db, 'laporan', existingDraftId);
        await updateDoc(docRef, {
          ...sanitizedData,
          status: 'submitted',
          updatedAt: serverTimestamp(),
        });
        docId = existingDraftId;
      } else {
        // Buat dokumen baru
        const docRef = await addDoc(collection(db, 'laporan'), {
          ...sanitizedData,
          status: 'submitted',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        docId = docRef.id;
      }
      
      const savedData: LaporanType = { 
        ...data, 
        id: docId,
        status: 'submitted',
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // Simpan hanya ID ke localStorage untuk referensi cepat ke Firestore
      saveToLocalStorage(STORAGE_KEYS.LAPORAN_DATA, { id: docId });
      
      // Generate warning jika ada gambar yang gagal upload
      let warning: string | undefined;
      if (failedCount > 0) {
        warning = `${failedCount} dari ${totalCount} gambar gagal diupload. Pastikan koneksi internet stabil dan coba lagi.`;
      }
      
      return {
        success: true,
        data: savedData,
        message: 'Laporan berhasil disimpan ke database',
        warning,
      };
    } catch (error) {
      console.error('Firebase error:', error);
      return {
        success: false,
        error: 'Gagal menyimpan laporan. Periksa koneksi internet.',
        message: 'Firebase error',
      };
    }
  }

  // Firebase tidak dikonfigurasi
  return {
    success: false,
    error: 'Firebase tidak dikonfigurasi. Hubungi administrator.',
    message: 'Firebase not configured',
  };
};

/**
 * Get Laporan by ID
 * Mengambil data laporan berdasarkan ID dari Firestore
 */
export const getLaporanById = async (id: string): Promise<ServiceResponse<LaporanType>> => {
  if (isFirebaseConfigured()) {
    try {
      const docRef = doc(db, 'laporan', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          success: true,
          data: { 
            id: docSnap.id, 
            ...data,
            createdAt: data.createdAt instanceof Timestamp 
              ? data.createdAt.toDate().toISOString() 
              : data.createdAt,
            updatedAt: data.updatedAt instanceof Timestamp 
              ? data.updatedAt.toDate().toISOString() 
              : data.updatedAt,
          } as LaporanType,
        };
      }
      return { success: false, error: 'Laporan tidak ditemukan' };
    } catch (error) {
      console.error('Firebase error:', error);
      return { success: false, error: 'Gagal memuat laporan. Periksa koneksi internet.' };
    }
  }

  return { success: false, error: 'Firebase tidak dikonfigurasi' };
};

/**
 * Get Current/Latest Laporan
 * Mengambil laporan yang baru saja disimpan dari Firestore
 * Untuk redirect ke halaman template setelah submit
 */
export const getCurrentLaporan = async (): Promise<ServiceResponse<LaporanType>> => {
  // Cek localStorage untuk ID laporan yang baru disimpan
  const savedLaporan = getFromLocalStorage<LaporanType>(STORAGE_KEYS.LAPORAN_DATA);
  
  if (savedLaporan?.id && isFirebaseConfigured()) {
    try {
      // Ambil data terbaru dari Firestore
      const docRef = doc(db, 'laporan', savedLaporan.id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          success: true,
          data: { 
            id: docSnap.id, 
            ...data,
            createdAt: data.createdAt instanceof Timestamp 
              ? data.createdAt.toDate().toISOString() 
              : data.createdAt,
            updatedAt: data.updatedAt instanceof Timestamp 
              ? data.updatedAt.toDate().toISOString() 
              : data.updatedAt,
          } as LaporanType,
        };
      }
    } catch (error) {
      console.error('Firebase error getting current laporan:', error);
      return { success: false, error: 'Gagal memuat laporan. Periksa koneksi internet.' };
    }
  }
  
  return { success: false, error: 'Tidak ada laporan yang tersimpan' };
};

/**
 * Get All Laporan
 * Mengambil semua data laporan dari Firestore
 */
export const getAllLaporan = async (): Promise<ServiceResponse<LaporanType[]>> => {
  if (isFirebaseConfigured()) {
    try {
      const q = query(collection(db, 'laporan'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const laporanList = querySnapshot.docs.map(docItem => {
        const data = docItem.data();
        return {
          id: docItem.id,
          ...data,
          createdAt: data.createdAt instanceof Timestamp 
            ? data.createdAt.toDate().toISOString() 
            : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp 
            ? data.updatedAt.toDate().toISOString() 
            : data.updatedAt,
        } as LaporanType;
      });
      return { success: true, data: laporanList };
    } catch (error) {
      console.error('Firebase error:', error);
      return { success: false, data: [], error: 'Gagal memuat daftar laporan. Periksa koneksi internet.' };
    }
  }

  return { success: false, data: [], error: 'Firebase tidak dikonfigurasi' };
};

/**
 * Update Laporan
 * Mengupdate data laporan di Firestore
 */
export const updateLaporan = async (id: string, data: Partial<LaporanType>): Promise<ServiceResponse<LaporanType>> => {
  if (isFirebaseConfigured()) {
    try {
      const docRef = doc(db, 'laporan', id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
      
      // Get updated document
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const updatedData = docSnap.data();
        return { 
          success: true, 
          data: { 
            id: docSnap.id, 
            ...updatedData,
            createdAt: updatedData.createdAt instanceof Timestamp 
              ? updatedData.createdAt.toDate().toISOString() 
              : updatedData.createdAt,
            updatedAt: updatedData.updatedAt instanceof Timestamp 
              ? updatedData.updatedAt.toDate().toISOString() 
              : updatedData.updatedAt,
          } as LaporanType,
          message: 'Laporan berhasil diupdate' 
        };
      }
      return { success: true, message: 'Laporan berhasil diupdate' };
    } catch (error) {
      console.error('Firebase error:', error);
      return { success: false, error: 'Gagal mengupdate laporan. Periksa koneksi internet.' };
    }
  }

  return { success: false, error: 'Firebase tidak dikonfigurasi' };
};

/**
 * Delete Laporan
 * Menghapus data laporan dari Firestore
 */
export const deleteLaporan = async (id: string): Promise<ServiceResponse<null>> => {
  if (isFirebaseConfigured()) {
    try {
      await deleteDoc(doc(db, 'laporan', id));
      return { success: true, message: 'Laporan berhasil dihapus' };
    } catch (error) {
      console.error('Firebase error:', error);
      return { success: false, error: 'Gagal menghapus laporan. Periksa koneksi internet.' };
    }
  }

  return { success: false, error: 'Firebase tidak dikonfigurasi' };
};

/**
 * Save Draft
 * Menyimpan draft laporan ke Firebase dengan status 'draft'
 * Jika draft sudah ada (firebaseId di localStorage), akan mengupdate dokumen tersebut
 */
export const saveDraft = async (data: Partial<LaporanFormInput>): Promise<ServiceResponse<LaporanType>> => {
  // Convert to LaporanType for Firebase
  const laporanData = convertFormToLaporan(data as LaporanFormInput, false);
  
  // Cek apakah sudah ada draft yang tersimpan (untuk menghindari duplikasi)
  const existingDraft = getFromLocalStorage<Partial<LaporanFormInput> & { firebaseId?: string }>(STORAGE_KEYS.DRAFT_DATA);
  const existingFirebaseId = existingDraft?.firebaseId;
  
  if (isFirebaseConfigured()) {
    try {
      const { id, ...dataWithoutId } = laporanData;
      
      // Upload gambar ke Imgur dan dapatkan URL
      const { data: dataWithUploadedImages, failedCount, totalCount } = await processImagesForFirebase(dataWithoutId as Record<string, unknown>);
      
      // Sanitize data untuk Firebase
      const sanitizedData = sanitizeForFirebase(dataWithUploadedImages) as Record<string, unknown>;
      
      console.log('Saving draft to Firebase:', JSON.stringify(sanitizedData, null, 2));
      
      let docId: string;
      
      // Jika sudah ada draft di Firebase, update dokumen tersebut
      if (existingFirebaseId) {
        console.log('Updating existing draft:', existingFirebaseId);
        const docRef = doc(db, 'laporan', existingFirebaseId);
        await updateDoc(docRef, {
          ...sanitizedData,
          status: 'draft',
          updatedAt: serverTimestamp(),
        });
        docId = existingFirebaseId;
      } else {
        // Buat dokumen baru
        const docRef = await addDoc(collection(db, 'laporan'), {
          ...sanitizedData,
          status: 'draft',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        docId = docRef.id;
      }
      
      const savedData: LaporanType = {
        ...laporanData,
        id: docId,
        status: 'draft',
      };
      
      // Simpan hanya firebaseId ke localStorage untuk referensi cepat
      saveToLocalStorage(STORAGE_KEYS.DRAFT_DATA, {
        firebaseId: docId,
        savedAt: new Date().toISOString(),
      });
      
      // Generate warning jika ada gambar yang gagal upload
      let warning: string | undefined;
      if (failedCount > 0) {
        warning = `${failedCount} dari ${totalCount} gambar gagal diupload. Pastikan koneksi internet stabil dan coba lagi.`;
      }
      
      return { success: true, data: savedData, message: 'Draft berhasil disimpan ke database', warning };
    } catch (error) {
      console.error('Firebase error saving draft:', error);
      return { 
        success: false, 
        error: 'Gagal menyimpan draft. Periksa koneksi internet.' 
      };
    }
  }
  
  return { 
    success: false, 
    error: 'Firebase tidak dikonfigurasi' 
  };
};

/**
 * Get Draft
 * Mengambil draft laporan dari Firestore
 * Pertama cek localStorage untuk firebaseId, jika ada ambil dari Firestore
 * Jika tidak, ambil draft terbaru dari Firestore
 */
export const getDraft = async (): Promise<ServiceResponse<Partial<LaporanFormInput> & { firebaseId?: string }>> => {
  if (isFirebaseConfigured()) {
    try {
      // Cek localStorage untuk firebaseId yang sedang diedit
      const localDraft = getFromLocalStorage<{ firebaseId?: string }>(STORAGE_KEYS.DRAFT_DATA);
      
      if (localDraft?.firebaseId) {
        // Ambil draft spesifik dari Firestore
        const docRef = doc(db, 'laporan', localDraft.firebaseId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          // Convert Firestore data to form input format
          const formData = convertFirestoreToFormInput(data, docSnap.id);
          return { success: true, data: formData };
        }
      }
      
      // Jika tidak ada firebaseId, return tidak ada draft
      return { success: false, error: 'Tidak ada draft tersimpan' };
    } catch (error) {
      console.error('Firebase error getting draft:', error);
      return { success: false, error: 'Gagal memuat draft. Periksa koneksi internet.' };
    }
  }
  
  return { success: false, error: 'Firebase tidak dikonfigurasi' };
};

/**
 * Clear Draft
 * Menghapus referensi draft dari localStorage
 * Tidak menghapus dari Firestore karena data mungkin masih diperlukan
 */
export const clearDraft = async (): Promise<ServiceResponse<null>> => {
  try {
    if (isBrowser()) {
      localStorage.removeItem(STORAGE_KEYS.DRAFT_DATA);
    }
    return { success: true, message: 'Draft berhasil dihapus' };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

/**
 * Helper: Convert Firestore data to form input format
 */
const convertFirestoreToFormInput = (
  data: Record<string, unknown>, 
  docId: string
): Partial<LaporanFormInput> & { firebaseId: string } => {
  const uraian = data.uraianKegiatan as Array<Record<string, unknown>> | undefined;
  const pelaksana = data.pelaksana as Array<Record<string, unknown>> | undefined;
  
  return {
    firebaseId: docId,
    namaKegiatan: data.namaKegiatan as string || '',
    pendahuluan: data.pendahuluan as string || '',
    waktuMulai: data.waktuMulai as string || '',
    waktuSelesai: data.waktuSelesai as string || '',
    lokasi: data.tempatPelaksanaan as string || '',
    penanggungJawab: pelaksana?.[0]?.nama as string || '',
    jabatanPenanggungJawab: pelaksana?.[0]?.jabatan as string || '',
    nipPenanggungJawab: pelaksana?.[0]?.nip as string || '',
    sumberPendanaan: data.sumberPendanaan as string || '',
    tanggal: uraian?.[0]?.tanggal as string || '',
    deskripsi: uraian?.[0]?.deskripsi as string || '',
    gambarPreview: uraian?.[0]?.gambar as string[] || [],
    rekomendasi: data.rekomendasi as string || '',
    ucapanTerimakasih: data.ucapanTerimakasih as string || '',
  };
};
