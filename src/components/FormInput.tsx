/**
 * Form Input Component
 * SIKILAT - Sistem Informasi Laporan Kegiatan Terintegrasi
 * 
 * Komponen input form yang reusable dengan styling konsisten.
 */

'use client';

import React from 'react';
import { UseFormRegister, FieldError, FieldValues, Path } from 'react-hook-form';

interface FormInputProps<T extends FieldValues = FieldValues> {
  label: string;
  name: Path<T>;
  type?: 'text' | 'date' | 'email' | 'textarea' | 'select';
  placeholder?: string;
  required?: boolean;
  register: UseFormRegister<T>;
  error?: FieldError;
  options?: { value: string; label: string }[];
  rows?: number;
  helpText?: string;
  disabled?: boolean;
}

const FormInput = <T extends FieldValues = FieldValues>({
  label,
  name,
  type = 'text',
  placeholder,
  required = false,
  register,
  error,
  options,
  rows = 4,
  helpText,
  disabled = false,
}: FormInputProps<T>) => {
  const baseInputStyles = `
    w-full px-4 py-2.5 border rounded-lg
    focus:ring-2 focus:ring-blue-500 focus:border-blue-500
    transition-colors duration-200
    disabled:bg-gray-100 disabled:cursor-not-allowed
    ${error 
      ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
      : 'border-gray-300 hover:border-gray-400'
    }
  `;

  return (
    <div className="space-y-1">
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {type === 'textarea' ? (
        <textarea
          id={name}
          {...register(name, { required: required ? `${label} wajib diisi` : false })}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled}
          className={`${baseInputStyles} resize-none`}
        />
      ) : type === 'select' ? (
        <select
          id={name}
          {...register(name, { required: required ? `${label} wajib diisi` : false })}
          disabled={disabled}
          className={baseInputStyles}
        >
          <option value="">Pilih {label}</option>
          {options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          id={name}
          {...register(name, { required: required ? `${label} wajib diisi` : false })}
          placeholder={placeholder}
          disabled={disabled}
          className={baseInputStyles}
        />
      )}

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

export default FormInput;
