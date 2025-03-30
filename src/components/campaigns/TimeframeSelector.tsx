import React, { useState, useEffect } from 'react';
import { Input } from '../ui/Input';
import { Tooltip } from '../ui/Tooltip';
import { Clock, HelpCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface TimeframeRange {
  daysBefore: number;
  daysAfter: number;
}

interface TimeframeSelectorProps {
  value: TimeframeRange;
  onChange: (value: TimeframeRange) => void;
  minDays?: number;
  maxDays?: number;
  disabled?: boolean;
  className?: string;
}

export const TimeframeSelector: React.FC<TimeframeSelectorProps> = ({
  value,
  onChange,
  minDays = 7,
  maxDays = 180,
  disabled = false,
  className,
}) => {
  // Local state for input values
  const [daysBefore, setDaysBefore] = useState<string>(value.daysBefore.toString());
  const [daysAfter, setDaysAfter] = useState<string>(value.daysAfter.toString());
  const [errors, setErrors] = useState<{ before?: string; after?: string }>({});

  // Sync local state with props
  useEffect(() => {
    setDaysBefore(value.daysBefore.toString());
    setDaysAfter(value.daysAfter.toString());
  }, [value.daysBefore, value.daysAfter]);

  // Validate and update the timeframe
  const validateAndUpdate = (field: 'before' | 'after', inputValue: string) => {
    // Clear error for this field
    setErrors(prev => ({ ...prev, [field]: undefined }));
    
    // Parse and validate the input
    const numValue = parseInt(inputValue, 10);
    
    if (isNaN(numValue)) {
      setErrors(prev => ({ ...prev, [field]: 'Please enter a valid number' }));
      return;
    }
    
    if (numValue < minDays) {
      setErrors(prev => ({ ...prev, [field]: `Minimum is ${minDays} days` }));
      return;
    }
    
    if (numValue > maxDays) {
      setErrors(prev => ({ ...prev, [field]: `Maximum is ${maxDays} days` }));
      return;
    }
    
    // Update the parent component with the new valid values
    if (field === 'before') {
      onChange({ daysBefore: numValue, daysAfter: parseInt(daysAfter, 10) });
    } else {
      onChange({ daysBefore: parseInt(daysBefore, 10), daysAfter: numValue });
    }
  };

  // Handle input changes
  const handleBeforeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setDaysBefore(newValue);
  };

  const handleAfterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setDaysAfter(newValue);
  };

  // Handle blur events to validate and update
  const handleBeforeBlur = () => {
    validateAndUpdate('before', daysBefore);
  };

  const handleAfterBlur = () => {
    validateAndUpdate('after', daysAfter);
  };

  return (
    <div className={cn("bg-white rounded-lg p-4 border border-gray-200", className)}>
      <div className="flex items-center mb-3">
        <Clock className="h-5 w-5 text-primary-500 mr-2" />
        <h3 className="text-md font-medium text-gray-700">Analysis Timeframe</h3>
        <Tooltip 
          content="Customize the time periods to analyze prescription data before and after the campaign start date."
          position="top"
          className="ml-1"
        >
          <HelpCircle className="h-4 w-4 text-gray-400" />
        </Tooltip>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Days Before Campaign
          </label>
          <Input
            type="number"
            value={daysBefore}
            onChange={handleBeforeChange}
            onBlur={handleBeforeBlur}
            min={minDays}
            max={maxDays}
            disabled={disabled}
            placeholder={`${minDays}-${maxDays} days`}
            className={errors.before ? "border-red-300" : ""}
          />
          {errors.before && (
            <p className="mt-1 text-xs text-red-500">{errors.before}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Analyze data from this many days before the campaign started
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Days After Campaign
          </label>
          <Input
            type="number"
            value={daysAfter}
            onChange={handleAfterChange}
            onBlur={handleAfterBlur}
            min={minDays}
            max={maxDays}
            disabled={disabled}
            placeholder={`${minDays}-${maxDays} days`}
            className={errors.after ? "border-red-300" : ""}
          />
          {errors.after && (
            <p className="mt-1 text-xs text-red-500">{errors.after}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Analyze data up to this many days after the campaign started
          </p>
        </div>
      </div>
    </div>
  );
};
