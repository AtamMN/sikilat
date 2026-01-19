/**
 * Storage Utilities
 * SIKILAT - Sistem Informasi Laporan Kegiatan Terintegrasi
 * 
 * Utility functions untuk localStorage/sessionStorage
 * Digunakan sebagai mock storage selama development
 */

const STORAGE_KEYS = {
  LAPORAN_DATA: 'sikilat_laporan_data',
  LAPORAN_LIST: 'sikilat_laporan_list',
  USER_DATA: 'sikilat_user_data',
  DRAFT_DATA: 'sikilat_draft_data',
} as const;

/**
 * Check if window is available (client-side)
 */
const isClient = typeof window !== 'undefined';

/**
 * Save data to localStorage with quota handling
 */
export const saveToLocalStorage = <T>(key: string, data: T): boolean => {
  if (!isClient) return false;
  
  const serialized = JSON.stringify(data);
  
  try {
    localStorage.setItem(key, serialized);
    return true;
  } catch (error) {
    // Handle QuotaExceededError
    if (error instanceof DOMException && 
        (error.code === 22 || error.code === 1014 || error.name === 'QuotaExceededError')) {
      console.warn('localStorage quota exceeded. Trying to clear old data...');
      
      // Try to clear old laporan list and retry
      try {
        localStorage.removeItem(STORAGE_KEYS.LAPORAN_LIST);
        localStorage.setItem(key, serialized);
        return true;
      } catch (retryError) {
        console.error('Still exceeded quota after clearing. Data too large for localStorage.');
        return false;
      }
    }
    console.error('Error saving to localStorage:', error);
    return false;
  }
};

/**
 * Get data from localStorage
 */
export const getFromLocalStorage = <T>(key: string): T | null => {
  if (!isClient) return null;
  
  try {
    const serialized = localStorage.getItem(key);
    if (serialized === null) return null;
    return JSON.parse(serialized) as T;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return null;
  }
};

/**
 * Remove data from localStorage
 */
export const removeFromLocalStorage = (key: string): boolean => {
  if (!isClient) return false;
  
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Error removing from localStorage:', error);
    return false;
  }
};

/**
 * Save data to sessionStorage
 */
export const saveToSessionStorage = <T>(key: string, data: T): boolean => {
  if (!isClient) return false;
  
  try {
    const serialized = JSON.stringify(data);
    sessionStorage.setItem(key, serialized);
    return true;
  } catch (error) {
    console.error('Error saving to sessionStorage:', error);
    return false;
  }
};

/**
 * Get data from sessionStorage
 */
export const getFromSessionStorage = <T>(key: string): T | null => {
  if (!isClient) return null;
  
  try {
    const serialized = sessionStorage.getItem(key);
    if (serialized === null) return null;
    return JSON.parse(serialized) as T;
  } catch (error) {
    console.error('Error reading from sessionStorage:', error);
    return null;
  }
};

/**
 * Remove data from sessionStorage
 */
export const removeFromSessionStorage = (key: string): boolean => {
  if (!isClient) return false;
  
  try {
    sessionStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Error removing from sessionStorage:', error);
    return false;
  }
};

/**
 * Clear all SIKILAT data from storage
 */
export const clearAllSikilatData = (): void => {
  if (!isClient) return;
  
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
};

export { STORAGE_KEYS };
