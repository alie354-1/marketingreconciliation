import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Sector, Tooltip, Legend } from 'recharts';
import { colors } from '../../theme/colors';
import { cn } from '../../utils/cn';

interface SegmentData {
  id: string;
  name: string;
  value: number;
  percentage: number;
  color?: string;
  regions?: { name: string; count: number }[];
}

interface EnhancedSegmentBreakdownProps {
  segments: SegmentData[];
  totalValue: number;
  title?: string;
  subtitle?: string;
  className?: string;
  height?: number;
  colorScale?: string[];
  showLegend?: boolean;
  allowDrilldown?: boolean;
  onSegmentClick?: (segment: SegmentData) => void;
}

// Active shape for the pie chart when a segment is hovered or selected
const renderActiveShape = (props: any) => {
  const { 
    cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value
  } = props;
  
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 5}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 8}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
      <text x={cx} y={cy - 10} textAnchor="middle" fill="#333" fontSize={14} fontWeight="bold">
        {payload.name}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="#666" fontSize={12}>
        {`${(percent * 100).toFixed(0)}% (${value.toLocaleString()})`}
      </text>
    </g>
  );
};

// Custom tooltip component
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 shadow-lg rounded-lg border border-gray-100">
        <div className="font-medium text-gray-900">{data.name}</div>
        <div className="flex justify-between mt-1">
          <span className="text-gray-600">Value:</span>
          <span className="font-medium">{data.value.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Percentage:</span>
          <span className="font-medium">{data.percentage}%</span>
        </div>
      </div>
    );
  }
  return null;
};

export const EnhancedSegmentBreakdown: React.FC<EnhancedSegmentBreakdownProps> = ({
  segments,
  totalValue,
  title,
  subtitle,
  className,
  height = 300,
  colorScale = colors.chart,
  showLegend = true,
  allowDrilldown = true,
  onSegmentClick,
}) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  
  // Handler for segment hover
  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };
  
  // Handler for segment leave
  const onPieLeave = () => {
    setActiveIndex(null);
  };
  
  // Handler for segment click
  const handleSegmentClick = (data: any, index: number) => {
    if (onSegmentClick && allowDrilldown) {
      onSegmentClick(segments[index]);
    }
  };
  
  // Format segments data with percentages
  const formattedSegments = segments.map(segment => ({
    ...segment,
    percentage: segment.percentage || Math.round((segment.value / totalValue) * 100)
  }));
  
  return (
    <div className={cn("bg-white rounded-lg p-4", className)}>
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <h3 className="text-lg font-semibold text-gray-800">{title}</h3>}
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
      )}
      
      <div style={{ height: `${height}px`, position: 'relative' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              activeIndex={activeIndex !== null ? activeIndex : undefined}
              activeShape={renderActiveShape}
              data={formattedSegments}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              onMouseEnter={onPieEnter}
              onMouseLeave={onPieLeave}
              onClick={handleSegmentClick}
              className="cursor-pointer"
            >
              {formattedSegments.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color || colorScale[index % colorScale.length]} 
                  stroke="#fff"
                  strokeWidth={1}
                />
              ))}
            </Pie>
            
            <Tooltip content={<CustomTooltip />} />
            
            {showLegend && <Legend />}
          </PieChart>
        </ResponsiveContainer>
        
        {/* Center text for total count */}
        <div 
          style={{ 
            position: 'absolute', 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            pointerEvents: 'none'
          }}
        >
          <div className="text-2xl font-bold text-gray-800">{totalValue.toLocaleString()}</div>
          <div className="text-xs text-gray-500">Total</div>
        </div>
      </div>
      
      {/* Supplementary metrics or drill-down info could go here */}
      {activeIndex !== null && allowDrilldown && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="text-sm font-medium text-gray-800">
            {formattedSegments[activeIndex].name} Details
          </h4>
          
          {formattedSegments[activeIndex].regions && (
            <div className="mt-2 space-y-2">
              <p className="text-xs text-gray-600">Regional Distribution:</p>
              <div className="space-y-1">
                {formattedSegments[activeIndex].regions.map((region, idx) => (
                  <div key={idx} className="flex justify-between text-xs">
                    <span>{region.name}:</span>
                    <span className="font-medium">{region.count.toLocaleString()} providers</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="mt-3 text-xs text-center text-primary-600">
            {allowDrilldown && "Click for more details"}
          </div>
        </div>
      )}
    </div>
  );
};
