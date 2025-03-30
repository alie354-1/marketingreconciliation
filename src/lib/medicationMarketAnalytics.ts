import { PrescriptionData } from '../types/prescription';
import { 
  MedicationMarketMetrics, 
  RegionalMarketMetrics, 
  MarketMetricsSummary,
  MedicationComparisonParams 
} from '../types/medicationComparison';
import { getProviderRegion } from './prescriptionDataGenerator';

/**
 * Calculate market share as a percentage
 */
export function calculateMarketShare(medicationCount: number, totalCount: number): number {
  if (totalCount === 0) return 0;
  return (medicationCount / totalCount) * 100;
}

/**
 * Calculate the Herfindahl-Hirschman Index (HHI) for market concentration
 * HHI is the sum of squares of market shares of all competitors
 * Higher values indicate more concentration (less competition)
 */
export function calculateMarketConcentration(marketShares: number[]): number {
  return marketShares.reduce((sum, share) => sum + Math.pow(share, 2), 0);
}

/**
 * Group prescription data by region and medication
 */
export function groupPrescriptionsByRegionAndMedication(
  data: PrescriptionData[]
): Map<string, Map<string, PrescriptionData[]>> {
  const regionMedicationMap = new Map<string, Map<string, PrescriptionData[]>>();
  
  data.forEach(prescription => {
    const region = getProviderRegion(prescription);
    
    if (!regionMedicationMap.has(region)) {
      regionMedicationMap.set(region, new Map<string, PrescriptionData[]>());
    }
    
    const medicationMap = regionMedicationMap.get(region)!;
    const medicationId = prescription.medication_id;
    
    if (!medicationMap.has(medicationId)) {
      medicationMap.set(medicationId, []);
    }
    
    medicationMap.get(medicationId)!.push(prescription);
  });
  
  return regionMedicationMap;
}

/**
 * Create medication market metrics for a set of prescriptions
 */
export function calculateMedicationMarketMetrics(
  allPrescriptions: PrescriptionData[],
  targetMedicationId: string,
  competitorMedicationIds: string[] = []
): MedicationMarketMetrics[] {
  // Group prescriptions by medication
  const byMedication = new Map<string, PrescriptionData[]>();
  
  allPrescriptions.forEach(prescription => {
    const medId = prescription.medication_id;
    if (!byMedication.has(medId)) {
      byMedication.set(medId, []);
    }
    byMedication.get(medId)!.push(prescription);
  });
  
  // Calculate total prescriptions (current and baseline)
  const totalCurrent = allPrescriptions.reduce((sum, p) => sum + p.current_count, 0);
  const totalBaseline = allPrescriptions.reduce((sum, p) => sum + p.baseline_count, 0);
  
  // Calculate metrics for each medication
  const results: MedicationMarketMetrics[] = [];
  
  // Track market shares for ranking
  const marketShares: { id: string; share: number }[] = [];
  
  byMedication.forEach((prescriptions, medicationId) => {
    // Skip if this is not the target or a competitor (unless we're not filtering)
    const isTarget = medicationId === targetMedicationId;
    const isCompetitor = competitorMedicationIds.includes(medicationId);
    
    if (targetMedicationId && competitorMedicationIds.length > 0 && !isTarget && !isCompetitor) {
      return;
    }
    
    // Sum prescription counts
    const currentCount = prescriptions.reduce((sum, p) => sum + p.current_count, 0);
    const baselineCount = prescriptions.reduce((sum, p) => sum + p.baseline_count, 0);
    
    // Calculate market shares
    const currentShare = calculateMarketShare(currentCount, totalCurrent);
    const baselineShare = calculateMarketShare(baselineCount, totalBaseline);
    
    // Calculate script lift
    const scriptLift = baselineCount > 0
      ? ((currentCount - baselineCount) / baselineCount) * 100
      : 0;
    
    // Store for ranking later
    marketShares.push({ id: medicationId, share: currentShare });
    
    // Create metrics object
    results.push({
      medicationId,
      medicationName: prescriptions[0].medication_name,
      isTarget,
      isCompetitor,
      
      marketShare: currentShare,
      marketShareBefore: baselineShare,
      marketShareChange: currentShare - baselineShare,
      competitiveIndex: 0, // Will be calculated after all metrics are collected
      marketRank: 0, // Will be calculated after sorting
      
      prescriptionCount: currentCount,
      baselinePrescriptionCount: baselineCount,
      
      scriptLift
    });
  });
  
  // Sort by market share to determine rank
  marketShares.sort((a, b) => b.share - a.share);
  
  // Calculate average competitor share for competitive index
  const competitorShares = results
    .filter(m => m.isCompetitor)
    .map(m => m.marketShare);
  
  const avgCompetitorShare = competitorShares.length > 0
    ? competitorShares.reduce((sum, share) => sum + share, 0) / competitorShares.length
    : 0;
  
  // Update competitive index and rank
  results.forEach(metric => {
    // Competitive index is the ratio of this medication's share to the average competitor share
    metric.competitiveIndex = avgCompetitorShare > 0
      ? metric.marketShare / avgCompetitorShare
      : 0;
    
    // Find rank
    const rankIndex = marketShares.findIndex(m => m.id === metric.medicationId);
    metric.marketRank = rankIndex + 1; // 1-based rank
  });
  
  return results;
}

/**
 * Calculate regional market metrics
 */
export function calculateRegionalMarketMetrics(
  allPrescriptions: PrescriptionData[],
  targetMedicationId: string,
  competitorMedicationIds: string[] = []
): RegionalMarketMetrics[] {
  // Group by region and medication
  const regionMedicationMap = groupPrescriptionsByRegionAndMedication(allPrescriptions);
  const results: RegionalMarketMetrics[] = [];
  
  // Process each region
  regionMedicationMap.forEach((medicationMap, region) => {
    // Skip empty region names
    if (!region) return;
    
    // Calculate total prescriptions in this region
    let totalCurrentCount = 0;
    let totalBaselineCount = 0;
    
    // Target medication metrics
    let targetCurrentCount = 0;
    let targetBaselineCount = 0;
    
    // Competitor metrics
    let totalCompetitorCurrentCount = 0;
    let totalCompetitorBaselineCount = 0;
    
    // Collect competitor shares
    const competitorShares = new Map<string, number>();
    
    // Process each medication in this region
    medicationMap.forEach((prescriptions, medicationId) => {
      const currentCount = prescriptions.reduce((sum, p) => sum + p.current_count, 0);
      const baselineCount = prescriptions.reduce((sum, p) => sum + p.baseline_count, 0);
      
      // Add to region totals
      totalCurrentCount += currentCount;
      totalBaselineCount += baselineCount;
      
      // If this is the target medication
      if (medicationId === targetMedicationId) {
        targetCurrentCount = currentCount;
        targetBaselineCount = baselineCount;
      }
      
      // If this is a competitor
      if (competitorMedicationIds.includes(medicationId)) {
        totalCompetitorCurrentCount += currentCount;
        totalCompetitorBaselineCount += baselineCount;
        
        // Store individual competitor share
        if (totalCurrentCount > 0) {
          competitorShares.set(medicationId, (currentCount / totalCurrentCount) * 100);
        }
      }
    });
    
    // Calculate market shares
    const targetShare = calculateMarketShare(targetCurrentCount, totalCurrentCount);
    const targetShareBefore = calculateMarketShare(targetBaselineCount, totalBaselineCount);
    const targetShareChange = targetShare - targetShareBefore;
    
    // Calculate average competitor share
    const avgCompetitorShare = competitorShares.size > 0
      ? Array.from(competitorShares.values()).reduce((sum, share) => sum + share, 0) / competitorShares.size
      : 0;
    
    // Calculate target rank in this region
    const allMedicationShares = Array.from(medicationMap.entries()).map(([id, prescriptions]) => {
      const count = prescriptions.reduce((sum, p) => sum + p.current_count, 0);
      return { id, share: calculateMarketShare(count, totalCurrentCount) };
    });
    
    allMedicationShares.sort((a, b) => b.share - a.share);
    const targetRank = allMedicationShares.findIndex(m => m.id === targetMedicationId) + 1;
    
    // Calculate growth
    const shareGrowth = targetShareBefore > 0
      ? (targetShare - targetShareBefore) / targetShareBefore * 100
      : 0;
    
    // Calculate opportunity score (higher when target share is below average but growing)
    const opportunity = targetShare < avgCompetitorShare && shareGrowth > 0
      ? (avgCompetitorShare - targetShare) * shareGrowth / 100
      : 0;
    
    results.push({
      region,
      regionName: region, // Use region code as name for now
      
      targetShare,
      targetShareChange,
      
      competitorShares,
      averageCompetitorShare: avgCompetitorShare,
      
      targetRank,
      shareGrowth,
      opportunity,
      
      totalPrescriptions: totalCurrentCount,
      targetPrescriptions: targetCurrentCount,
      competitorPrescriptions: totalCompetitorCurrentCount
    });
  });
  
  // Sort by opportunity (highest first)
  return results.sort((a, b) => b.opportunity - a.opportunity);
}

/**
 * Generate a market metrics summary
 */
export function generateMarketMetricsSummary(
  allPrescriptions: PrescriptionData[],
  targetMedicationId: string,
  competitorMedicationIds: string[] = []
): MarketMetricsSummary {
  // Calculate medication metrics
  const medicationMetrics = calculateMedicationMarketMetrics(
    allPrescriptions,
    targetMedicationId,
    competitorMedicationIds
  );
  
  // Calculate regional metrics
  const regionMetrics = calculateRegionalMarketMetrics(
    allPrescriptions,
    targetMedicationId,
    competitorMedicationIds
  );
  
  // Find target medication data
  const targetMetric = medicationMetrics.find(m => m.isTarget);
  
  if (!targetMetric) {
    throw new Error('Target medication not found in prescription data');
  }
  
  // Find competitor metrics
  const competitorMetrics = medicationMetrics.filter(m => m.isCompetitor);
  
  // Calculate market concentration (HHI)
  const allShares = medicationMetrics.map(m => m.marketShare);
  const marketConcentration = calculateMarketConcentration(allShares);
  
  // Find regions where target is leading
  const leadingRegions = regionMetrics
    .filter(r => r.targetRank === 1)
    .map(r => r.region);
  
  // Find regions where target is weakest
  const weakestRegions = regionMetrics
    .filter(r => r.targetShare < r.averageCompetitorShare)
    .sort((a, b) => a.targetShare - b.targetShare)
    .map(r => r.region)
    .slice(0, 3); // Top 3 weakest
  
  // Find fastest growing regions
  const growingRegions = regionMetrics
    .filter(r => r.shareGrowth > 0)
    .sort((a, b) => b.shareGrowth - a.shareGrowth)
    .map(r => r.region)
    .slice(0, 3); // Top 3 growing
  
  return {
    targetId: targetMetric.medicationId,
    targetName: targetMetric.medicationName,
    targetOverallShare: targetMetric.marketShare,
    targetShareChange: targetMetric.marketShareChange,
    
    competitors: competitorMetrics.map(m => ({
      id: m.medicationId,
      name: m.medicationName,
      share: m.marketShare,
      shareChange: m.marketShareChange
    })),
    
    regionMetrics,
    
    marketConcentration,
    targetLeadingRegions: leadingRegions,
    targetWeakestRegions: weakestRegions,
    fastestGrowingRegions: growingRegions
  };
}

/**
 * Analyze prescription data with market share metrics based on provided parameters
 */
export async function analyzePrescriptionData(
  prescriptions: PrescriptionData[],
  params: MedicationComparisonParams
): Promise<{
  medicationMetrics: MedicationMarketMetrics[];
  regionalMetrics: RegionalMarketMetrics[];
  summary: MarketMetricsSummary;
}> {
  const { targetMedicationId, competitorMedicationIds = [], regions = [] } = params;
  
  // Validate we have a target medication
  if (!targetMedicationId) {
    throw new Error('Target medication ID is required for market share analysis');
  }
  
  // Filter prescriptions by region if needed
  let filteredPrescriptions = prescriptions;
  if (regions.length > 0) {
    filteredPrescriptions = prescriptions.filter(p => {
      const region = getProviderRegion(p);
      return regions.includes(region);
    });
  }
  
  // Calculate medication metrics
  const medicationMetrics = calculateMedicationMarketMetrics(
    filteredPrescriptions,
    targetMedicationId,
    competitorMedicationIds
  );
  
  // Calculate regional metrics
  const regionalMetrics = calculateRegionalMarketMetrics(
    filteredPrescriptions,
    targetMedicationId,
    competitorMedicationIds
  );
  
  // Generate summary
  const summary = generateMarketMetricsSummary(
    filteredPrescriptions,
    targetMedicationId,
    competitorMedicationIds
  );
  
  return {
    medicationMetrics,
    regionalMetrics,
    summary
  };
}
