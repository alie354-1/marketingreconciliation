import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { Campaign, CampaignResult } from '../../types';
import { supabase } from '../../lib/supabase';
import { RootState } from '..';
import { 
  updateCampaignStatus, 
  updateCampaignStatuses,
  updateCampaignStatusesWithSideEffects 
} from '../../lib/campaignUtils';
import { handleCampaignSave } from '../../lib/campaignPrescriptionManager';

interface CampaignState {
  campaigns: Campaign[];
  currentCampaign: Campaign | null;
  campaignResults: CampaignResult[];
  isLoading: boolean;
  error: string | null;
  filters: {
    status: string[];
    specialties: string[];
    geographicAreas: string[];
  };
}

const initialState: CampaignState = {
  campaigns: [],
  currentCampaign: null,
  campaignResults: [],
  isLoading: false,
  error: null,
  filters: {
    status: [],
    specialties: [],
    geographicAreas: [],
  },
};

export const fetchCampaigns = createAsyncThunk(
  'campaigns/fetchCampaigns',
  async (_, { rejectWithValue, getState }) => {
    try {
      // Get the current user from the auth state
      const state = getState() as RootState;
      const currentUser = state.auth.user;
      
      if (!currentUser) {
        return rejectWithValue('User not authenticated');
      }
      
      let query = supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });
      
      // If user is not an admin, only show their campaigns
      if (currentUser.role !== 'admin') {
        query = query.eq('created_by', currentUser.id);
      }
      
      const { data, error } = await query;

      if (error) {
        return rejectWithValue(error.message);
      }

      return data as Campaign[];
    } catch (error) {
      return rejectWithValue('Failed to fetch campaigns');
    }
  }
);

export const fetchCampaignById = createAsyncThunk(
  'campaigns/fetchCampaignById',
  async (id: string, { rejectWithValue, getState }) => {
    try {
      // Get the current user from the auth state
      const state = getState() as RootState;
      const currentUser = state.auth.user;
      
      if (!currentUser) {
        return rejectWithValue('User not authenticated');
      }
      
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return rejectWithValue(error.message);
      }
      
      // Verify the user has permission to access this campaign
      const campaign = data as Campaign;
      if (currentUser.role !== 'admin' && campaign.created_by !== currentUser.id) {
        return rejectWithValue('You do not have permission to view this campaign');
      }

      return campaign;
    } catch (error) {
      return rejectWithValue('Failed to fetch campaign');
    }
  }
);

export const fetchCampaignResults = createAsyncThunk(
  'campaigns/fetchCampaignResults',
  async (campaignId: string, { rejectWithValue, getState }) => {
    try {
      // Get the current user from the auth state
      const state = getState() as RootState;
      const currentUser = state.auth.user;
      
      if (!currentUser) {
        return rejectWithValue('User not authenticated');
      }
      
      // First, verify the user has permission to access this campaign
      if (currentUser.role !== 'admin') {
        const { data: campaignData, error: campaignError } = await supabase
          .from('campaigns')
          .select('created_by')
          .eq('id', campaignId)
          .single();
          
        if (campaignError) {
          return rejectWithValue(campaignError.message);
        }
        
        if (campaignData.created_by !== currentUser.id) {
          return rejectWithValue('You do not have permission to view results for this campaign');
        }
      }
      
      // Now fetch the campaign results
      const { data, error } = await supabase
        .from('campaign_results')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('report_date', { ascending: false });

      if (error) {
        return rejectWithValue(error.message);
      }

      return data as CampaignResult[];
    } catch (error) {
      return rejectWithValue('Failed to fetch campaign results');
    }
  }
);

export const createCampaign = createAsyncThunk(
  'campaigns/createCampaign',
  async (campaign: Partial<Campaign>, { rejectWithValue }) => {
    try {
      // Make sure start_date and end_date are present
      if (!campaign.start_date || !campaign.end_date) {
        return rejectWithValue('Start date and end date are required');
      }
      
      const { data, error } = await supabase
        .from('campaigns')
        .insert(campaign)
        .select()
        .single();

      if (error) {
        return rejectWithValue(error.message);
      }
      
      // Generate prescription data for the new campaign
      const savedCampaign = data as Campaign;
      
      // Only generate data for active or completed campaigns
      if (savedCampaign.status === 'active' || savedCampaign.status === 'completed') {
        try {
          await handleCampaignSave(savedCampaign);
        } catch (err) {
          console.error('Error generating prescription data:', err);
          // Continue even if prescription data generation fails
        }
      }

      return savedCampaign;
    } catch (error) {
      return rejectWithValue('Failed to create campaign');
    }
  }
);

export const updateCampaign = createAsyncThunk(
  'campaigns/updateCampaign',
  async ({ id, updates }: { id: string; updates: Partial<Campaign> }, { rejectWithValue, getState }) => {
    try {
      // Get the current user from the auth state
      const state = getState() as RootState;
      const currentUser = state.auth.user;
      
      if (!currentUser) {
        return rejectWithValue('User not authenticated');
      }
      
      // If dates are being updated, make sure they are provided
      if ((updates.start_date !== undefined && !updates.start_date) || 
          (updates.end_date !== undefined && !updates.end_date)) {
        return rejectWithValue('Start date and end date are required');
      }
      
      // First get the existing campaign
      const { data: existingData, error: fetchError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', id)
        .single();
        
      if (fetchError) {
        return rejectWithValue(fetchError.message);
      }
      
      const existingCampaign = existingData as Campaign;
      
      // Verify the user has permission to update this campaign
      if (currentUser.role !== 'admin' && existingCampaign.created_by !== currentUser.id) {
        return rejectWithValue('You do not have permission to update this campaign');
      }
      
      // Update the campaign
      const { data, error } = await supabase
        .from('campaigns')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return rejectWithValue(error.message);
      }
      
      const updatedCampaign = data as Campaign;
      
      // Generate prescription data if:
      // 1. The status has changed from non-active to active
      // 2. The campaign is active and dates have changed
      if (
        (existingCampaign.status !== 'active' && updatedCampaign.status === 'active') ||
        (updatedCampaign.status === 'active' && 
         (updates.start_date !== undefined || updates.end_date !== undefined))
      ) {
        try {
          await handleCampaignSave(updatedCampaign);
        } catch (err) {
          console.error('Error generating prescription data on update:', err);
          // Continue even if prescription data generation fails
        }
      }

      return updatedCampaign;
    } catch (error) {
      return rejectWithValue('Failed to update campaign');
    }
  }
);

export const deleteCampaign = createAsyncThunk(
  'campaigns/deleteCampaign',
  async (id: string, { rejectWithValue, getState }) => {
    try {
      // Get the current user from the auth state
      const state = getState() as RootState;
      const currentUser = state.auth.user;
      
      if (!currentUser) {
        return rejectWithValue('User not authenticated');
      }
      
      // First check if the user has permission to delete this campaign
      if (currentUser.role !== 'admin') {
        const { data: campaignData, error: campaignError } = await supabase
          .from('campaigns')
          .select('created_by')
          .eq('id', id)
          .single();
          
        if (campaignError) {
          return rejectWithValue(campaignError.message);
        }
        
        if (campaignData.created_by !== currentUser.id) {
          return rejectWithValue('You do not have permission to delete this campaign');
        }
      }
      
      // Now perform the delete operation
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', id);

      if (error) {
        return rejectWithValue(error.message);
      }

      return id;
    } catch (error) {
      return rejectWithValue('Failed to delete campaign');
    }
  }
);

const campaignSlice = createSlice({
  name: 'campaigns',
  initialState,
  reducers: {
    clearCurrentCampaign: (state) => {
      state.currentCampaign = null;
    },
    setCampaignFilters: (state, action: PayloadAction<Partial<CampaignState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearCampaignFilters: (state) => {
      state.filters = initialState.filters;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Campaigns
      .addCase(fetchCampaigns.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCampaigns.fulfilled, (state, action: PayloadAction<Campaign[]>) => {
        state.isLoading = false;
        // Update campaign statuses based on date ranges (synchronous)
        const updatedCampaigns = updateCampaignStatuses(action.payload);
        state.campaigns = updatedCampaigns;
        
        // Store a copy of the campaigns array outside the Redux state
        const campaignsCopy = [...updatedCampaigns];
        
        // Schedule async side effects outside the reducer using the copied array
        setTimeout(() => {
          updateCampaignStatusesWithSideEffects(campaignsCopy)
            .catch(err => console.error('Error in side effects:', err));
        }, 0);
      })
      .addCase(fetchCampaigns.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch Campaign By Id
      .addCase(fetchCampaignById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCampaignById.fulfilled, (state, action: PayloadAction<Campaign>) => {
        state.isLoading = false;
        // Update campaign status based on date range
        state.currentCampaign = updateCampaignStatus(action.payload);
      })
      .addCase(fetchCampaignById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch Campaign Results
      .addCase(fetchCampaignResults.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCampaignResults.fulfilled, (state, action: PayloadAction<CampaignResult[]>) => {
        state.isLoading = false;
        state.campaignResults = action.payload;
      })
      .addCase(fetchCampaignResults.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create Campaign
      .addCase(createCampaign.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createCampaign.fulfilled, (state, action: PayloadAction<Campaign>) => {
        state.isLoading = false;
        state.campaigns.unshift(action.payload);
        state.currentCampaign = action.payload;
      })
      .addCase(createCampaign.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update Campaign
      .addCase(updateCampaign.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateCampaign.fulfilled, (state, action: PayloadAction<Campaign>) => {
        state.isLoading = false;
        state.campaigns = state.campaigns.map(campaign => 
          campaign.id === action.payload.id ? action.payload : campaign
        );
        if (state.currentCampaign?.id === action.payload.id) {
          state.currentCampaign = action.payload;
        }
      })
      .addCase(updateCampaign.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Delete Campaign
      .addCase(deleteCampaign.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteCampaign.fulfilled, (state, action: PayloadAction<string>) => {
        state.isLoading = false;
        state.campaigns = state.campaigns.filter(campaign => campaign.id !== action.payload);
        if (state.currentCampaign?.id === action.payload) {
          state.currentCampaign = null;
        }
      })
      .addCase(deleteCampaign.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearCurrentCampaign,
  setCampaignFilters,
  clearCampaignFilters,
  clearError,
} = campaignSlice.actions;

// Memoized selectors
const selectCampaignsState = (state: RootState) => state.campaigns;

export const selectAllCampaigns = createSelector(
  [selectCampaignsState],
  (campaignsState) => campaignsState.campaigns
);

export const selectCampaignsLoading = createSelector(
  [selectCampaignsState],
  (campaignsState) => campaignsState.isLoading
);

export const selectCampaignsError = createSelector(
  [selectCampaignsState],
  (campaignsState) => campaignsState.error
);

export const selectCurrentCampaign = createSelector(
  [selectCampaignsState],
  (campaignsState) => campaignsState.currentCampaign
);

export const selectCampaignResults = createSelector(
  [selectCampaignsState],
  (campaignsState) => campaignsState.campaignResults
);

export const selectCampaignsWithLoadingState = createSelector(
  [selectAllCampaigns, selectCampaignsLoading],
  (campaigns, isLoading) => ({ campaigns, isLoading })
);

export default campaignSlice.reducer;
