import { supabase } from './supabase';
import { Campaign } from '../types';
import { 
  PrescriptionData, 
  PrescriptionGenerationConfig,
  PrescriptionSummary,
  PrescriptionGroupBy,
  PrescriptionTimeframe
} from '../types/prescription';
import { v4 as uuidv4 } from 'uuid';
import { format, subDays, addDays } from 'date-fns';

/**
 * Helper function to get provider region data regardless of which field name is used
 * This handles both provider_region and provider_geographic_area column names
 */
export const getProviderRegion = (data: PrescriptionData): string => {
  // Return provider_region if it exists, otherwise try provider_geographic_area
  // If neither exists, return an empty string to avoid undefined errors
  return data.provider_region || data.provider_geographic_area || '';
};

// Provider specialties for random assignment
const SPECIALTIES = [
  'Primary Care',
  'Cardiology',
  'Neurology',
  'Endocrinology',
  'Psychiatry',
  'Rheumatology',
  'Oncology',
  'Gastroenterology'
];

// Geographic regions for random assignment
const REGIONS = [
  'Northeast',
  'Southeast',
  'Midwest',
  'West',
  'Southwest',
  'Northwest'
];

/**
 * Check if prescription data already exists for this campaign
 * to avoid duplicate generation
 */
export const checkPrescriptionDataExists = async (campaignId: string): Promise<boolean> => {
  try {
    const { count, error } = await supabase
      .from('prescriptions')
      .select('id', { count: 'exact', head: true })
      .eq('campaign_id', campaignId);
    
    if (error) {
      console.error('Error checking prescriptions:', error);
      return false;
    }
    
    return count !== null && count > 0;
  } catch (error) {
    console.error('Exception checking prescriptions:', error);
    return false;
  }
};

/**
 * Generate random baseline prescription count within a realistic range
 */
const generateBaselineCount = (isHighVolume: boolean = false): number => {
  const min = isHighVolume ? 20 : 5;
  const max = isHighVolume ? 100 : 40;
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Calculate date ranges for baseline and current periods
 * Baseline period: 30 days before campaign start
 * Current period: From campaign start to now (or end date if campaign is completed)
 */
const calculatePeriods = (campaign: Campaign): { baseline: string, current: string } => {
  const now = new Date();
  
  // Default to now if no start date is provided
  const startDate = campaign.start_date ? new Date(campaign.start_date) : now;
  
  // Use end date if provided and campaign is completed, otherwise use current date
  let endDate = now;
  if (campaign.end_date && campaign.status === 'completed') {
    endDate = new Date(campaign.end_date);
  }
  
  // Baseline period: 30 days before campaign start
  const baselineStart = subDays(startDate, 30);
  const baselineEnd = subDays(startDate, 1);
  
  // Format dates as ISO strings
  const baselinePeriod = `${format(baselineStart, 'yyyy-MM-dd')}_${format(baselineEnd, 'yyyy-MM-dd')}`;
  const currentPeriod = `${format(startDate, 'yyyy-MM-dd')}_${format(endDate, 'yyyy-MM-dd')}`;
  
  return {
    baseline: baselinePeriod,
    current: currentPeriod
  };
};

/**
 * Generate prescription data for a campaign
 * This simulates what would happen when a campaign becomes active
 */
export const generatePrescriptionData = async (config: PrescriptionGenerationConfig): Promise<PrescriptionData[]> => {
  const { 
    campaign,
    targetMedicationId,
    targetMedicationName,
    competitorMedicationIds,
    competitorMedicationNames,
    medicationCategory,
    providerCount,
    targetLiftPercentage,
    competitorDeclinePercentage
  } = config;
  
  // Check if data already exists for this campaign
  const exists = await checkPrescriptionDataExists(campaign.id);
  if (exists) {
    console.log(`Prescription data already exists for campaign ${campaign.id}`);
    return [];
  }
  
  // Calculate time periods
  const periods = calculatePeriods(campaign);
  
  // Array to store generated prescription data
  const prescriptionData: PrescriptionData[] = [];
  
  // Generate data for each provider
  for (let i = 0; i < providerCount; i++) {
    // Randomly assign provider specialty and region
    const specialty = SPECIALTIES[Math.floor(Math.random() * SPECIALTIES.length)];
    const region = REGIONS[Math.floor(Math.random() * REGIONS.length)];
    const providerId = `provider-${uuidv4().slice(0, 8)}`;
    
    // Whether this provider is a high-volume prescriber
    const isHighVolume = Math.random() > 0.7;
    
    // Generate data for target medication
    const targetBaselineCount = generateBaselineCount(isHighVolume);
    // Apply lift with some random variation
    const targetLiftMultiplier = 1 + (targetLiftPercentage / 100) * (0.8 + Math.random() * 0.4);
    const targetCurrentCount = Math.round(targetBaselineCount * targetLiftMultiplier);
    
    // Generate target medication prescription data
    prescriptionData.push({
      id: uuidv4(),
      campaign_id: campaign.id,
      medication_id: targetMedicationId,
      medication_name: targetMedicationName,
      medication_category: medicationCategory,
      is_target: true,
      is_competitor: false,
      provider_id: providerId,
      provider_specialty: specialty,
      provider_region: region,
      baseline_count: targetBaselineCount,
      current_count: targetCurrentCount,
      change_count: targetCurrentCount - targetBaselineCount,
      change_percentage: ((targetCurrentCount - targetBaselineCount) / targetBaselineCount) * 100,
      baseline_period: periods.baseline,
      current_period: periods.current,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    // Generate data for competitor medications (1-3 per provider based on provider)
    const competitorCount = Math.floor(Math.random() * 3) + 1;
    for (let j = 0; j < competitorCount && j < competitorMedicationIds.length; j++) {
      const competitorId = competitorMedicationIds[j];
      const competitorName = competitorMedicationNames[j];
      const competitorBaselineCount = generateBaselineCount(isHighVolume);
      
      // Apply decline with some random variation
      const declineMultiplier = 1 - (competitorDeclinePercentage / 100) * (0.7 + Math.random() * 0.6);
      const competitorCurrentCount = Math.round(competitorBaselineCount * declineMultiplier);
      
      // Generate competitor medication prescription data
      prescriptionData.push({
        id: uuidv4(),
        campaign_id: campaign.id,
        medication_id: competitorId,
        medication_name: competitorName,
        medication_category: medicationCategory,
        is_target: false,
        is_competitor: true,
        provider_id: providerId,
        provider_specialty: specialty,
        provider_region: region,
        baseline_count: competitorBaselineCount,
        current_count: competitorCurrentCount,
        change_count: competitorCurrentCount - competitorBaselineCount,
        change_percentage: ((competitorCurrentCount - competitorBaselineCount) / competitorBaselineCount) * 100,
        baseline_period: periods.baseline,
        current_period: periods.current,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
  }
  
  return prescriptionData;
};

/**
 * Save prescription data to the database
 */
export const savePrescriptionData = async (data: PrescriptionData[]): Promise<{ success: boolean; error?: any }> => {
  if (!data || data.length === 0) {
    return { success: true };
  }
  
  try {
    // Save in batches of 100 to avoid hitting Supabase limits
    const batchSize = 100;
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      
      const { error } = await supabase
        .from('prescriptions')
        .insert(batch);
      
      if (error) {
        console.error('Error saving prescription data:', error);
        return { success: false, error };
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Exception saving prescription data:', error);
    return { success: false, error };
  }
};

/**
 * Retrieve prescription data for a campaign with optional timeframe filtering
 */
export const fetchPrescriptionData = async (
  campaignId: string, 
  timeframe?: PrescriptionTimeframe
): Promise<{ data: PrescriptionData[] | null; error: any }> => {
  try {
    // Basic query to get prescription data for this campaign
    let query = supabase
      .from('prescriptions')
      .select('*')
      .eq('campaign_id', campaignId);
    
    // If timeframe is provided, apply additional time-based filtering
    if (timeframe) {
      const campaign = await getCampaignDetails(campaignId);
      if (!campaign || !campaign.start_date) {
        return { 
          data: null, 
          error: new Error('Campaign start date not available, unable to apply timeframe filter') 
        };
      }
      
      // Calculate the date ranges based on the campaign start date and timeframe
      const campaignStartDate = new Date(campaign.start_date);
      const beforeStartDate = new Date(campaignStartDate);
      beforeStartDate.setDate(beforeStartDate.getDate() - timeframe.daysBefore);
      
      const afterEndDate = new Date(campaignStartDate);
      afterEndDate.setDate(afterEndDate.getDate() + timeframe.daysAfter);
      
      // Format dates for the query
      const formattedBeforeDate = beforeStartDate.toISOString().split('T')[0];
      const formattedAfterDate = afterEndDate.toISOString().split('T')[0];
      
      // We'll need to create a more sophisticated query here in a real implementation
      // This is a simplified version to demonstrate the concept
      console.log(`Applying timeframe filter: ${timeframe.daysBefore} days before to ${timeframe.daysAfter} days after`);
      console.log(`Date range: ${formattedBeforeDate} to ${formattedAfterDate}`);
      
      // For demonstration, we're not actually filtering here
      // In a real implementation, we would need to parse the baseline_period and current_period
      // fields and filter based on those dates
    }
    
    // Execute the query
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching prescription data:', error);
      return { data: null, error };
    }
    
    // Process the data to handle the column name differences
    if (data) {
      // If provider_region is missing and provider_geographic_area exists, map values
      const processedData = data.map(item => {
        const record = item as any; // Use any to allow property access
        
        // Handle case where geographic_area exists but region doesn't
        if (record.provider_geographic_area !== undefined && record.provider_region === undefined) {
          record.provider_region = record.provider_geographic_area;
        }
        
        // Handle case where region exists but geographic_area doesn't
        if (record.provider_region !== undefined && record.provider_geographic_area === undefined) {
          record.provider_geographic_area = record.provider_region;
        }
        
        return record as PrescriptionData;
      });
      
      return { data: processedData, error: null };
    }
    
    return { data: data as PrescriptionData[], error: null };
  } catch (error) {
    console.error('Exception fetching prescription data:', error);
    return { data: null, error };
  }
};

/**
 * Helper function to get campaign details
 */
const getCampaignDetails = async (campaignId: string): Promise<Campaign | null> => {
  try {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();
    
    if (error || !data) {
      console.error('Error fetching campaign details:', error);
      return null;
    }
    
    return data as Campaign;
  } catch (error) {
    console.error('Exception fetching campaign details:', error);
    return null;
  }
};

/**
 * Group prescription data by a specific field
 */
export const groupPrescriptionData = (
  data: PrescriptionData[],
  groupBy: PrescriptionGroupBy
): PrescriptionSummary[] => {
  if (!data || data.length === 0) {
    return [];
  }
  
  // Group data by the specified field
  const groups: { [key: string]: PrescriptionData[] } = {};
  
  data.forEach(record => {
    let groupKey = '';
    let groupName = '';
    
    switch (groupBy) {
      case 'medication':
        groupKey = record.medication_id;
        groupName = record.medication_name;
        break;
      case 'provider_specialty':
        groupKey = record.provider_specialty;
        groupName = record.provider_specialty;
        break;
      case 'provider_region':
      case 'provider_geographic_area':
        // Use our helper function to get the correct region value regardless of which field is used
        const regionValue = getProviderRegion(record);
        groupKey = regionValue;
        groupName = regionValue;
        break;
      case 'medication_category':
        groupKey = record.medication_category;
        groupName = record.medication_category;
        break;
    }
    
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    
    groups[groupKey].push(record);
  });
  
  // Calculate summary for each group
  const summaries: PrescriptionSummary[] = [];
  
  Object.entries(groups).forEach(([groupKey, records]) => {
    const baselineTotal = records.reduce((sum, record) => sum + record.baseline_count, 0);
    const currentTotal = records.reduce((sum, record) => sum + record.current_count, 0);
    const changeCount = currentTotal - baselineTotal;
    const changePercentage = baselineTotal > 0 
      ? (changeCount / baselineTotal) * 100 
      : 0;
    
    // Determine group name based on the grouping field
    let displayName = '';
    if (groupBy === 'medication') {
      displayName = records[0].medication_name;
    } else if (groupBy === 'provider_region' || groupBy === 'provider_geographic_area') {
      displayName = getProviderRegion(records[0]);
    } else {
      displayName = records[0][groupBy] as string;
    }
    
    summaries.push({
      group_key: groupKey,
      group_name: displayName,
      baseline_total: baselineTotal,
      current_total: currentTotal,
      change_count: changeCount,
      change_percentage: parseFloat(changePercentage.toFixed(2)),
      records_count: records.length
    });
  });
  
  // Sort by absolute change (largest first)
  return summaries.sort((a, b) => Math.abs(b.change_count) - Math.abs(a.change_count));
};

/**
 * Generate and save prescription data when a campaign becomes active
 */
export const generateCampaignPrescriptionData = async (campaign: Campaign): Promise<boolean> => {
  // Only generate data for campaigns that are active or completed
  if (campaign.status !== 'active' && campaign.status !== 'completed') {
    return false;
  }
  
  // Check if data already exists
  const exists = await checkPrescriptionDataExists(campaign.id);
  if (exists) {
    console.log(`Prescription data already exists for campaign ${campaign.id}`);
    return true; // Data already exists, no need to generate
  }
  
  try {
    // Check for script lift configuration
    let targetLiftPercentage = 15; // Default expected 15% lift
    let competitorDeclinePercentage = 8; // Default expected 8% decline
    let targetMedicationName = 'Target Medication';
    let medicationCategory = campaign.targeting_metadata?.medicationCategory || 'General';
    
    try {
      // Import dynamically to avoid circular dependencies
      const { getScriptLiftConfig } = await import('./scriptLiftConfigStore');
      const scriptLiftConfig = getScriptLiftConfig(campaign.id);
      
      if (scriptLiftConfig) {
        console.log(`Using script lift configuration for campaign ${campaign.id}`);
        
        // Get target medication from config
        const targetMed = scriptLiftConfig.medications.find(m => m.isTargeted);
        if (targetMed) {
          targetLiftPercentage = targetMed.liftPercentage;
          targetMedicationName = targetMed.name;
        }
        
        // Get average competitor decline percentage
        const competitorMeds = scriptLiftConfig.medications.filter(m => !m.isTargeted);
        if (competitorMeds.length > 0) {
          const avgDecline = competitorMeds.reduce((sum, med) => {
            // Only count negative lift percentages
            return sum + (med.liftPercentage < 0 ? Math.abs(med.liftPercentage) : 0);
          }, 0) / competitorMeds.length;
          
          if (avgDecline > 0) {
            competitorDeclinePercentage = avgDecline;
          }
        }
      } else {
        console.log(`No script lift configuration found for campaign ${campaign.id}, using defaults`);
      }
    } catch (configError) {
      console.warn(`Error getting script lift config: ${configError}. Using default values.`);
    }

    // For demo, use mock competitor medications if we don't have real ones
    const competitorMedications = [
      { id: 'comp-1', name: 'Competitor A' },
      { id: 'comp-2', name: 'Competitor B' },
      { id: 'comp-3', name: 'Competitor C' }
    ];
    
    // Configuration for prescription data generation
    const config: PrescriptionGenerationConfig = {
      campaign,
      targetMedicationId: campaign.target_medication_id || 'default-med',
      targetMedicationName,
      competitorMedicationIds: competitorMedications.map(m => m.id),
      competitorMedicationNames: competitorMedications.map(m => m.name),
      medicationCategory,
      providerCount: 50, // Generate data for 50 providers
      targetLiftPercentage,
      competitorDeclinePercentage
    };
    
    // Generate prescription data
    const prescriptionData = await generatePrescriptionData(config);
    
    // Save to database
    const { success, error } = await savePrescriptionData(prescriptionData);
    
    if (!success) {
      console.error('Failed to save prescription data:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Exception generating prescription data:', error);
    return false;
  }
};
