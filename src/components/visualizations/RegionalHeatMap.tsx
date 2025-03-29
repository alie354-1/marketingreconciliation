import React from 'react';
import { colors } from '../../theme/colors';
import { cn } from '../../utils/cn';

interface RegionData {
  id: string;
  name: string;
  providerCount: number;
  percentage?: number;
}

interface RegionalHeatMapProps {
  regions: RegionData[];
  totalProviders: number;
  className?: string;
  colorScale?: string[];
  onRegionClick?: (region: RegionData) => void;
  highlightedRegion?: string;
  showLegend?: boolean;
  title?: string;
  subtitle?: string;
}

// Simplified US regions map - this would be expanded with more detailed SVG paths in a production version
const US_REGIONS = {
  northeast: {
    name: "Northeast",
    path: "M 80 30 L 95 25 L 100 45 L 90 50 L 80 45 Z",
    center: { x: 90, y: 37 }
  },
  southeast: {
    name: "Southeast",
    path: "M 80 45 L 90 50 L 95 70 L 75 65 L 70 55 Z",
    center: { x: 82, y: 58 }
  },
  midwest: {
    name: "Midwest",
    path: "M 50 30 L 80 30 L 80 45 L 70 55 L 60 50 L 50 40 Z",
    center: { x: 65, y: 40 }
  },
  southwest: {
    name: "Southwest",
    path: "M 30 50 L 60 50 L 70 55 L 75 65 L 50 70 L 25 60 Z",
    center: { x: 50, y: 60 }
  },
  west: {
    name: "West",
    path: "M 10 20 L 30 20 L 50 30 L 50 40 L 60 50 L 30 50 L 20 40 L 5 30 Z",
    center: { x: 30, y: 35 }
  }
};

export const RegionalHeatMap: React.FC<RegionalHeatMapProps> = ({
  regions,
  totalProviders,
  className,
  colorScale = [colors.primary[50], colors.primary[100], colors.primary[200], colors.primary[300], colors.primary[400], colors.primary[500], colors.primary[600], colors.primary[700]],
  onRegionClick,
  highlightedRegion,
  showLegend = true,
  title,
  subtitle,
}) => {
  // Calculate color intensity based on provider density
  const getRegionColor = (regionId: string) => {
    const region = regions.find(r => r.id === regionId);
    if (!region) return colorScale[0]; // Lightest color if no data
    
    const percentage = region.percentage || (region.providerCount / totalProviders) * 100;
    const colorIndex = Math.min(Math.floor(percentage / 12.5), colorScale.length - 1);
    return colorScale[colorIndex];
  };
  
  return (
    <div className={cn("bg-white rounded-lg p-4", className)}>
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <h3 className="text-lg font-semibold text-gray-800">{title}</h3>}
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
      )}
      
      <div className="relative">
        <svg viewBox="0 0 110 80" className="w-full h-auto">
          {/* Map Regions */}
          {Object.entries(US_REGIONS).map(([regionId, regionConfig]) => {
            const isHighlighted = highlightedRegion === regionId;
            const regionData = regions.find(r => r.id === regionId);
            const hasData = !!regionData;
            
            return (
              <g key={regionId}>
                <path
                  d={regionConfig.path}
                  fill={getRegionColor(regionId)}
                  stroke="#fff"
                  strokeWidth={isHighlighted ? 2 : 1}
                  opacity={hasData ? 1 : 0.5}
                  onClick={() => regionData && onRegionClick && onRegionClick(regionData)}
                  className={hasData ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}
                />
                
                {/* Region Label */}
                <text
                  x={regionConfig.center.x}
                  y={regionConfig.center.y}
                  textAnchor="middle"
                  fontSize="4"
                  fill="#fff"
                  fontWeight={isHighlighted ? "bold" : "normal"}
                >
                  {regionConfig.name}
                </text>
                
                {/* Provider Count (if data exists) */}
                {regionData && (
                  <text
                    x={regionConfig.center.x}
                    y={regionConfig.center.y + 5}
                    textAnchor="middle"
                    fontSize="3.5"
                    fill="#fff"
                    fontWeight="bold"
                  >
                    {regionData.providerCount.toLocaleString()}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        
        {/* Legend */}
        {showLegend && (
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {colorScale.map((color, index) => {
              const rangeStart = index * 12.5;
              const rangeEnd = rangeStart + 12.5;
              
              return (
                <div key={index} className="flex items-center">
                  <div className="w-3 h-3 mr-1" style={{ backgroundColor: color }}></div>
                  <span className="text-xs text-gray-600">{`${rangeStart}% - ${rangeEnd}%`}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
