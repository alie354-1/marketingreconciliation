import React, { useEffect, useState } from 'react';
import { cn } from '../../utils/cn';

interface RangeSliderProps {
  min: number;
  max: number;
  step?: number;
  defaultValue: number;
  value?: number;
  onChange?: (value: number) => void;
  label?: string;
  displayValue?: boolean;
  valuePrefix?: string;
  valueSuffix?: string;
  className?: string;
  trackClassName?: string;
  thumbClassName?: string;
  isNegativePositive?: boolean; // For values that can be both negative and positive
}

const RangeSlider: React.FC<RangeSliderProps> = ({
  min,
  max,
  step = 1,
  defaultValue,
  value: controlledValue,
  onChange,
  label,
  displayValue = true,
  valuePrefix = '',
  valueSuffix = '',
  className = '',
  trackClassName = '',
  thumbClassName = '',
  isNegativePositive = false,
}) => {
  // Support both controlled and uncontrolled modes
  const [internalValue, setInternalValue] = useState(defaultValue);
  const value = controlledValue !== undefined ? controlledValue : internalValue;
  
  // Handle slider change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    setInternalValue(newValue);
    onChange && onChange(newValue);
  };
  
  // Calculate progress percentage for styling
  const progressPercent = ((value - min) / (max - min)) * 100;
  
  // Get color based on value and isNegativePositive flag
  const getColor = () => {
    if (!isNegativePositive) return '#4F46E5'; // Default indigo
    
    if (value === 0) return '#9CA3AF'; // Gray
    return value > 0 ? '#10B981' : '#EF4444'; // Green for positive, red for negative
  };
  
  // Calculate neutral point for zero in negative/positive sliders
  const neutralPoint = isNegativePositive ? (-min / (max - min)) * 100 : 0;
  
  return (
    <div className={cn("w-full", className)}>
      {(label || displayValue) && (
        <div className="flex justify-between items-center mb-2">
          {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
          {displayValue && (
            <div className="text-sm font-medium">
              {valuePrefix}
              {value.toFixed(step < 1 ? String(step).split('.')[1].length : 0)}
              {valueSuffix}
            </div>
          )}
        </div>
      )}
      
      <div className="relative">
        {/* Track background */}
        <div 
          className={cn(
            "absolute h-2 rounded-full bg-gray-200 left-0 right-0",
            trackClassName
          )}
        />
        
        {/* Active track fill */}
        {isNegativePositive ? (
          <>
            {/* For negative/positive sliders, we need two fills */}
            {value < 0 && (
              <div 
                className="absolute h-2 rounded-full bg-red-500 left-0"
                style={{ 
                  left: `${neutralPoint}%`, 
                  width: `${neutralPoint - progressPercent}%`,
                  backgroundColor: getColor()
                }}
              />
            )}
            {value > 0 && (
              <div 
                className="absolute h-2 rounded-full bg-green-500"
                style={{ 
                  left: `${neutralPoint}%`, 
                  width: `${progressPercent - neutralPoint}%`,
                  backgroundColor: getColor()
                }}
              />
            )}
            {/* Zero line indicator */}
            <div 
              className="absolute h-5 w-0.5 bg-gray-400 rounded"
              style={{ left: `${neutralPoint}%`, top: '-2px' }}
            />
          </>
        ) : (
          <div 
            className="absolute h-2 rounded-full" 
            style={{ 
              width: `${progressPercent}%`, 
              backgroundColor: getColor()
            }}
          />
        )}
        
        {/* Input range */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          className={cn(
            "absolute w-full h-2 opacity-0 cursor-pointer z-10",
            "focus:outline-none",
          )}
        />
        
        {/* Thumb */}
        <div 
          className={cn(
            "absolute h-5 w-5 rounded-full bg-white border-2 shadow-sm",
            "transform -translate-x-1/2 -translate-y-1/2 top-1",
            thumbClassName
          )}
          style={{ 
            left: `${progressPercent}%`,
            borderColor: getColor()
          }}
        />
      </div>
      
      {/* Min-max labels */}
      <div className="flex justify-between mt-1">
        <span className="text-xs text-gray-500">{min}{valueSuffix}</span>
        <span className="text-xs text-gray-500">{max}{valueSuffix}</span>
      </div>
    </div>
  );
};

export { RangeSlider };
