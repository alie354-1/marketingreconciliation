import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '../../utils/cn';
import { glassEffects } from '../../theme';

export interface MetricCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  changeValue?: string | number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon?: React.ReactNode;
  trend?: number[];
  isLoading?: boolean;
  onClick?: () => void;
  variant?: 'default' | 'glass' | 'outline' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function MetricCard({
  title,
  value,
  subValue,
  changeValue,
  changeType = 'increase',
  icon,
  trend,
  isLoading = false,
  onClick,
  variant = 'default',
  size = 'md',
  className,
}: MetricCardProps) {
  
  // Handle size classes
  const sizeClasses = {
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-6',
  };
  
  // Handle variant styling
  const variantClasses = {
    default: 'bg-white border border-gray-200',
    glass: 'bg-opacity-80 backdrop-blur-md border border-white/20 shadow-lg',
    outline: 'bg-white border-2 border-primary-100',
    gradient: 'bg-gradient-to-br from-primary-50 to-white border border-primary-100',
  };
  
  // Handle loading state
  if (isLoading) {
    return (
      <div 
        className={cn(
          "rounded-xl animate-pulse",
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
      >
        <div className="flex items-center justify-between">
          <div className="h-5 bg-gray-200 rounded w-1/3"></div>
          <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
        </div>
        <div className="h-8 bg-gray-300 rounded mt-4 w-1/2"></div>
        {subValue && <div className="h-4 bg-gray-200 rounded mt-2 w-1/4"></div>}
      </div>
    );
  }
  
  // Handle glass effect if needed
  const glassStyle = variant === 'glass' ? {
    background: glassEffects.light.background,
    backdropFilter: glassEffects.light.backdropFilter,
    border: glassEffects.light.border,
    boxShadow: glassEffects.light.boxShadow,
  } : {};
  
  return (
    <div 
      className={cn(
        "rounded-xl transition-all duration-200 shadow-sm",
        onClick && "cursor-pointer hover:shadow-md",
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      onClick={onClick}
      style={glassStyle}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        {icon && (
          <div className="h-9 w-9 rounded-full bg-primary-50 flex items-center justify-center text-primary-500">
            {icon}
          </div>
        )}
      </div>
      
      <div className="flex items-baseline gap-2">
        <div className="text-2xl md:text-3xl font-bold text-gray-900">
          {value}
        </div>
        {subValue && (
          <span className="text-sm text-gray-500">
            {subValue}
          </span>
        )}
      </div>
      
      {changeValue && (
        <div className="mt-2 flex items-center">
          {changeType === 'increase' ? (
            <ArrowUpRight className="h-4 w-4 text-success-500 mr-1" />
          ) : changeType === 'decrease' ? (
            <ArrowDownRight className="h-4 w-4 text-danger-500 mr-1" />
          ) : null}
          
          <span 
            className={cn(
              "text-sm font-medium",
              changeType === 'increase' ? "text-success-600" : 
              changeType === 'decrease' ? "text-danger-600" : 
              "text-gray-600"
            )}
          >
            {changeValue}
          </span>
        </div>
      )}
      
      {/* Mini trend chart visualization */}
      {trend && trend.length > 0 && (
        <div className="mt-3 flex items-end h-10 gap-1">
          {trend.map((value, index) => {
            // Normalize to percentage height (0-100%)
            const max = Math.max(...trend);
            const height = max > 0 ? (value / max) * 100 : 0;
            
            return (
              <div 
                key={index}
                className={cn(
                  "flex-1 rounded-t",
                  changeType === 'increase' ? "bg-success-200" : 
                  changeType === 'decrease' ? "bg-danger-200" : 
                  "bg-primary-200"
                )}
                style={{ height: `${height}%` }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
