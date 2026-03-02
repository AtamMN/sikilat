/**
 * Buat Surat Page
 * Halaman utama untuk membuat surat dengan document type selector
 */

'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import { LetterType, LetterData, getDefaultLetterData, LETTER_TYPE_OPTIONS } from '@/types/letter';
import { LetterTypeSelector } from '@/components/letter/LetterTypeSelector';
import { DynamicForm } from '@/components/letter/DynamicForm';
import { LetterPreview } from '@/components/letter/LetterPreview';
import { generateDocx } from '@/services/docxGenerator';

export default function BuatSuratPage() {
  // State management
  const [selectedType, setSelectedType] = useState<LetterType | null>(null);
  const [formData, setFormData] = useState<Partial<LetterData>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingDocx, setIsGeneratingDocx] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  const printRef = useRef<HTMLDivElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  
  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };
    
    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportMenu]);
  
  // Handle type change
  const handleTypeChange = useCallback((type: LetterType | null) => {
    setSelectedType(type);
    if (type) {
      setFormData(getDefaultLetterData(type));
    } else {
      setFormData({});
    }
  }, []);
  
  // Handle form data change
  const handleFormChange = useCallback((newData: Partial<LetterData>) => {
    setFormData(newData);
  }, []);
  
  // Get selected type info
  const selectedTypeInfo = selectedType 
    ? LETTER_TYPE_OPTIONS.find(opt => opt.value === selectedType)
    : null;
  

  
  // Handle generate PDF (using browser print)
  const handleGeneratePDF = useCallback(async () => {
    setIsGenerating(true);
    setShowExportMenu(false);
    
    // Small delay for UX
    await new Promise(resolve => setTimeout(resolve, 300));
    
    window.print();
    
    setIsGenerating(false);
  }, []);
  
  // Handle generate DOCX
  const handleGenerateDocx = useCallback(async () => {
    if (!selectedType) return;
    
    setIsGeneratingDocx(true);
    setShowExportMenu(false);
    
    try {
      await generateDocx(selectedType, formData);
    } catch (error) {
      console.error('Error generating DOCX:', error);
      alert('Gagal menghasilkan file DOCX. Silakan coba lagi.');
    } finally {
      setIsGeneratingDocx(false);
    }
  }, [selectedType, formData]);
  
  // Handle reset form
  const handleReset = useCallback(() => {
    if (confirm('Yakin ingin reset form? Semua data akan hilang.')) {
      if (selectedType) {
        setFormData(getDefaultLetterData(selectedType));
      }
    }
  }, [selectedType]);

  return (
    <>
      {/* Print styles moved to global CSS to avoid hydration mismatches */}
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-40 no-print">
          <div className="max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link 
                  href="/" 
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  <span className="hidden sm:inline">Kembali</span>
                </Link>
                <div className="h-6 w-px bg-gray-300" />
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">Buat Surat</h1>
                    <p className="text-sm text-gray-500">SIKILAT - Balai Bahasa Provinsi Jawa Barat</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {selectedType && (
                  <>
                    <button
                      onClick={handleReset}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:shadow-md transition-all flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Reset
                    </button>
                    <button
                      onClick={() => setShowPreview(!showPreview)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:shadow-md transition-all flex items-center gap-2"
                    >
                      {showPreview ? (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                          Sembunyikan Preview
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Tampilkan Preview
                        </>
                      )}
                    </button>
                    
                    {/* Export Dropdown */}
                    <div className="relative" ref={exportMenuRef}>
                      <button
                        onClick={() => setShowExportMenu(!showExportMenu)}
                        disabled={isGenerating || isGeneratingDocx}
                        className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-600/30 hover:shadow-xl transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {(isGenerating || isGeneratingDocx) ? (
                          <>
                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Generating...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Export
                            <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </>
                        )}
                      </button>
                      
                      {showExportMenu && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                          <button
                            onClick={handleGeneratePDF}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3"
                          >
                            <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM6 4h7l5 5v11H6V4zm3 9h2v5H9v-5zm4 0h2v5h-2v-5zm-5.5 0H9v1H7.5v1H9v1H7.5v2H6v-5h1.5z"/>
                            </svg>
                            <div>
                              <div className="font-medium">PDF</div>
                              <div className="text-xs text-gray-500">Cetak / Save as PDF</div>
                            </div>
                          </button>
                          <button
                            onClick={handleGenerateDocx}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3"
                          >
                            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zM6 20V4h6v6h6v10H6z"/>
                              <path d="M8 12h8v1H8zm0 2h8v1H8zm0 2h5v1H8z"/>
                            </svg>
                            <div>
                              <div className="font-medium">DOCX</div>
                              <div className="text-xs text-gray-500">Microsoft Word</div>
                            </div>
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>
        
        {/* Main Content */}
        <div className="max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-8 py-6 no-print">
          {/* Type Selector */}
          <div className="mb-6">
            <LetterTypeSelector
              value={selectedType}
              onChange={handleTypeChange}
            />
          </div>
          
          {/* Selected Type Info */}
          {selectedTypeInfo && (
            <div className="mb-6 p-5 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm text-2xl">
                  {selectedTypeInfo.icon}
                </div>
                <div>
                  <h3 className="font-bold text-indigo-900">{selectedTypeInfo.label}</h3>
                  <p className="text-sm text-indigo-700">{selectedTypeInfo.description}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Form + Preview Layout */}
          {selectedType ? (
            <div className={`grid gap-6 ${showPreview ? 'lg:grid-cols-2' : 'lg:grid-cols-1'}`}>
              {/* Form Section */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-5 py-4 border-b border-gray-200">
                  <h2 className="font-bold text-gray-800 flex items-center gap-2">
                    <span className="text-lg">📝</span> Form Data Surat
                  </h2>
                </div>
                <div className="p-5 max-h-[75vh] overflow-auto">
                  <DynamicForm
                    selectedType={selectedType}
                    data={formData}
                    onChange={handleFormChange}
                  />
                </div>
              </div>
              
              {/* Preview Section */}
              {showPreview && (
                <div className="lg:sticky lg:top-6 lg:self-start">
                  <LetterPreview
                    selectedType={selectedType}
                    data={formData}
                  />
                </div>
              )}
            </div>
          ) : (
            /* Empty State - No Type Selected */
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-100 rounded-2xl mb-6">
                <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Pilih Jenis Surat</h2>
              <p className="text-gray-500 mb-8 max-w-md mx-auto">
                Pilih jenis surat yang ingin Anda buat dari opsi di bawah ini
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
                {LETTER_TYPE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => handleTypeChange(opt.value)}
                    className="p-5 bg-gradient-to-br from-gray-50 to-white rounded-xl hover:from-indigo-50 hover:to-blue-50 border border-gray-200 hover:border-indigo-200 hover:shadow-lg transition-all group transform hover:-translate-y-0.5"
                  >
                    <span className="text-4xl block mb-3">{opt.icon}</span>
                    <span className="text-sm font-semibold text-gray-700 group-hover:text-indigo-700">
                      {opt.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <footer className="bg-white/80 backdrop-blur-sm border-t mt-8 py-4 no-print">
          <div className="max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
            <p>SIKILAT © 2026 - Balai Bahasa Provinsi Jawa Barat</p>
          </div>
        </footer>
      </div>
      
      {/* Print Area - Rendered outside main content flow for printing */}
      {selectedType && (
        <div className="print-area" ref={printRef}>
          <LetterPreview
            selectedType={selectedType}
            data={formData}
            forPrint={true}
          />
        </div>
      )}
    </>
  );
}
