import { supabase } from './supabase';
import { getAllScriptLiftConfigs, getScriptLiftConfig } from './scriptLiftConfigStore';
import { checkPrescriptionDataExists } from './prescriptionDataGenerator';

/**
 * Utility to diagnose script lift data issues
 * This is a non-invasive diagnostic tool that doesn't modify any data
 */

/**
 * Check if a campaign has all necessary script lift data components
 * @param campaignId The ID of the campaign to check
 * @returns A diagnostic report object
 */
export const diagnoseCampaignScriptLift = async (campaignId: string) => {
  console.log(`Diagnosing script lift data for campaign: ${campaignId}`);
  
  const report = {
    campaignId,
    hasScriptLiftConfig: false,
    hasPrescriptionData: false,
    configDetails: null as any,
    errorDetails: null as string | null,
  };
  
  try {
    // Check if script lift configuration exists
    const config = getScriptLiftConfig(campaignId);
    report.hasScriptLiftConfig = !!config;
    
    if (config) {
      report.configDetails = {
        lastModified: config.lastModified,
        medicationsCount: config.medications?.length || 0,
        hasTargetMedication: !!config.medications?.some(m => m.isTargeted),
      };
    }
    
    // Check if prescription data exists
    const hasPrescriptionData = await checkPrescriptionDataExists(campaignId);
    report.hasPrescriptionData = hasPrescriptionData;
    
    console.log(`Diagnostic report for campaign ${campaignId}:`, report);
    return report;
  } catch (error) {
    console.error(`Error diagnosing script lift for campaign ${campaignId}:`, error);
    report.errorDetails = error instanceof Error ? error.message : 'Unknown error';
    return report;
  }
};

/**
 * Check all campaigns for script lift data
 * @returns An array of diagnostic reports for all campaigns
 */
export const diagnoseAllCampaignsScriptLift = async () => {
  console.log('Diagnosing script lift data for all campaigns...');
  
  try {
    // Get all campaigns
    const { data: campaigns, error } = await supabase
      .from('campaigns')
      .select('id, name, status');
    
    if (error) {
      console.error('Error fetching campaigns:', error);
      return { 
        success: false, 
        error: error.message,
        campaigns: [] 
      };
    }
    
    if (!campaigns || campaigns.length === 0) {
      console.log('No campaigns found');
      return { 
        success: true, 
        campaigns: [] 
      };
    }
    
    // Get all existing script lift configurations
    const allConfigs = getAllScriptLiftConfigs();
    const configIds = Object.keys(allConfigs.configs || {});
    
    console.log(`Found ${campaigns.length} campaigns and ${configIds.length} script lift configurations`);
    
    // Check each campaign
    const diagnosticReports = [];
    
    for (const campaign of campaigns) {
      const report = await diagnoseCampaignScriptLift(campaign.id);
      diagnosticReports.push({
        ...report,
        campaignName: campaign.name,
        campaignStatus: campaign.status
      });
    }
    
    // Summary stats
    const withConfig = diagnosticReports.filter(r => r.hasScriptLiftConfig).length;
    const withPrescriptionData = diagnosticReports.filter(r => r.hasPrescriptionData).length;
    const withBoth = diagnosticReports.filter(r => r.hasScriptLiftConfig && r.hasPrescriptionData).length;
    const withNeither = diagnosticReports.filter(r => !r.hasScriptLiftConfig && !r.hasPrescriptionData).length;
    
    console.log(`Diagnostic summary for ${diagnosticReports.length} campaigns:`);
    console.log(`- With script lift config: ${withConfig}`);
    console.log(`- With prescription data: ${withPrescriptionData}`);
    console.log(`- With both config and data: ${withBoth}`);
    console.log(`- With neither config nor data: ${withNeither}`);
    
    return {
      success: true,
      campaigns: diagnosticReports,
      summary: {
        totalCampaigns: diagnosticReports.length,
        withConfig,
        withPrescriptionData,
        withBoth,
        withNeither
      }
    };
  } catch (error) {
    console.error('Error diagnosing all campaigns:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      campaigns: []
    };
  }
};
