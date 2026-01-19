/**
 * Rich Text Editor Component
 * SIKILAT - Sistem Informasi Laporan Kegiatan Terintegrasi
 * 
 * Komponen rich text editor dengan formatting tools.
 * Menggunakan react-quill-new untuk editor WYSIWYG.
 */

'use client';

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { FieldError } from 'react-hook-form';
import 'react-quill-new/dist/quill.snow.css';

// Import Quill secara dynamic untuk menghindari SSR issues
const ReactQuill = dynamic(
  () => import('react-quill-new'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-[150px] border border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
        <span className="text-gray-400">Memuat editor...</span>
      </div>
    ),
  }
);

interface RichTextEditorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: FieldError;
  helpText?: string;
  disabled?: boolean;
  minHeight?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  label,
  value,
  onChange,
  placeholder = '',
  required = false,
  error,
  helpText,
  disabled = false,
  minHeight = '150px',
}) => {
  // Konfigurasi toolbar Quill - lengkap tapi clean
  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        [{ 'align': [] }],
        ['clean'],
      ],
    },
    clipboard: {
      matchVisual: false,
    },
  }), []);

  // Format yang diizinkan
  const formats = [
    'header',
    'bold', 'italic', 'underline',
    'list',
    'align',
  ];

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div 
        className={`
          rich-text-editor-wrapper rounded-lg overflow-hidden
          ${error 
            ? 'ring-2 ring-red-500 border-red-500' 
            : 'border border-gray-300 hover:border-gray-400 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500'
          }
          ${disabled ? 'opacity-50 pointer-events-none' : ''}
        `}
        style={{ 
          ['--editor-min-height' as string]: minHeight,
        }}
      >
        <ReactQuill
          theme="snow"
          value={value || ''}
          onChange={onChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
          readOnly={disabled}
        />
      </div>

      {helpText && !error && (
        <p className="text-xs text-gray-500">{helpText}</p>
      )}

      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error.message}
        </p>
      )}
    </div>
  );
};

export default RichTextEditor;
