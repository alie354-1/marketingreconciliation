import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Provider, TargetingCount, FilterState, QueryExpression } from '../../types';
import { buildExpressionFromFilterState } from '../../lib/queryBuilderV2';
import { supabase } from '../../lib/supabase';

interface ProviderState {
  providers: Provider[];
  filteredProviders: Provider[];
  isLoading: boolean;
  error: string | null;
  targetingCounts: TargetingCount | null;
  filterState: FilterState;
}

// Helper to create default query expression
const createDefaultQueryExpression = (): QueryExpression => ({
  type: 'logical',
  operator: 'and',
  expressions: []
});

const initialState: ProviderState = {
  providers: [],
  filteredProviders: [],
  isLoading: false,
  error: null,
  targetingCounts: null,
  filterState: {
    conditions: [],
    medications: [],
    specialties: [],
    geographicAreas: [],
    useAndLogic: false,
    queryExpression: createDefaultQueryExpression()
  },
};

export const fetchProviders = createAsyncThunk(
  'providers/fetchProviders',
  async (_, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('providers')
        .select('*');

      if (error) {
        return rejectWithValue(error.message);
      }

      // Simulate identity matching
      const providersWithIdentity = data.map(provider => ({
        ...provider,
        identity_matched: Math.random() > 0.2, // 80% match rate
        identity_confidence: Math.random() * 100, // Random confidence score 0-100
      }));

      return providersWithIdentity as Provider[];
    } catch (error) {
      return rejectWithValue('Failed to fetch providers');
    }
  }
);

// Extended interface for filtered providers with query expression support
interface FilteredProvidersParams extends FilterState {
  queryExpression?: QueryExpression;
}

export const fetchFilteredProviders = createAsyncThunk(
  'providers/fetchFilteredProviders',
  async (filters: FilteredProvidersParams, { rejectWithValue }) => {
    try {
      console.log('Fetching providers with filters:', filters);
      
      // Start with base query
      let query = supabase
        .from('providers')
        .select('*');

      // Apply filters with appropriate logic (AND or OR)
      // First, check if we have a query expression to use
      if (filters.queryExpression && 
          filters.queryExpression.type === 'logical' && 
          filters.queryExpression.expressions.length > 0) {
        
        // For now, we're still using the simple filters, 
        // but in a real implementation we would convert the query expression to SQL here
        // TODO: Convert queryExpression to SQL for Supabase query
        
        // This is a placeholder for the future implementation
        console.log('Using query expression:', filters.queryExpression);
      }
      
      // For backward compatibility, still support the old filter approach
      const hasFilters = 
        filters.specialties.length > 0 || 
        filters.geographicAreas.length > 0 || 
        filters.conditions.length > 0 || 
        filters.medications.length > 0;
        
      // Add specialty filters if any
      if (filters.specialties.length > 0) {
        query = query.in('specialty', filters.specialties);
      }

      // Add geographic area filters if any
      if (filters.geographicAreas.length > 0) {
        query = query.in('geographic_area', filters.geographicAreas);
      }
      
      // Add condition filters if any
      if (filters.conditions.length > 0) {
        // In a real implementation, this would be a join or subquery
        // For now, we'll just simulate this
        console.log('Filtering by conditions:', filters.conditions);
      }
      
      // Add medication filters if any
      if (filters.medications.length > 0) {
        // In a real implementation, this would be a join or subquery
        // For now, we'll just simulate this
        console.log('Filtering by medications:', filters.medications);
      }

      const { data, error } = await query;

      if (error) {
        return rejectWithValue(error.message);
      }
      
      // If we have no filters, ensure we return some data for demonstration
      if (!hasFilters && (!data || data.length === 0)) {
        // Mock data for empty query
        data.push(
          { id: '1', name: 'Dr. Smith', specialty: 'Cardiology', geographic_area: 'Northeast US' },
          { id: '2', name: 'Dr. Johnson', specialty: 'Primary Care', geographic_area: 'Southeast US' },
          { id: '3', name: 'Dr. Williams', specialty: 'Neurology', geographic_area: 'Midwest US' }
        );
      }

      // Simulate identity matching and counts
      const providersWithIdentity = data.map(provider => ({
        ...provider,
        identity_matched: Math.random() > 0.2, // 80% match rate
        identity_confidence: Math.random() * 100, // Random confidence score
      }));

      // Calculate targeting counts
      const totalCount = providersWithIdentity.length;
      const identityMatched = providersWithIdentity.filter(p => p.identity_matched).length;

      return {
        providers: providersWithIdentity as Provider[],
        counts: {
          total: totalCount,
          filtered: totalCount, // Same as total in this simple example
          identityMatched
        }
      };
    } catch (error) {
      return rejectWithValue('Failed to fetch filtered providers');
    }
  }
);

const providerSlice = createSlice({
  name: 'providers',
  initialState,
  reducers: {
    updateFilterState: (state, action: PayloadAction<Partial<FilterState>>) => {
      state.filterState = { ...state.filterState, ...action.payload };
      
      // If we're updating regular filters, also update the query expression for consistency
      if (action.payload.conditions || action.payload.medications || 
          action.payload.specialties || action.payload.geographicAreas) {
        // Build a query expression from the filter state if possible
        state.filterState.queryExpression = buildExpressionFromFilterState(state.filterState);
      }
    },
    updateQueryExpression: (state, action: PayloadAction<QueryExpression>) => {
      if (state.filterState.queryExpression) {
        state.filterState.queryExpression = action.payload;
      }
    },
    clearFilterState: (state) => {
      state.filterState = initialState.filterState;
      state.filteredProviders = state.providers;
      state.targetingCounts = null;
    },
    toggleAndLogic: (state) => {
      state.filterState.useAndLogic = !state.filterState.useAndLogic;
      
      // Also update the query expression's root operator for consistency
      if (state.filterState.queryExpression && state.filterState.queryExpression.type === 'logical') {
        state.filterState.queryExpression.operator = state.filterState.useAndLogic ? 'and' : 'or';
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Providers
      .addCase(fetchProviders.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProviders.fulfilled, (state, action: PayloadAction<Provider[]>) => {
        state.isLoading = false;
        state.providers = action.payload;
        state.filteredProviders = action.payload;
      })
      .addCase(fetchProviders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch Filtered Providers
      .addCase(fetchFilteredProviders.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFilteredProviders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.filteredProviders = action.payload.providers;
        state.targetingCounts = action.payload.counts;
      })
      .addCase(fetchFilteredProviders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  updateFilterState,
  updateQueryExpression,
  clearFilterState,
  toggleAndLogic,
  clearError,
} = providerSlice.actions;

export default providerSlice.reducer;
