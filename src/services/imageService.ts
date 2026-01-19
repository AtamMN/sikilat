/**
 * Image Upload Service
 * SIKILAT - Sistem Informasi Laporan Kegiatan Terintegrasi
 * 
 * Service untuk upload dan manajemen gambar.
 * Menggunakan Firebase Storage untuk menyimpan gambar.
 */

import { ServiceResponse } from '@/types/laporan';
import { storage, isFirebaseConfigured } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * Upload Image
 * Upload gambar ke Firebase Storage dan return URL
 * 
 * @param file - File gambar yang akan diupload
 * @param path - Path folder di storage
 * @returns Promise dengan URL gambar
 */
export const uploadImage = async (
  file: File, 
  path: string = 'laporan'
): Promise<ServiceResponse<string>> => {
  // Upload to Firebase Storage
  if (isFirebaseConfigured()) {
    try {
      // Compress image first
      const compressedResult = await compressImage(file, 0.7, 1200);
      const fileToUpload = compressedResult.success && compressedResult.data 
        ? compressedResult.data 
        : file;
      
      const fileName = `${path}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const storageRef = ref(storage, fileName);
      const snapshot = await uploadBytes(storageRef, fileToUpload);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return {
        success: true,
        data: downloadURL,
        message: 'Gambar berhasil diupload ke Firebase Storage',
      };
    } catch (error) {
      console.error('Firebase Storage upload error:', error);
      // Fallback to base64 for local storage only
      return uploadImageAsBase64(file);
    }
  }

  // Fallback: Convert to base64 (for localStorage only)
  return uploadImageAsBase64(file);
};

/**
 * Upload image as base64 (fallback when Firebase not configured)
 */
const uploadImageAsBase64 = async (file: File): Promise<ServiceResponse<string>> => {
  try {
    const compressedResult = await compressImage(file, 0.6, 800);
    
    if (compressedResult.success && compressedResult.data) {
      const compressedBlob = compressedResult.data;
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setTimeout(() => {
            resolve({
              success: true,
              data: reader.result as string,
              message: 'Gambar berhasil dikompres dan diproses',
            });
          }, 300);
        };
        reader.onerror = () => {
          resolve({
            success: false,
            error: 'Gagal membaca file gambar',
            message: 'Error saat memproses gambar',
          });
        };
        reader.readAsDataURL(compressedBlob);
      });
    }
  } catch {
    // Fallback to original if compression fails
    console.warn('Compression failed, using original file');
  }

  // Fallback: Convert original to base64
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onloadend = () => {
      setTimeout(() => {
        resolve({
          success: true,
          data: reader.result as string,
          message: 'Gambar berhasil diproses (mock base64)',
        });
      }, 300);
    };

    reader.onerror = () => {
      resolve({
        success: false,
        error: 'Gagal membaca file gambar',
        message: 'Error saat memproses gambar',
      });
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Upload Multiple Images
 * Upload beberapa gambar sekaligus
 * 
 * @param files - Array file gambar
 * @param path - Path folder di storage
 * @returns Promise dengan array URL gambar
 */
export const uploadMultipleImages = async (
  files: File[], 
  path: string = 'laporan'
): Promise<ServiceResponse<string[]>> => {
  try {
    const uploadPromises = files.map(file => uploadImage(file, path));
    const results = await Promise.all(uploadPromises);
    
    const successfulUploads = results
      .filter(r => r.success && r.data)
      .map(r => r.data as string);
    
    const failedCount = results.filter(r => !r.success).length;

    if (failedCount > 0) {
      return {
        success: true,
        data: successfulUploads,
        message: `${successfulUploads.length} gambar berhasil, ${failedCount} gagal`,
      };
    }

    return {
      success: true,
      data: successfulUploads,
      message: `${successfulUploads.length} gambar berhasil diupload`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Gagal mengupload gambar',
    };
  }
};

/**
 * Delete Image
 * Hapus gambar dari storage
 * 
 * @param imageUrl - URL atau path gambar yang akan dihapus
 */
export const deleteImage = async (imageUrl: string): Promise<ServiceResponse<null>> => {
  // TODO: Delete from Firebase Storage
  // ---------------------------------------------------------
  // if (isFirebaseConfigured()) {
  //   try {
  //     const imageRef = ref(storage, imageUrl);
  //     await deleteObject(imageRef);
  //     return { success: true, message: 'Gambar berhasil dihapus' };
  //   } catch (error) {
  //     return { success: false, error: error.message };
  //   }
  // }
  // ---------------------------------------------------------

  // Mock implementation: Just return success
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        message: 'Gambar berhasil dihapus (mock)',
      });
    }, 200);
  });
};

/**
 * Validate Image File
 * Validasi file gambar sebelum upload
 * 
 * @param file - File yang akan divalidasi
 * @param maxSizeMB - Ukuran maksimal dalam MB (default 5MB)
 */
export const validateImageFile = (
  file: File, 
  maxSizeMB: number = 5
): ServiceResponse<null> => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  if (!allowedTypes.includes(file.type)) {
    return {
      success: false,
      error: 'Format file tidak didukung',
      message: 'Gunakan format JPG, PNG, GIF, atau WebP',
    };
  }

  if (file.size > maxSizeBytes) {
    return {
      success: false,
      error: 'Ukuran file terlalu besar',
      message: `Maksimal ukuran file adalah ${maxSizeMB}MB`,
    };
  }

  return {
    success: true,
    message: 'File valid',
  };
};

/**
 * Compress Image
 * Kompres gambar sebelum upload (untuk menghemat storage)
 * 
 * @param file - File gambar
 * @param quality - Kualitas kompresi (0-1, default 0.8)
 * @param maxWidth - Lebar maksimal (default 1920px)
 */
export const compressImage = async (
  file: File,
  quality: number = 0.8,
  maxWidth: number = 1920
): Promise<ServiceResponse<Blob>> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        
        // Resize if needed
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({
            success: false,
            error: 'Canvas context tidak tersedia',
          });
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({
                success: true,
                data: blob,
                message: 'Gambar berhasil dikompres',
              });
            } else {
              resolve({
                success: false,
                error: 'Gagal mengkompres gambar',
              });
            }
          },
          'image/jpeg',
          quality
        );
      };
      
      img.onerror = () => {
        resolve({
          success: false,
          error: 'Gagal memuat gambar',
        });
      };
      
      img.src = event.target?.result as string;
    };
    
    reader.onerror = () => {
      resolve({
        success: false,
        error: 'Gagal membaca file',
      });
    };
    
    reader.readAsDataURL(file);
  });
};
