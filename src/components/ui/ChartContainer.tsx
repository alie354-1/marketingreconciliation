import React, { useState, ReactNode } from 'react';
import { cn } from '../../utils/cn';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, Legend, TooltipProps } from 'recharts';
import { Download, Filter, Maximize2, Minimize2 } from 'lucide-react';
import { colors } from '../../theme/colors';

export type ChartType = 'line' | 'bar' | 'area' | 'pie' | 'multi-line' | 'custom';

export interface ChartContainerProps {
  title: string;
  subtitle?: string;
  data: any[];
  type: ChartType;
  height?: number;
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  downloadable?: boolean;
  filters?: ReactNode;
  className?: string;
  children?: ReactNode;
  // For preconfigured charts
  keys?: string[];
  xAxisKey?: string;
  yAxisKeys?: string[];
  labels?: Record<string, string>;
  colors?: string[];
  stacked?: boolean;
  lineType?: 'linear' | 'monotone' | 'step';
  showGrid?: boolean;
  areaOpacity?: number;
  tooltipFormatter?: (value: any, name: any, props: any) => ReactNode;
}

export function ChartContainer({
  title,
  subtitle,
  data = [],
  type = 'line',
  height = 300,
  loading = false,
  error = null,
  emptyMessage = 'No data available',
  downloadable = false,
  filters,
  className,
  children,
  keys,
  xAxisKey = 'name',
  yAxisKeys = [],
  labels = {},
  colors: chartColors = colors.chart,
  stacked = false,
  lineType = 'monotone',
  showGrid = true,
  areaOpacity = 0.2,
  tooltipFormatter,
}: ChartContainerProps) {
  const [expanded, setExpanded] = useState(false);
  
  // Handle download of chart data
  const handleDownload = () => {
    if (data.length === 0) return;
    
    // Convert to CSV format
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(item => Object.values(item).join(',')).join('\n');
    const csv = `${headers}\n${rows}`;
    
    // Create a download link
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, '-')}-data-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Custom tooltip formatter
  const defaultTooltipFormatter = (value: any, name: any) => {
    // Use custom label if provided
    const label = labels[name] || name;
    
    // Format numbers with commas
    if (typeof value === 'number') {
      return [value.toLocaleString(), label];
    }
    
    return [value, label];
  };
  
  // Style the tooltip
  // Custom tooltip component with proper typing
  const CustomTooltip: React.FC<TooltipProps<any, any>> = ({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) return null;
    
    return (
      <div className="bg-white p-3 shadow-lg rounded-lg border border-gray-100">
        <p className="text-gray-600 text-sm font-medium mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center mb-1 last:mb-0">
            <div 
              className="w-3 h-3 rounded-full mr-2" 
              style={{ backgroundColor: entry.color }}
            />
            <p className="text-gray-700 text-sm">
              <span className="font-medium">{labels[entry.name] || entry.name}: </span>
              <span className="text-gray-900">
                {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
              </span>
            </p>
          </div>
        ))}
      </div>
    );
  };
  
  // Render loading state
  if (loading) {
    return (
      <div className={cn("bg-white rounded-lg shadow-sm p-5", className)}>
        <div className="flex justify-between items-center mb-5">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          </div>
        </div>
        <div className="animate-pulse flex flex-col items-center justify-center" style={{ height: `${height}px` }}>
          <div className="w-16 h-16 bg-gray-200 rounded-full mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-24 mb-2.5"></div>
          <div className="h-4 bg-gray-200 rounded w-32"></div>
        </div>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className={cn("bg-white rounded-lg shadow-sm p-5", className)}>
        <div className="flex justify-between items-center mb-5">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          </div>
        </div>
        <div className="flex flex-col items-center justify-center text-center h-full" style={{ height: `${height}px` }}>
          <div className="bg-danger-50 text-danger-700 p-3 rounded-lg mb-3">
            <p>Failed to load chart data</p>
            <p className="text-sm text-danger-600 mt-1">{error}</p>
          </div>
          <button className="text-primary-600 text-sm font-medium hover:text-primary-800">
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  // Render empty state
  if (data.length === 0) {
    return (
      <div className={cn("bg-white rounded-lg shadow-sm p-5", className)}>
        <div className="flex justify-between items-center mb-5">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          </div>
        </div>
        <div className="flex flex-col items-center justify-center text-center" style={{ height: `${height}px` }}>
          <p className="text-gray-500">{emptyMessage}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      className={cn(
        "bg-white rounded-lg shadow-sm p-5 transition-all",
        expanded ? "fixed inset-5 z-50" : "relative",
        className
      )}
    >
      <div className="flex justify-between items-center mb-5">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
        
        <div className="flex items-center space-x-2">
          {filters && (
            <div className="flex items-center">
              <Filter className="h-4 w-4 text-gray-400 mr-1" />
              {filters}
            </div>
          )}
          
          {downloadable && (
            <button 
              className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
              onClick={handleDownload}
              title="Download data"
            >
              <Download className="h-4 w-4 text-gray-500" />
            </button>
          )}
          
          <button 
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
            onClick={() => setExpanded(!expanded)}
            title={expanded ? "Exit fullscreen" : "View fullscreen"}
          >
            {expanded ? (
              <Minimize2 className="h-4 w-4 text-gray-500" />
            ) : (
              <Maximize2 className="h-4 w-4 text-gray-500" />
            )}
          </button>
        </div>
      </div>
      
      <div style={{ height: expanded ? 'calc(100% - 80px)' : `${height}px` }}>
        {children ? (
          <ResponsiveContainer width="100%" height="100%">
            {/* Cast children to ReactElement since we expect it to be a chart component */}
            {children as React.ReactElement}
          </ResponsiveContainer>
        ) : (
          <>
            {type === 'line' && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />}
                  <XAxis 
                    dataKey={xAxisKey} 
                    stroke="#718096" 
                    tick={{ fill: '#718096' }}
                    tickLine={{ stroke: '#E2E8F0' }}
                  />
                  <YAxis 
                    stroke="#718096"
                    tick={{ fill: '#718096' }}
                    tickLine={{ stroke: '#E2E8F0' }}
                  />
                  <Tooltip 
                    content={(props) => <CustomTooltip {...props} />} 
                    formatter={tooltipFormatter || defaultTooltipFormatter} 
                  />
                  <Legend />
                  {yAxisKeys.map((key, index) => (
                    <Line
                      key={key}
                      type={lineType}
                      dataKey={key}
                      name={labels[key] || key}
                      stroke={chartColors[index % chartColors.length]}
                      strokeWidth={2}
                      dot={{ r: 4, strokeWidth: 2 }}
                      activeDot={{ r: 6, strokeWidth: 2 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
            
            {type === 'area' && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />}
                  <XAxis 
                    dataKey={xAxisKey} 
                    stroke="#718096" 
                    tick={{ fill: '#718096' }}
                    tickLine={{ stroke: '#E2E8F0' }}
                  />
                  <YAxis 
                    stroke="#718096"
                    tick={{ fill: '#718096' }}
                    tickLine={{ stroke: '#E2E8F0' }}
                  />
                  <Tooltip 
                    content={(props) => <CustomTooltip {...props} />} 
                    formatter={tooltipFormatter || defaultTooltipFormatter} 
                  />
                  <Legend />
                  {yAxisKeys.map((key, index) => (
                    <Area
                      key={key}
                      type={lineType}
                      dataKey={key}
                      name={labels[key] || key}
                      stroke={chartColors[index % chartColors.length]}
                      fill={chartColors[index % chartColors.length]}
                      fillOpacity={areaOpacity}
                      strokeWidth={2}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            )}
            
            {type === 'bar' && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />}
                  <XAxis 
                    dataKey={xAxisKey} 
                    stroke="#718096" 
                    tick={{ fill: '#718096' }}
                    tickLine={{ stroke: '#E2E8F0' }}
                  />
                  <YAxis 
                    stroke="#718096"
                    tick={{ fill: '#718096' }}
                    tickLine={{ stroke: '#E2E8F0' }}
                  />
                  <Tooltip 
                    content={(props) => <CustomTooltip {...props} />} 
                    formatter={tooltipFormatter || defaultTooltipFormatter} 
                  />
                  <Legend />
                  {yAxisKeys.map((key, index) => (
                    <Bar
                      key={key}
                      dataKey={key}
                      name={labels[key] || key}
                      fill={chartColors[index % chartColors.length]}
                      radius={[4, 4, 0, 0]}
                      stackId={stacked ? 'stack' : undefined}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            )}
            
            {type === 'pie' && (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip 
                    content={(props) => <CustomTooltip {...props} />} 
                    formatter={tooltipFormatter || defaultTooltipFormatter} 
                  />
                  <Legend />
                  <Pie
                    data={data}
                    dataKey={yAxisKeys[0]}
                    nameKey={xAxisKey}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {data.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={chartColors[index % chartColors.length]} 
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            )}
          </>
        )}
      </div>
    </div>
  );
}
