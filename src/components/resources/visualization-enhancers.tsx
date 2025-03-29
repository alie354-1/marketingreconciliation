import React from 'react';
import { RegionalHeatMap } from '../visualizations/RegionalHeatMap';
import { EnhancedSegmentBreakdown } from '../visualizations/EnhancedSegmentBreakdown';
import { AudienceComparisonView, AudienceConfig } from '../visualizations/AudienceComparisonView';

// Interface for segment data
interface ProviderSegment {
  id: string;
  specialty: string;
  name: string;
  count: number;
  value: number;
  percentage: number;
  color: string;
  regions: { name: string; count: number }[];
}

// Interface for region data
interface RegionData {
  id: string;
  name: string;
  providerCount: number;
  percentage?: number;
}

// Enhanced provider segments visualization
export const renderEnhancedSegments = (segments: ProviderSegment[], totalProviders: number) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800">
        Provider Specialty Breakdown
      </h3>
      
      <EnhancedSegmentBreakdown
        segments={segments}
        totalValue={totalProviders}
        title="Provider Segments"
        subtitle={`${totalProviders.toLocaleString()} total providers by specialty`}
        height={400}
        showLegend={true}
        allowDrilldown={true}
      />
    </div>
  );
};

// Enhanced geographic visualization
export const renderRegionalHeatMap = (regionData: RegionData[], totalProviders: number) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800">
        Geographic Distribution
      </h3>
      
      <RegionalHeatMap
        regions={regionData}
        totalProviders={totalProviders}
        title="Provider Density Map"
        subtitle="Provider density by region"
        showLegend={true}
      />
    </div>
  );
};

// Conversion functions for audience comparison
export const convertToAudienceConfig = (
  audience: {
    id?: string;
    name: string;
    filters: any;
    providerCount: number;
    potentialReach: number;
    dateCreated?: string;
    segments: ProviderSegment[];
    regionData: RegionData[];
  }
): AudienceConfig => {
  return {
    id: audience.id || `audience-${Date.now()}`,
    name: audience.name,
    filters: audience.filters,
    providerCount: audience.providerCount,
    potentialReach: audience.potentialReach,
    segments: audience.segments,
    regionData: audience.regionData,
    dateCreated: audience.dateCreated || new Date().toISOString()
  };
};

// Function to render comparison view
export const renderAudienceComparison = (
  primaryAudience: AudienceConfig,
  secondaryAudience: AudienceConfig,
  onBack: () => void,
  onPushToCampaign: (audience: AudienceConfig) => void,
  onSaveAudience: (audience: AudienceConfig) => void
) => {
  return (
    <AudienceComparisonView
      primaryAudience={primaryAudience}
      secondaryAudience={secondaryAudience}
      onBack={onBack}
      onPushToCampaign={onPushToCampaign}
      onSaveAudience={onSaveAudience}
    />
  );
};
