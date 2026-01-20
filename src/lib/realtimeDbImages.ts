/**
 * Realtime Database Image Service
 * SIKILAT - Sistem Informasi Laporan Kegiatan Terintegrasi
 * 
 * Upload gambar ke Firebase Realtime Database sebagai Base64.
 * Gambar dikompres terlebih dahulu untuk menghemat storage.
 */

import { realtimeDb } from '@/lib/firebase';
import { ref, set, get, push } from 'firebase/database';

/**
 * Check if running in browser
 */
const isBrowser = (): boolean => {
  return typeof window !== 'undefined';
};

/**
 * Compress image before upload
 * Resize to max dimension and reduce quality
 */
const compressImage = (base64: string, maxWidth = 800, quality = 0.6): Promise<string> => {
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
 * Local Storage Cache for images
 */
const IMAGE_CACHE_PREFIX = 'sikilat_img_';

/**
 * Get cached image from localStorage
 */
const getCachedImage = (key: string): string | null => {
  if (!isBrowser()) return null;
  
  try {
    const cacheKey = IMAGE_CACHE_PREFIX + key.replace('rtdb://', '');
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      console.log('Image loaded from cache:', key);
      return cached;
    }
    return null;
  } catch (error) {
    console.warn('Failed to get cached image:', error);
    return null;
  }
};

/**
 * Clear old image caches to free up space
 */
const clearOldImageCache = (): void => {
  if (!isBrowser()) return;
  
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(IMAGE_CACHE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    // Remove half of the cached images
    const removeCount = Math.ceil(keysToRemove.length / 2);
    for (let i = 0; i < removeCount; i++) {
      localStorage.removeItem(keysToRemove[i]);
    }
    console.log(`Cleared ${removeCount} old cached images`);
  } catch (error) {
    console.warn('Failed to clear old cache:', error);
  }
};

/**
 * Save image to localStorage cache
 */
const setCachedImage = (key: string, data: string): void => {
  if (!isBrowser()) return;
  
  try {
    const cacheKey = IMAGE_CACHE_PREFIX + key.replace('rtdb://', '');
    localStorage.setItem(cacheKey, data);
    console.log('Image cached locally:', key);
  } catch (error) {
    // localStorage might be full, try to clear old caches
    console.warn('Failed to cache image, trying to clear old cache:', error);
    clearOldImageCache();
    try {
      const cacheKey = IMAGE_CACHE_PREFIX + key.replace('rtdb://', '');
      localStorage.setItem(cacheKey, data);
    } catch {
      console.warn('Still failed to cache image after clearing');
    }
  }
};

/**
 * Upload single image to Realtime Database
 * Returns the database reference path or null if failed
 */
export const uploadImageToRealtimeDb = async (base64Image: string): Promise<string | null> => {
  if (!base64Image || !base64Image.startsWith('data:')) {
    return base64Image; // Return as-is if not a data URL
  }

  try {
    // Compress image first
    console.log('Compressing image...');
    const compressed = await compressImage(base64Image);
    
    // Check size - Realtime DB has 10MB limit per write
    const sizeInMB = (compressed.length * 0.75) / (1024 * 1024); // Base64 to actual size
    if (sizeInMB > 9) {
      console.error('Image too large even after compression:', sizeInMB.toFixed(2), 'MB');
      return null;
    }

    // Generate unique ID and upload
    const imagesRef = ref(realtimeDb, 'images');
    const newImageRef = push(imagesRef);
    
    const imageData = {
      data: compressed,
      createdAt: new Date().toISOString(),
      size: compressed.length,
    };

    await set(newImageRef, imageData);
    
    // Return the key as identifier
    const imageKey = newImageRef.key;
    console.log('Realtime DB upload success, key:', imageKey);
    
    // Cache immediately after upload for faster retrieval later
    const rtdbUrl = `rtdb://${imageKey}`;
    setCachedImage(rtdbUrl, compressed);
    
    // Return a special URL format that we can parse later
    return rtdbUrl;
  } catch (error) {
    console.error('Realtime DB upload error:', error);
    return null;
  }
};

/**
 * Get image from Realtime Database by key with timeout
 */
export const getImageFromRealtimeDb = async (imageKey: string, timeoutMs = 10000): Promise<string | null> => {
  try {
    // Remove rtdb:// prefix if present
    const key = imageKey.replace('rtdb://', '');
    
    const imageRef = ref(realtimeDb, `images/${key}`);
    
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise<null>((_, reject) => {
      setTimeout(() => reject(new Error('Timeout fetching image')), timeoutMs);
    });
    
    const fetchPromise = get(imageRef).then(snapshot => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        return data.data || null;
      }
      return null;
    });
    
    const result = await Promise.race([fetchPromise, timeoutPromise]);
    return result;
  } catch (error) {
    console.error('Failed to get image from Realtime DB:', error);
    return null;
  }
};

/**
 * Check if a string is a Realtime DB image reference
 */
export const isRealtimeDbImage = (url: string): boolean => {
  return url?.startsWith('rtdb://');
};

/**
 * Resolve image URL with caching - if it's a Realtime DB reference, 
 * check local cache first, then fetch from DB and cache it
 */
export const resolveImageUrl = async (url: string): Promise<string | null> => {
  if (!url) return null;
  
  if (isRealtimeDbImage(url)) {
    // Check local cache first
    const cached = getCachedImage(url);
    if (cached) {
      return cached;
    }
    
    // Not in cache, fetch from DB
    console.log('Fetching image from Realtime DB:', url);
    const imageData = await getImageFromRealtimeDb(url);
    
    if (imageData) {
      // Save to local cache for future use
      setCachedImage(url, imageData);
      return imageData;
    }
    
    return null;
  }
  
  // Return as-is for http URLs or base64
  return url;
};

/**
 * Clear all image cache (useful for debugging or cleanup)
 */
export const clearAllImageCache = (): void => {
  if (!isBrowser()) return;
  
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(IMAGE_CACHE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log(`Cleared all ${keysToRemove.length} cached images`);
  } catch (error) {
    console.warn('Failed to clear image cache:', error);
  }
};

const realtimeDbImageService = {
  uploadImageToRealtimeDb,
  getImageFromRealtimeDb,
  isRealtimeDbImage,
  resolveImageUrl,
  clearAllImageCache,
};

export default realtimeDbImageService;
