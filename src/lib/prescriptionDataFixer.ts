import { Campaign } from '../types';
import { supabase } from './supabase';
import { checkPrescriptionDataExists, generateCampaignPrescriptionData, getProviderRegion } from './prescriptionDataGenerator';
import { diagnoseAllCampaignsScriptLift } from './scriptLiftDiagnostics';

/**
 * A utility to ensure all campaigns have prescription data for script lift calculations
 */

/**
 * Generate missing prescription data for all campaigns
 * This is useful when fixing data issues or after adding script lift functionality
 */
export const generateMissingPrescriptionData = async (): Promise<{
  success: boolean;
  generatedCount: number;
  campaignsWithExistingData: number;
  campaignsWithErrors: number;
  errors: any[];
}> => {
  console.log('Generating missing prescription data for all campaigns...');
  
  // First run diagnostics to see what's missing
  const diagnostics = await diagnoseAllCampaignsScriptLift();
  
  if (!diagnostics.success) {
    console.error('Failed to diagnose campaign script lift data:', diagnostics.error);
    return {
      success: false,
      generatedCount: 0,
      campaignsWithExistingData: 0,
      campaignsWithErrors: 0,
      errors: [diagnostics.error]
    };
  }
  
  if (diagnostics.campaigns.length === 0) {
    console.log('No campaigns found to generate data for');
    return {
      success: true,
      generatedCount: 0,
      campaignsWithExistingData: 0,
      campaignsWithErrors: 0,
      errors: []
    };
  }
  
  // Get all campaigns without prescription data
  const campaignsNeedingData = diagnostics.campaigns.filter(c => !c.hasPrescriptionData);
  const campaignsWithData = diagnostics.campaigns.filter(c => c.hasPrescriptionData);
  
  console.log(`Found ${campaignsNeedingData.length} campaigns needing prescription data generation`);
  console.log(`Found ${campaignsWithData.length} campaigns with existing prescription data`);
  
  // Fetch full campaign details for campaigns needing data generation
  const campaignIds = campaignsNeedingData.map(c => c.campaignId);
  
  if (campaignIds.length === 0) {
    console.log('All campaigns already have prescription data');
    return {
      success: true,
      generatedCount: 0,
      campaignsWithExistingData: campaignsWithData.length,
      campaignsWithErrors: 0,
      errors: []
    };
  }
  
  const { data: campaigns, error } = await supabase
    .from('campaigns')
    .select('*')
    .in('id', campaignIds);
  
  if (error) {
    console.error('Error fetching campaigns:', error);
    return {
      success: false,
      generatedCount: 0,
      campaignsWithExistingData: campaignsWithData.length,
      campaignsWithErrors: campaignIds.length,
      errors: [error]
    };
  }
  
  // Generate data for each campaign
  let generatedCount = 0;
  const errors: any[] = [];
  
  for (const campaign of campaigns) {
    try {
      // Double-check that data doesn't exist (to avoid duplicates)
      const exists = await checkPrescriptionDataExists(campaign.id);
      
      if (exists) {
        console.log(`Campaign ${campaign.id} already has prescription data, skipping`);
        continue;
      }
      
      const success = await generateCampaignPrescriptionData(campaign as Campaign);
      
      if (success) {
        console.log(`Generated prescription data for campaign ${campaign.id}`);
        generatedCount++;
      } else {
        console.warn(`Failed to generate prescription data for campaign ${campaign.id}`);
        errors.push({ campaignId: campaign.id, error: 'Generation failed with unknown error' });
      }
    } catch (err) {
      console.error(`Error generating prescription data for campaign ${campaign.id}:`, err);
      errors.push({ campaignId: campaign.id, error: err instanceof Error ? err.message : String(err) });
    }
  }
  
  return {
    success: true,
    generatedCount,
    campaignsWithExistingData: campaignsWithData.length,
    campaignsWithErrors: errors.length,
    errors
  };
};

/**
 * Regenerate prescription data for a specific campaign, even if it already exists
 * This is useful when script lift configuration has been changed and data needs to be updated
 */
export const regeneratePrescriptionData = async (campaignId: string): Promise<boolean> => {
  console.log(`Regenerating prescription data for campaign ${campaignId}`);
  
  try {
    // Fetch the campaign
    const { data: campaign, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();
    
    if (error || !campaign) {
      console.error('Error fetching campaign:', error);
      return false;
    }
    
    // Delete existing prescription data if it exists
    const { error: deleteError } = await supabase
      .from('prescriptions')
      .delete()
      .eq('campaign_id', campaignId);
    
    if (deleteError) {
      console.error('Error deleting existing prescription data:', deleteError);
      return false;
    }
    
    // Generate new prescription data
    const success = await generateCampaignPrescriptionData(campaign as Campaign);
    
    if (success) {
      console.log(`Successfully regenerated prescription data for campaign ${campaignId}`);
      return true;
    } else {
      console.warn(`Failed to regenerate prescription data for campaign ${campaignId}`);
      return false;
    }
  } catch (err) {
    console.error(`Exception regenerating prescription data for campaign ${campaignId}:`, err);
    return false;
  }
};
