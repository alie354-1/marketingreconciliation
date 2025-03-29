import React, { useState, useEffect } from 'react';
import { cn } from '../../utils/cn';
import { X, Search } from 'lucide-react';

export interface MultiSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
  isDisabled?: boolean;
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = 'Select options',
  className,
  isDisabled = false
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Reset search query when dropdown closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);
  
  const selectedOptions = options.filter(option => value.includes(option.value));
  
  // Filter options based on search query
  const filteredOptions = options.filter(option => 
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const toggleOption = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter(v => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
      // Keep dropdown open after selection
    }
  };
  
  const removeOption = (e: React.MouseEvent, optionValue: string) => {
    e.stopPropagation();
    onChange(value.filter(v => v !== optionValue));
  };
  
  // Handle search input click to prevent dropdown from closing
  const handleSearchClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };
  
  return (
    <div className="relative">
      <div
        className={cn(
          'min-h-10 px-3 py-2 border rounded-md w-full text-sm relative flex flex-wrap items-center gap-1',
          isOpen ? 'border-primary-500 ring-1 ring-primary-500' : 'border-gray-300',
          isDisabled ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer',
          className
        )}
        onClick={() => !isDisabled && setIsOpen(!isOpen)}
      >
        {selectedOptions.length > 0 ? (
          selectedOptions.map(option => (
            <span 
              key={option.value}
              className="bg-primary-100 text-primary-800 rounded px-2 py-1 text-xs flex items-center"
            >
              {option.label}
              <button 
                type="button"
                onClick={(e) => !isDisabled && removeOption(e, option.value)}
                className="ml-1 text-primary-600 hover:text-primary-800"
                disabled={isDisabled}
              >
                <X size={14} />
              </button>
            </span>
          ))
        ) : (
          <span className="text-gray-500">{placeholder}</span>
        )}
      </div>
      
      {isOpen && !isDisabled && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {/* Search box */}
          <div className="sticky top-0 bg-white border-b border-gray-200 p-2">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClick={handleSearchClick}
                placeholder="Search..."
                className="w-full py-1.5 pl-8 pr-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              />
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>
          
          {/* Options list */}
          <div className="p-2 space-y-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(option => (
                <div
                  key={option.value}
                  className={cn(
                    'px-3 py-2 text-sm rounded-md cursor-pointer',
                    value.includes(option.value) 
                      ? 'bg-primary-100 text-primary-800' 
                      : 'hover:bg-gray-100',
                    option.disabled && 'opacity-50 cursor-not-allowed'
                  )}
                  onClick={() => !option.disabled && toggleOption(option.value)}
                >
                  {option.label}
                </div>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-gray-500 italic">
                No options found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
