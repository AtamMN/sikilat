/**
 * Firebase Configuration
 * SIKILAT - Sistem Informasi Laporan Kegiatan Terintegrasi
 * 
 * File ini berisi inisialisasi Firebase App dengan Firestore Database.
 * Konfigurasi diambil dari environment variables (.env.local)
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database';

/**
 * Firebase Configuration Object
 * Menggunakan environment variables untuk keamanan
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
};

/**
 * Initialize Firebase App
 * Menggunakan singleton pattern untuk menghindari multiple initialization
 */
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

/**
 * Firebase Services
 * Export services yang akan digunakan di seluruh aplikasi
 */

// Firestore Database
export const db = getFirestore(app);

// Firebase Storage (untuk upload gambar - memerlukan Blaze plan)
export const storage = getStorage(app);

// Firebase Realtime Database (untuk menyimpan gambar sebagai base64)
export const realtimeDb = getDatabase(app);

/**
 * Helper function untuk cek apakah Firebase sudah dikonfigurasi
 */
export const isFirebaseConfigured = (): boolean => {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.apiKey !== ''
  );
};

/**
 * Export config untuk debugging (jangan gunakan di production)
 */
export const getFirebaseConfig = () => {
  if (process.env.NODE_ENV === 'development') {
    return firebaseConfig;
  }
  return null;
};

export { app };
export default firebaseConfig;
