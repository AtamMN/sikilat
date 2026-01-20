/**
 * Laporan Service
 * SIKILAT - Sistem Informasi Laporan Kegiatan Terintegrasi
 * 
 * Service layer untuk operasi CRUD laporan.
 * Menggunakan Firebase Firestore sebagai database utama
 * dengan localStorage sebagai fallback/cache.
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
 * Check if a string is a base64 data URL (which can't be stored in Firestore)
 */
const isBase64DataUrl = (str: string): boolean => {
  return typeof str === 'string' && str.startsWith('data:');
};

/**
 * Sanitize data for Firebase - remove undefined values and invalid nested entities
 * Firebase tidak menerima undefined, null dalam array, atau nested entities yang tidak valid
 * Base64 data URLs juga dihapus karena terlalu besar untuk Firestore
 */
const sanitizeForFirebase = (obj: unknown, key?: string): unknown => {
  // Handle null/undefined
  if (obj === null || obj === undefined) {
    return null;
  }
  
  // Handle primitives (string, number, boolean)
  if (typeof obj !== 'object') {
    // Skip base64 data URLs - they're too large for Firestore
    if (typeof obj === 'string' && isBase64DataUrl(obj)) {
      console.warn('Skipping base64 data URL - gambar harus diupload ke Firebase Storage terlebih dahulu');
      return null;
    }
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
      // Filter out base64 strings from arrays
      .filter(item => !(typeof item === 'string' && isBase64DataUrl(item)))
      .map(item => sanitizeForFirebase(item))
      .filter(item => {
        // Remove empty objects and empty arrays from final result
        if (typeof item === 'object' && item !== null) {
          if (Array.isArray(item)) return item.length > 0;
          return Object.keys(item).length > 0;
        }
        // Remove null values that came from base64 filtering
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
      
      // Simpan juga ke localStorage untuk akses cepat
      saveToLocalStorage(STORAGE_KEYS.LAPORAN_DATA, savedData);
      
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
      // Fallback ke localStorage jika Firebase gagal
      return submitLaporanToLocalStorage(data);
    }
  }

  // Fallback ke localStorage jika Firebase tidak dikonfigurasi
  return submitLaporanToLocalStorage(data);
};

/**
 * Helper: Submit ke localStorage (fallback)
 */
const submitLaporanToLocalStorage = async (data: LaporanType): Promise<ServiceResponse<LaporanType>> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      try {
        const laporanWithId: LaporanType = {
          ...data,
          id: data.id || generateId(),
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const savedCurrent = saveToLocalStorage(STORAGE_KEYS.LAPORAN_DATA, laporanWithId);

        if (!savedCurrent) {
          const laporanWithoutImages: LaporanType = {
            ...laporanWithId,
            uraianKegiatan: laporanWithId.uraianKegiatan?.map(u => ({
              ...u,
              gambar: [],
            })),
          };
          
          const savedWithoutImages = saveToLocalStorage(STORAGE_KEYS.LAPORAN_DATA, laporanWithoutImages);
          
          if (savedWithoutImages) {
            resolve({
              success: true,
              data: laporanWithoutImages,
              message: 'Laporan disimpan tanpa gambar (ukuran terlalu besar)',
            });
            return;
          }
        }

        try {
          const existingList = getFromLocalStorage<LaporanType[]>(STORAGE_KEYS.LAPORAN_LIST) || [];
          const trimmedList = existingList.slice(-4);
          const updatedList = [...trimmedList, laporanWithId];
          saveToLocalStorage(STORAGE_KEYS.LAPORAN_LIST, updatedList);
        } catch {
          console.warn('Could not save to laporan list');
        }

        resolve({
          success: true,
          data: laporanWithId,
          message: 'Laporan disimpan ke penyimpanan lokal',
        });
      } catch (error) {
        resolve({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          message: 'Gagal menyimpan laporan',
        });
      }
    }, 300);
  });
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
      // Fallback ke localStorage
    }
  }

  return new Promise((resolve) => {
    setTimeout(() => {
      const list = getFromLocalStorage<LaporanType[]>(STORAGE_KEYS.LAPORAN_LIST) || [];
      const laporan = list.find(l => l.id === id);
      
      if (laporan) {
        resolve({ success: true, data: laporan });
      } else {
        resolve({ success: false, error: 'Laporan tidak ditemukan' });
      }
    }, 300);
  });
};

/**
 * Get Current/Latest Laporan
 * Mengambil laporan yang baru saja disimpan (untuk redirect ke halaman template)
 */
export const getCurrentLaporan = async (): Promise<ServiceResponse<LaporanType>> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const laporan = getFromLocalStorage<LaporanType>(STORAGE_KEYS.LAPORAN_DATA);
      
      if (laporan) {
        resolve({ success: true, data: laporan });
      } else {
        resolve({ success: false, error: 'Tidak ada laporan yang tersimpan' });
      }
    }, 300);
  });
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
      // Fallback ke localStorage
    }
  }

  return new Promise((resolve) => {
    setTimeout(() => {
      const list = getFromLocalStorage<LaporanType[]>(STORAGE_KEYS.LAPORAN_LIST) || [];
      resolve({ success: true, data: list });
    }, 300);
  });
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
      // Fallback ke localStorage
    }
  }

  return new Promise((resolve) => {
    setTimeout(() => {
      const list = getFromLocalStorage<LaporanType[]>(STORAGE_KEYS.LAPORAN_LIST) || [];
      const index = list.findIndex(l => l.id === id);
      
      if (index !== -1) {
        list[index] = {
          ...list[index],
          ...data,
          updatedAt: new Date().toISOString(),
        };
        saveToLocalStorage(STORAGE_KEYS.LAPORAN_LIST, list);
        resolve({ success: true, data: list[index], message: 'Laporan berhasil diupdate' });
      } else {
        resolve({ success: false, error: 'Laporan tidak ditemukan' });
      }
    }, 300);
  });
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
      // Fallback ke localStorage
    }
  }

  return new Promise((resolve) => {
    setTimeout(() => {
      const list = getFromLocalStorage<LaporanType[]>(STORAGE_KEYS.LAPORAN_LIST) || [];
      const filteredList = list.filter(l => l.id !== id);
      saveToLocalStorage(STORAGE_KEYS.LAPORAN_LIST, filteredList);
      resolve({ success: true, message: 'Laporan berhasil dihapus' });
    }, 300);
  });
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
      
      // Also save to localStorage for quick access (dengan firebaseId)
      saveToLocalStorage(STORAGE_KEYS.DRAFT_DATA, {
        ...data,
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
      // Fallback to localStorage
    }
  }
  
  // Fallback to localStorage
  try {
    saveToLocalStorage(STORAGE_KEYS.DRAFT_DATA, {
      ...data,
      savedAt: new Date().toISOString(),
    });
    return { success: true, message: 'Draft berhasil disimpan' };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

/**
 * Get Draft
 * Mengambil draft laporan yang tersimpan
 */
export const getDraft = async (): Promise<ServiceResponse<Partial<LaporanFormInput>>> => {
  return new Promise((resolve) => {
    const draft = getFromLocalStorage<Partial<LaporanFormInput>>(STORAGE_KEYS.DRAFT_DATA);
    if (draft) {
      resolve({ success: true, data: draft });
    } else {
      resolve({ success: false, error: 'Tidak ada draft tersimpan' });
    }
  });
};

/**
 * Clear Draft
 * Menghapus draft laporan
 */
export const clearDraft = async (): Promise<ServiceResponse<null>> => {
  return new Promise((resolve) => {
    try {
      localStorage.removeItem(STORAGE_KEYS.DRAFT_DATA);
      resolve({ success: true, message: 'Draft berhasil dihapus' });
    } catch (error) {
      resolve({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });
};
