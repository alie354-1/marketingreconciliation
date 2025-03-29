import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, TrendingUp, Users, PieChart, LineChart } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface CampaignCardProps {
  id: string;
  name: string;
  target: {
    specialty?: string;
    geographic?: string;
    condition?: string;
    medication?: string;
  };
  metrics: {
    impressions?: number;
    clicks?: number;
    conversions?: number;
    scriptLift?: string | number;
    roi?: string | number;
    providerReach?: number;
  };
  status: 'active' | 'draft' | 'ended' | 'paused';
  startDate?: string;
  endDate?: string;
  className?: string;
}

export function CampaignCard({
  id,
  name,
  target,
  metrics,
  status,
  startDate,
  endDate,
  className,
}: CampaignCardProps) {
  const formattedStartDate = startDate ? new Date(startDate).toLocaleDateString() : 'Not started';
  const formattedEndDate = endDate ? new Date(endDate).toLocaleDateString() : 'Ongoing';
  
  // Determine card border color based on status
  const statusColor = {
    active: 'border-l-success-500',
    draft: 'border-l-gray-400',
    ended: 'border-l-gray-500',
    paused: 'border-l-warning-500',
  };
  
  // Format numbers with commas
  const formatNumber = (num: number | undefined) => {
    if (num === undefined) return 'N/A';
    return num.toLocaleString();
  };
  
  // Format percentage
  const formatPercentage = (value: string | number | undefined) => {
    if (value === undefined) return 'N/A';
    if (typeof value === 'string' && value.includes('%')) return value;
    return `${value}%`;
  };
  
  return (
    <div 
      className={cn(
        "bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg border-l-4",
        statusColor[status],
        className
      )}
    >
      {/* Header */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 truncate">{name}</h3>
          <span 
            className={cn(
              "px-2.5 py-1 text-xs font-medium rounded-full capitalize",
              status === 'active' ? "bg-success-100 text-success-700" :
              status === 'draft' ? "bg-gray-100 text-gray-700" :
              status === 'paused' ? "bg-warning-100 text-warning-700" :
              "bg-gray-200 text-gray-800"
            )}
          >
            {status}
          </span>
        </div>
        <div className="mt-1 text-sm text-gray-500">
          {formattedStartDate} {endDate ? `- ${formattedEndDate}` : ''}
        </div>
      </div>
      
      {/* Target Information */}
      <div className="p-5 border-b border-gray-100 bg-gray-50">
        <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-2 font-medium">
          Target Audience
        </h4>
        <div className="grid grid-cols-2 gap-3">
          {target.specialty && (
            <div>
              <span className="text-xs text-gray-500">Specialty</span>
              <p className="text-sm font-medium text-gray-800">{target.specialty}</p>
            </div>
          )}
          {target.geographic && (
            <div>
              <span className="text-xs text-gray-500">Region</span>
              <p className="text-sm font-medium text-gray-800">{target.geographic}</p>
            </div>
          )}
          {target.condition && (
            <div>
              <span className="text-xs text-gray-500">Condition</span>
              <p className="text-sm font-medium text-gray-800">{target.condition}</p>
            </div>
          )}
          {target.medication && (
            <div>
              <span className="text-xs text-gray-500">Medication</span>
              <p className="text-sm font-medium text-gray-800">{target.medication}</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Key Metrics */}
      <div className="p-5">
        <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-3 font-medium">
          Key Performance Metrics
        </h4>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 mb-1 flex items-center">
              <PieChart className="h-3 w-3 mr-1 text-primary-500" />
              Script Lift
            </span>
            <span className={cn(
              "text-base font-semibold",
              typeof metrics.scriptLift === 'number' && metrics.scriptLift > 0 ? "text-success-600" : "text-gray-900"
            )}>
              {metrics.scriptLift ? formatPercentage(metrics.scriptLift) : 'N/A'}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 mb-1 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-primary-500" />
              ROI
            </span>
            <span className={cn(
              "text-base font-semibold",
              typeof metrics.roi === 'number' && metrics.roi > 100 ? "text-success-600" : "text-gray-900"
            )}>
              {metrics.roi ? metrics.roi + 'x' : 'N/A'}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 mb-1 flex items-center">
              <Users className="h-3 w-3 mr-1 text-primary-500" />
              Providers
            </span>
            <span className="text-base font-semibold text-gray-900">
              {formatNumber(metrics.providerReach)}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 mb-1">Impressions</span>
            <span className="text-sm font-medium text-gray-900">
              {formatNumber(metrics.impressions)}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 mb-1">Clicks</span>
            <span className="text-sm font-medium text-gray-900">
              {formatNumber(metrics.clicks)}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 mb-1">Conversions</span>
            <span className="text-sm font-medium text-gray-900">
              {formatNumber(metrics.conversions)}
            </span>
          </div>
        </div>
      </div>
      
      {/* Footer with link */}
      <div className="p-4 border-t border-gray-100 bg-gray-50">
        <Link 
          to={`/campaigns/${id}`}
          className="flex items-center justify-end text-sm font-medium text-primary-600 hover:text-primary-700 group"
        >
          View Campaign Details
          <ArrowRight className="ml-1 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  );
}
