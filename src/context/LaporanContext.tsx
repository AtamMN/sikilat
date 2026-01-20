/**
 * Laporan Context
 * SIKILAT - Sistem Informasi Laporan Kegiatan Terintegrasi
 * 
 * Context untuk state management laporan di seluruh aplikasi.
 * Memungkinkan sharing data antara halaman form dan halaman template.
 */

'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { LaporanType, LaporanFormInput } from '@/types/laporan';
import { 
  submitLaporan, 
  getCurrentLaporan, 
  convertFormToLaporan,
  saveDraft,
  getDraft,
  clearDraft 
} from '@/services/laporanService';
import { uploadMultipleImages } from '@/services/imageService';
import { getFromLocalStorage, STORAGE_KEYS } from '@/lib/storage';

interface SubmitResult {
  success: boolean;
  warning?: string;
}

interface LaporanContextType {
  // State
  currentLaporan: LaporanType | null;
  isLoading: boolean;
  error: string | null;
  isDraftSaved: boolean;
  
  // Actions
  submitForm: (data: LaporanFormInput, images?: File[], editingId?: string) => Promise<SubmitResult>;
  loadCurrentLaporan: () => Promise<void>;
  clearCurrentLaporan: () => void;
  saveDraftData: (data: Partial<LaporanFormInput>) => Promise<{ success: boolean; warning?: string }>;
  loadDraftData: () => Promise<Partial<LaporanFormInput> | null>;
  clearDraftData: () => Promise<void>;
  setError: (error: string | null) => void;
}

const LaporanContext = createContext<LaporanContextType | undefined>(undefined);

export const LaporanProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLaporan, setCurrentLaporan] = useState<LaporanType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDraftSaved, setIsDraftSaved] = useState(false);

  /**
   * Submit form data dan simpan sebagai laporan
   */
  const submitForm = useCallback(async (data: LaporanFormInput, images?: File[], editingId?: string): Promise<SubmitResult> => {
    setIsLoading(true);
    setError(null);

    try {
      let imageUrls: string[] = [];

      // Upload images jika ada
      if (images && images.length > 0) {
        const uploadResult = await uploadMultipleImages(Array.from(images));
        if (uploadResult.success && uploadResult.data) {
          imageUrls = uploadResult.data;
        }
      }

      // Jika ada preview dari form (base64)
      if (data.gambarPreview && data.gambarPreview.length > 0) {
        imageUrls = [...imageUrls, ...data.gambarPreview];
      }

      // Convert form data ke LaporanType
      const laporanData = convertFormToLaporan({
        ...data,
        gambarPreview: imageUrls,
      });

      // Prioritaskan editingId dari parameter, kemudian cek localStorage untuk draft
      let existingDocId = editingId;
      if (!existingDocId) {
        const existingDraft = getFromLocalStorage<{ firebaseId?: string }>(STORAGE_KEYS.DRAFT_DATA);
        existingDocId = existingDraft?.firebaseId;
      }

      // Submit ke service (dengan existing ID jika ada)
      const result = await submitLaporan(laporanData, existingDocId);

      if (result.success && result.data) {
        setCurrentLaporan(result.data);
        // Clear draft setelah berhasil submit
        await clearDraft();
        setIsDraftSaved(false);
        return { success: true, warning: result.warning };
      } else {
        setError(result.error || 'Gagal menyimpan laporan');
        return { success: false };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan';
      setError(errorMessage);
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Load laporan yang baru disimpan
   */
  const loadCurrentLaporan = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getCurrentLaporan();
      if (result.success && result.data) {
        setCurrentLaporan(result.data);
      } else {
        setError(result.error || 'Laporan tidak ditemukan');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Clear current laporan dari state
   */
  const clearCurrentLaporan = useCallback(() => {
    setCurrentLaporan(null);
    setError(null);
  }, []);

  /**
   * Save draft data
   */
  const saveDraftData = useCallback(async (data: Partial<LaporanFormInput>): Promise<{ success: boolean; warning?: string }> => {
    const result = await saveDraft(data);
    if (result.success) {
      setIsDraftSaved(true);
      return { success: true, warning: result.warning };
    }
    return { success: false };
  }, []);

  /**
   * Load draft data
   */
  const loadDraftData = useCallback(async (): Promise<Partial<LaporanFormInput> | null> => {
    const result = await getDraft();
    if (result.success && result.data) {
      setIsDraftSaved(true);
      return result.data;
    }
    return null;
  }, []);

  /**
   * Clear draft data
   */
  const clearDraftData = useCallback(async () => {
    await clearDraft();
    setIsDraftSaved(false);
  }, []);

  // Load current laporan on mount (untuk kasus refresh page)
  useEffect(() => {
    loadCurrentLaporan();
  }, [loadCurrentLaporan]);

  const value: LaporanContextType = {
    currentLaporan,
    isLoading,
    error,
    isDraftSaved,
    submitForm,
    loadCurrentLaporan,
    clearCurrentLaporan,
    saveDraftData,
    loadDraftData,
    clearDraftData,
    setError,
  };

  return (
    <LaporanContext.Provider value={value}>
      {children}
    </LaporanContext.Provider>
  );
};

/**
 * Hook untuk mengakses Laporan Context
 */
export const useLaporan = (): LaporanContextType => {
  const context = useContext(LaporanContext);
  if (context === undefined) {
    throw new Error('useLaporan must be used within a LaporanProvider');
  }
  return context;
};

export default LaporanContext;
