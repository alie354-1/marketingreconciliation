import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, Info } from 'lucide-react';
import { cn } from '../../utils/cn';

interface TooltipProps {
  content: string;
  children?: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  icon?: 'help' | 'info' | 'none';
  iconSize?: number;
  iconClassName?: string;
  showOnHover?: boolean;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  className = '',
  icon = 'help',
  iconSize = 16,
  iconClassName = '',
  showOnHover = true,
}) => {
  const [show, setShow] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({
    top: 0,
    left: 0,
  });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Calculate positioning
  useEffect(() => {
    if (show && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      
      let top = 0;
      let left = 0;
      
      switch (position) {
        case 'top':
          top = -tooltipRect.height - 8;
          left = (triggerRect.width / 2) - (tooltipRect.width / 2);
          break;
        case 'bottom':
          top = triggerRect.height + 8;
          left = (triggerRect.width / 2) - (tooltipRect.width / 2);
          break;
        case 'left':
          top = (triggerRect.height / 2) - (tooltipRect.height / 2);
          left = -tooltipRect.width - 8;
          break;
        case 'right':
          top = (triggerRect.height / 2) - (tooltipRect.height / 2);
          left = triggerRect.width + 8;
          break;
      }
      
      setTooltipPosition({
        top,
        left,
      });
    }
  }, [show, position]);

  const handleMouseEnter = () => {
    if (showOnHover) {
      setShow(true);
    }
  };

  const handleMouseLeave = () => {
    if (showOnHover) {
      setShow(false);
    }
  };

  const handleClick = () => {
    if (!showOnHover) {
      setShow(!show);
    }
  };

  // Determine which icon to use
  const IconComponent = icon === 'help' ? HelpCircle : Info;

  return (
    <div
      ref={triggerRef}
      className={cn('inline-flex relative', className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {children ? (
        children
      ) : (
        icon !== 'none' && (
          <IconComponent
            size={iconSize}
            className={cn(
              'text-gray-400 hover:text-gray-600 cursor-help transition-colors',
              iconClassName
            )}
          />
        )
      )}
      
      {show && (
        <div
          ref={tooltipRef}
          className={cn(
            'absolute z-50 max-w-xs bg-gray-900 text-white text-sm rounded px-2 py-1 shadow-lg',
            'animate-fadeIn pointer-events-none'
          )}
          style={{
            top: tooltipPosition.top,
            left: tooltipPosition.left,
          }}
        >
          {content}
          {/* Arrow */}
          <div
            className={cn(
              'absolute w-2 h-2 bg-gray-900 transform rotate-45',
              position === 'top' && 'bottom-0 left-1/2 -mb-1 -ml-1',
              position === 'bottom' && 'top-0 left-1/2 -mt-1 -ml-1',
              position === 'left' && 'right-0 top-1/2 -mr-1 -mt-1',
              position === 'right' && 'left-0 top-1/2 -ml-1 -mt-1'
            )}
          />
        </div>
      )}
    </div>
  );
};
