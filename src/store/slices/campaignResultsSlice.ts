import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../lib/supabase';
import { Campaign, CampaignResult, Medication, ScriptLiftAnalysis } from '../../types';
import { generateCampaignResults } from '../../lib/campaignResultsGenerator';
import { generateCampaignScriptLiftData } from '../../lib/scriptLiftGenerator';

interface CampaignResultsState {
  isGenerating: boolean;
  error: string | null;
  scriptLiftData: Record<string, ScriptLiftAnalysis[]>;
}

const initialState: CampaignResultsState = {
  isGenerating: false,
  error: null,
  scriptLiftData: {}
};

/**
 * Generate and store campaign results
 * This is kept as a separate operation from campaign creation
 * to maintain focused database operations
 */
export const generateAndStoreResults = createAsyncThunk(
  'campaignResults/generateAndStore',
  async ({ campaign, medications }: { campaign: Campaign, medications: Medication[] }, { rejectWithValue }) => {
    try {
      console.log('Generating results for campaign:', campaign.id);
      
      // Generate basic campaign results
      const results = generateCampaignResults(campaign);
      
      // Generate script lift data
      const scriptLiftData = generateCampaignScriptLiftData(medications, campaign);
      
      // Store basic results in database
      const { data, error } = await supabase
        .from('campaign_results')
        .insert({
          campaign_id: campaign.id,
          metrics: results.metrics,
          engagement_metrics: results.engagement_metrics,
          demographic_metrics: results.demographic_metrics,
          roi_metrics: results.roi_metrics,
          prescription_metrics: results.prescription_metrics,
          report_date: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error storing campaign results:', error);
        return rejectWithValue(error.message);
      }
      
      // Success! Return both the stored results and the script lift data
      return {
        results: data as CampaignResult,
        scriptLiftData
      };
    } catch (error) {
      console.error('Error in generateAndStoreResults:', error);
      return rejectWithValue('Failed to generate and store campaign results');
    }
  }
);

/**
 * Store script lift data for a specific medication
 * This is a separate focused operation
 */
export const storeScriptLiftData = createAsyncThunk(
  'campaignResults/storeScriptLift',
  async ({ 
    campaignId, 
    medicationId, 
    scriptLiftData 
  }: { 
    campaignId: string, 
    medicationId: string, 
    scriptLiftData: ScriptLiftAnalysis 
  }, { rejectWithValue }) => {
    try {
      const { error } = await supabase
        .from('script_lift_data')
        .insert({
          campaign_id: campaignId,
          medication_id: medicationId,
          baseline: scriptLiftData.baseline,
          projected: scriptLiftData.projected,
          lift_percentage: scriptLiftData.liftPercentage,
          confidence_score: scriptLiftData.confidenceScore,
          time_period: scriptLiftData.timePeriod,
          comparison_data: scriptLiftData.comparisonData
        });
      
      if (error) {
        console.error('Error storing script lift data:', error);
        return rejectWithValue(error.message);
      }
      
      return { medicationId, scriptLiftData };
    } catch (error) {
      console.error('Error in storeScriptLiftData:', error);
      return rejectWithValue('Failed to store script lift data');
    }
  }
);

const campaignResultsSlice = createSlice({
  name: 'campaignResults',
  initialState,
  reducers: {
    clearScriptLiftData: (state) => {
      state.scriptLiftData = {};
    }
  },
  extraReducers: (builder) => {
    builder
      // Generate and store results
      .addCase(generateAndStoreResults.pending, (state) => {
        state.isGenerating = true;
        state.error = null;
      })
      .addCase(generateAndStoreResults.fulfilled, (state, action) => {
        state.isGenerating = false;
        state.scriptLiftData = action.payload.scriptLiftData;
      })
      .addCase(generateAndStoreResults.rejected, (state, action) => {
        state.isGenerating = false;
        state.error = action.payload as string;
      })
      // Store script lift data
      .addCase(storeScriptLiftData.fulfilled, (state, action) => {
        // Optional: update local state if needed
      })
      .addCase(storeScriptLiftData.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { clearScriptLiftData } = campaignResultsSlice.actions;

export default campaignResultsSlice.reducer;
