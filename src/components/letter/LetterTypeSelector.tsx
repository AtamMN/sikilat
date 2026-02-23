/**
 * LetterTypeSelector Component
 * Dropdown untuk memilih jenis surat dengan UI yang modern
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { LetterType, LETTER_TYPE_OPTIONS } from '@/types/letter';

interface LetterTypeSelectorProps {
  value: LetterType | null;
  onChange: (type: LetterType) => void;
  disabled?: boolean;
}

export const LetterTypeSelector: React.FC<LetterTypeSelectorProps> = ({
  value,
  onChange,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const selectedOption = value 
    ? LETTER_TYPE_OPTIONS.find(opt => opt.value === value) 
    : null;
  
  const handleSelect = (type: LetterType) => {
    onChange(type);
    setIsOpen(false);
  };
  
  return (
    <div className="w-full" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Pilih Jenis Surat
      </label>
      
      <div className="relative">
        {/* Trigger Button */}
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`
            w-full px-4 py-3 text-left bg-white border rounded-lg shadow-sm
            flex items-center justify-between gap-3
            transition-all duration-200
            ${disabled 
              ? 'bg-gray-100 cursor-not-allowed opacity-60' 
              : 'hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            }
            ${isOpen ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-300'}
          `}
        >
          <div className="flex items-center gap-3 min-w-0">
            {selectedOption ? (
              <>
                <span className="text-2xl flex-shrink-0">{selectedOption.icon}</span>
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {selectedOption.label}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {selectedOption.description}
                  </p>
                </div>
              </>
            ) : (
              <span className="text-gray-400">Pilih jenis surat...</span>
            )}
          </div>
          
          {/* Chevron Icon */}
          <svg 
            className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="max-h-80 overflow-y-auto">
              {LETTER_TYPE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`
                    w-full px-4 py-3 text-left flex items-center gap-3
                    transition-colors duration-150
                    ${value === option.value 
                      ? 'bg-blue-50 border-l-4 border-blue-500' 
                      : 'hover:bg-gray-50 border-l-4 border-transparent'
                    }
                  `}
                >
                  <span className="text-2xl flex-shrink-0">{option.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className={`font-medium truncate ${value === option.value ? 'text-blue-700' : 'text-gray-900'}`}>
                      {option.label}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {option.description}
                    </p>
                  </div>
                  {value === option.value && (
                    <svg className="w-5 h-5 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Helper Text */}
      {!value && (
        <p className="mt-2 text-sm text-gray-500">
          Pilih jenis surat untuk menampilkan form yang sesuai
        </p>
      )}
    </div>
  );
};

export default LetterTypeSelector;
