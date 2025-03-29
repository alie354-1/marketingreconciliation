import React, { useState } from 'react';
import { 
  BarChart, 
  PieChart, 
  LineChart, 
  Line, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Pie,
  Cell,
} from 'recharts';
import { 
  Activity, 
  BarChart2,
  PieChart as PieChartIcon,
  Calendar, 
  TrendingUp,
  Users,
  Map,
  Heart,
  PenTool
} from 'lucide-react';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';

// Sample data for analytics
const campaignPerformanceData = [
  { month: 'Jan', impressions: 5000, clicks: 420, conversions: 53 },
  { month: 'Feb', impressions: 6200, clicks: 530, conversions: 61 },
  { month: 'Mar', impressions: 8100, clicks: 650, conversions: 82 },
  { month: 'Apr', impressions: 9500, clicks: 760, conversions: 95 },
  { month: 'May', impressions: 10200, clicks: 820, conversions: 105 },
  { month: 'Jun', impressions: 11800, clicks: 945, conversions: 118 },
];

const specialtyDistributionData = [
  { name: 'Primary Care', value: 45 },
  { name: 'Cardiology', value: 20 },
  { name: 'Neurology', value: 15 },
  { name: 'Psychiatry', value: 10 },
  { name: 'Oncology', value: 10 },
];

const geographicDistributionData = [
  { name: 'Northeast', value: 35 },
  { name: 'Southeast', value: 25 },
  { name: 'Midwest', value: 20 },
  { name: 'West', value: 15 },
  { name: 'Southwest', value: 5 },
];

const prescriptionTrendsData = [
  { month: 'Jan', newPrescriptions: 320, renewals: 580 },
  { month: 'Feb', newPrescriptions: 385, renewals: 620 },
  { month: 'Mar', newPrescriptions: 450, renewals: 670 },
  { month: 'Apr', newPrescriptions: 520, renewals: 710 },
  { month: 'May', newPrescriptions: 590, renewals: 790 },
  { month: 'Jun', newPrescriptions: 640, renewals: 830 },
];

// Colors for pie charts
const COLORS = ['#0D47A1', '#00BCD4', '#FF5722', '#4CAF50', '#9C27B0'];

interface MetricCardProps {
  title: string;
  value: string | number;
  change: string;
  isPositive?: boolean;
  icon: React.ReactNode;
  onClick?: () => void;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, isPositive = true, icon, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "bg-white rounded-lg p-4 shadow-sm transition-shadow hover:shadow-md",
        onClick && "cursor-pointer"
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
        <div className="bg-primary-50 p-2 rounded-lg">
          {icon}
        </div>
      </div>
      <div className="flex items-baseline justify-between">
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        <div className={cn(
          "flex items-center text-sm font-medium",
          isPositive ? "text-green-600" : "text-red-600"
        )}>
          {isPositive ? '+' : '-'}{change}
        </div>
      </div>
    </div>
  );
};

export function AnalyticsDashboard() {
  const [timeframe, setTimeframe] = useState('6m');

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <BarChart2 className="h-6 w-6 text-primary-500 mr-2" />
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
        </div>
        <div className="flex items-center space-x-4">
          <Select
            options={[
              { value: '1m', label: 'Last Month' },
              { value: '3m', label: 'Last 3 Months' },
              { value: '6m', label: 'Last 6 Months' },
              { value: '1y', label: 'Last Year' },
            ]}
            value={timeframe}
            onChange={setTimeframe}
          />
          <Button variant="outline" leftIcon={<Calendar className="h-4 w-4" />}>
            Custom Range
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Impressions"
          value="50.8k"
          change="12.5%"
          isPositive={true}
          icon={<Activity className="h-5 w-5 text-primary-500" />}
        />
        <MetricCard
          title="Click-through Rate"
          value="8.2%"
          change="3.1%"
          isPositive={true}
          icon={<TrendingUp className="h-5 w-5 text-primary-500" />}
        />
        <MetricCard
          title="New Prescriptions"
          value="2,905"
          change="18.3%"
          isPositive={true}
          icon={<Heart className="h-5 w-5 text-primary-500" />}
        />
        <MetricCard
          title="Provider Reach"
          value="12,450"
          change="5.8%"
          isPositive={true}
          icon={<Users className="h-5 w-5 text-primary-500" />}
        />
      </div>

      {/* Campaign Performance Chart */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Campaign Performance</h2>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={campaignPerformanceData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="month" stroke="#718096" />
              <YAxis stroke="#718096" />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="impressions"
                name="Impressions"
                stroke="#0D47A1"
                activeDot={{ r: 8 }}
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="clicks"
                name="Clicks"
                stroke="#00BCD4"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="conversions"
                name="Conversions"
                stroke="#FF5722"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Specialty Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Provider Specialty Distribution</h2>
            <PenTool className="h-5 w-5 text-gray-400" />
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={specialtyDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {specialtyDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Geographic Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Geographic Distribution</h2>
            <Map className="h-5 w-5 text-gray-400" />
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={geographicDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {geographicDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Prescription Trends */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Prescription Trends</h2>
          <Heart className="h-5 w-5 text-gray-400" />
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={prescriptionTrendsData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="month" stroke="#718096" />
              <YAxis stroke="#718096" />
              <Tooltip />
              <Legend />
              <Bar dataKey="newPrescriptions" name="New Prescriptions" fill="#0D47A1" />
              <Bar dataKey="renewals" name="Prescription Renewals" fill="#00BCD4" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
