import { 
  CampaignResult, 
  Campaign, 
  BasicMetrics, 
  EngagementMetrics, 
  DemographicMetrics, 
  ROIMetrics, 
  PrescriptionMetrics 
} from '../types';

/**
 * Campaign Results Generator
 * 
 * This utility generates realistic campaign results data based on 
 * campaign parameters. It creates deterministic but realistic metrics
 * that reflect the campaign's targeting and parameters.
 */

// Helper function to generate a deterministic random number in a range based on a seed
function deterministicRandom(seed: string, min: number, max: number): number {
  // Create a simple hash of the seed string
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  
  // Use the hash to generate a value between 0 and 1
  const normalizedHash = Math.abs(hash) / 2147483647;
  
  // Scale to the requested range
  return min + normalizedHash * (max - min);
}

/**
 * Generates basic campaign metrics: impressions, clicks, conversions
 */
export function generateBasicMetrics(campaign: Campaign): BasicMetrics {
  // Use campaign properties to generate deterministic but realistic metrics
  const seedBase = `${campaign.id}-${campaign.name}-${campaign.created_at}`;
  
  // Calculate base impressions (5000-20000)
  // Factors: targeting specificity (more specific = fewer but higher quality impressions)
  const specificityFactor = campaign.targeting_logic === 'and' ? 0.6 : 1.0;
  const baseImpressions = Math.round(deterministicRandom(`${seedBase}-impressions`, 5000, 20000) * specificityFactor);
  
  // Higher CTR as requested: 8-15%
  // More specific targeting = higher CTR
  const ctrPercent = deterministicRandom(
    `${seedBase}-ctr`, 
    campaign.targeting_logic === 'and' ? 10 : 8, 
    campaign.targeting_logic === 'and' ? 15 : 12
  );
  
  // Calculate clicks based on impressions and CTR
  const clicks = Math.round(baseImpressions * (ctrPercent / 100));
  
  // Conversion rate: 5-12% of clicks
  const conversionRate = deterministicRandom(`${seedBase}-conv`, 5, 12);
  const conversions = Math.round(clicks * (conversionRate / 100));
  
  return {
    impressions: baseImpressions,
    clicks,
    conversions
  };
}

/**
 * Generates engagement metrics for the campaign
 */
export function generateEngagementMetrics(campaign: Campaign, basicMetrics: BasicMetrics): EngagementMetrics {
  const seedBase = `${campaign.id}-${campaign.name}-engage`;
  
  // Calculate average time on page (40-120 seconds)
  // More specific targeting = more engaged audience
  const avgTimeOnPage = Math.round(
    deterministicRandom(`${seedBase}-time`, 40, 120) * 
    (campaign.targeting_logic === 'and' ? 1.2 : 1.0)
  );
  
  // Bounce rate (20-45%)
  // More specific targeting = lower bounce rate
  const bounceRate = Math.round(
    deterministicRandom(`${seedBase}-bounce`, 20, 45) * 
    (campaign.targeting_logic === 'and' ? 0.8 : 1.0)
  );
  
  // Return visits (5-15% of total impressions)
  const returnVisitRate = deterministicRandom(`${seedBase}-return`, 5, 15);
  const returnVisits = Math.round(basicMetrics.impressions * (returnVisitRate / 100));
  
  // Resource downloads (15-30% of conversions)
  const downloadRate = deterministicRandom(`${seedBase}-download`, 15, 30);
  const resourceDownloads = Math.round(basicMetrics.conversions * (downloadRate / 100));
  
  return {
    avg_time_on_page: avgTimeOnPage,
    bounce_rate: bounceRate,
    return_visits: returnVisits,
    resource_downloads: resourceDownloads
  };
}

/**
 * Generates demographic metrics for campaign results
 */
export function generateDemographicMetrics(campaign: Campaign): DemographicMetrics {
  const seedBase = `${campaign.id}-demo`;
  
  // Generate age group distribution
  // This is a simplified model that distributes 100% across age groups
  // Could be enhanced to reflect specialty-specific demographics
  const ageGroups: Record<string, number> = {
    "25-34": Math.round(deterministicRandom(`${seedBase}-age1`, 10, 20)),
    "35-44": Math.round(deterministicRandom(`${seedBase}-age2`, 15, 30)),
    "45-54": Math.round(deterministicRandom(`${seedBase}-age3`, 20, 35)),
    "55-64": Math.round(deterministicRandom(`${seedBase}-age4`, 15, 25)),
    "65+": 0, // Will be calculated to make sum 100%
  };
  
  // Ensure total equals 100%
  const currentSum = Object.values(ageGroups).reduce((sum, val) => sum + val, 0);
  ageGroups["65+"] = 100 - currentSum;
  
  // For gender, we'll keep it simple with binary for now
  // This could be expanded to be more inclusive
  const malePercent = Math.round(deterministicRandom(`${seedBase}-gender`, 40, 70));
  const genders: Record<string, number> = {
    "Male": malePercent,
    "Female": 100 - malePercent,
  };
  
  return {
    age_groups: ageGroups,
    genders: genders
  };
}

/**
 * Generates ROI metrics for the campaign
 */
export function generateROIMetrics(campaign: Campaign, basicMetrics: BasicMetrics): ROIMetrics {
  const seedBase = `${campaign.id}-roi`;
  
  // Base campaign cost ($5,000 - $25,000)
  const totalCampaignCost = Math.round(deterministicRandom(`${seedBase}-cost`, 5000, 25000));
  
  // Cost per click is derived from total cost and clicks
  const costPerClick = parseFloat((totalCampaignCost / basicMetrics.clicks).toFixed(2));
  
  // Cost per impression
  const costPerImpression = parseFloat((totalCampaignCost / basicMetrics.impressions).toFixed(2));
  
  // Cost per conversion
  const costPerConversion = parseFloat((totalCampaignCost / basicMetrics.conversions).toFixed(2));
  
  // ROI percentage (100-220%)
  // More targeted campaigns have better ROI
  const roiPercent = Math.round(
    deterministicRandom(`${seedBase}-roi`, 100, 220) * 
    (campaign.targeting_logic === 'and' ? 1.2 : 1.0)
  );
  
  // Revenue impact is derived from cost and ROI
  const revenueImpact = Math.round(totalCampaignCost * (roiPercent / 100));
  
  // Lifetime value impact (3-5x the immediate revenue)
  const lifetimeMultiplier = deterministicRandom(`${seedBase}-lifetime`, 3, 5);
  const lifetimeValueImpact = Math.round(revenueImpact * lifetimeMultiplier);
  
  return {
    total_campaign_cost: totalCampaignCost,
    roi_percentage: roiPercent,
    estimated_revenue_impact: revenueImpact,
    cost_per_click: costPerClick,
    cost_per_conversion: costPerConversion,
    cost_per_impression: costPerImpression,
    lifetime_value_impact: lifetimeValueImpact
  };
}

/**
 * Generates prescription metrics for the campaign
 * Will be based on the targeted medications and their categories
 */
export function generatePrescriptionMetrics(campaign: Campaign): PrescriptionMetrics {
  const seedBase = `${campaign.id}-rx`;
  
  // New prescriptions (50-150)
  const newPrescriptions = Math.round(deterministicRandom(`${seedBase}-new`, 50, 150));
  
  // Renewals (100-300)
  const renewals = Math.round(deterministicRandom(`${seedBase}-renew`, 100, 300));
  
  // Market share change (1-5%)
  const marketShareChange = parseFloat(deterministicRandom(`${seedBase}-share`, 1, 5).toFixed(1));
  
  // Patient adherence rate (55-85%)
  const adherenceRate = Math.round(deterministicRandom(`${seedBase}-adherence`, 55, 85));
  
  // Total prescription change (8-25%)
  // More specific targeting = better results
  const totalRxChange = parseFloat(
    deterministicRandom(
      `${seedBase}-total`, 
      8, 
      25
    ).toFixed(1)
  );
  
  // Prescription by region - distribute 100% across regions
  const regionDistribution: Record<string, number> = {
    "Northeast": Math.round(deterministicRandom(`${seedBase}-region1`, 15, 35)),
    "Southeast": Math.round(deterministicRandom(`${seedBase}-region2`, 15, 30)),
    "Midwest": Math.round(deterministicRandom(`${seedBase}-region3`, 10, 25)),
    "Southwest": Math.round(deterministicRandom(`${seedBase}-region4`, 5, 20)),
    "West": 0 // Will make the sum 100%
  };
  
  // Ensure region total equals 100%
  const regionSum = Object.values(regionDistribution).reduce((sum, val) => sum + val, 0);
  regionDistribution["West"] = 100 - regionSum;
  
  // Prescription by specialty - distribute 100% across specialties
  const specialtyDistribution: Record<string, number> = {
    "Primary Care": Math.round(deterministicRandom(`${seedBase}-spec1`, 30, 50)),
    "Cardiology": Math.round(deterministicRandom(`${seedBase}-spec2`, 10, 25)),
    "Neurology": Math.round(deterministicRandom(`${seedBase}-spec3`, 5, 15)),
    "Endocrinology": Math.round(deterministicRandom(`${seedBase}-spec4`, 10, 20)),
    "Other": 0 // Will make the sum 100%
  };
  
  // Ensure specialty total equals 100%
  const specialtySum = Object.values(specialtyDistribution).reduce((sum, val) => sum + val, 0);
  specialtyDistribution["Other"] = 100 - specialtySum;
  
  return {
    new_prescriptions: newPrescriptions,
    prescription_renewals: renewals,
    market_share_change: marketShareChange,
    patient_adherence_rate: adherenceRate,
    total_prescription_change: totalRxChange,
    prescription_by_region: regionDistribution,
    prescription_by_specialty: specialtyDistribution
  };
}

/**
 * Main function that generates a complete set of campaign results
 */
export function generateCampaignResults(campaign: Campaign): CampaignResult {
  // Generate basic metrics first
  const basicMetrics = generateBasicMetrics(campaign);
  
  // Use basic metrics to generate related metrics
  const engagementMetrics = generateEngagementMetrics(campaign, basicMetrics);
  const demographicMetrics = generateDemographicMetrics(campaign);
  const roiMetrics = generateROIMetrics(campaign, basicMetrics);
  const prescriptionMetrics = generatePrescriptionMetrics(campaign);
  
  // Create and return the complete result object
  return {
    id: `result-${campaign.id}`,
    campaign_id: campaign.id,
    metrics: basicMetrics,
    engagement_metrics: engagementMetrics,
    demographic_metrics: demographicMetrics,
    roi_metrics: roiMetrics,
    prescription_metrics: prescriptionMetrics,
    report_date: new Date().toISOString(),
    created_at: new Date().toISOString()
  };
}
