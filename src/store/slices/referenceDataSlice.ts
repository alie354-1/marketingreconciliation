import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { Condition, Medication, GeographicRegion, Specialty } from '../../types';
import { supabase } from '../../lib/supabase';
import { RootState } from '..';

interface ReferenceDataState {
  conditions: Condition[];
  medications: Medication[];
  geographicRegions: GeographicRegion[];
  specialties: Specialty[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ReferenceDataState = {
  conditions: [],
  medications: [],
  geographicRegions: [],
  specialties: [],
  isLoading: false,
  error: null,
};

export const fetchAllReferenceData = createAsyncThunk(
  'referenceData/fetchAllReferenceData',
  async (_, { rejectWithValue }) => {
    try {
      const [conditionsRes, medicationsRes, specialtiesRes, regionsRes] = await Promise.all([
        supabase.from('conditions').select('*'),
        supabase.from('medications').select('*'),
        supabase.from('specialties').select('*'),
        supabase.from('geographic_regions').select('*')
      ]);
    
      // Check for errors
      if (conditionsRes.error) throw conditionsRes.error;
      if (medicationsRes.error) throw medicationsRes.error;
      if (specialtiesRes.error) throw specialtiesRes.error;
      if (regionsRes.error) throw regionsRes.error;

      return {
        conditions: conditionsRes.data as Condition[],
        medications: medicationsRes.data as Medication[],
        specialties: specialtiesRes.data as Specialty[],
        geographicRegions: regionsRes.data as GeographicRegion[],
      };
    } catch (error) {
      return rejectWithValue('Failed to fetch reference data');
    }
  }
);

export const addCondition = createAsyncThunk(
  'referenceData/addCondition',
  async (condition: Partial<Condition>, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('conditions')
        .insert(condition)
        .select()
        .single();

      if (error) {
        return rejectWithValue(error.message);
      }

      return data as Condition;
    } catch (error) {
      return rejectWithValue('Failed to add condition');
    }
  }
);

export const addMedication = createAsyncThunk(
  'referenceData/addMedication',
  async (medication: Partial<Medication>, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('medications')
        .insert(medication)
        .select()
        .single();

      if (error) {
        return rejectWithValue(error.message);
      }

      return data as Medication;
    } catch (error) {
      return rejectWithValue('Failed to add medication');
    }
  }
);

const referenceDataSlice = createSlice({
  name: 'referenceData',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch All Reference Data
      .addCase(fetchAllReferenceData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAllReferenceData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.conditions = action.payload.conditions;
        state.medications = action.payload.medications;
        state.specialties = action.payload.specialties;
        state.geographicRegions = action.payload.geographicRegions;
      })
      .addCase(fetchAllReferenceData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Add Condition
      .addCase(addCondition.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addCondition.fulfilled, (state, action: PayloadAction<Condition>) => {
        state.isLoading = false;
        state.conditions.push(action.payload);
      })
      .addCase(addCondition.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Add Medication
      .addCase(addMedication.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addMedication.fulfilled, (state, action: PayloadAction<Medication>) => {
        state.isLoading = false;
        state.medications.push(action.payload);
      })
      .addCase(addMedication.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = referenceDataSlice.actions;

// Memoized selectors
const selectReferenceDataState = (state: RootState) => state.referenceData;

export const selectConditions = createSelector(
  [selectReferenceDataState],
  (referenceDataState) => referenceDataState.conditions
);

export const selectMedications = createSelector(
  [selectReferenceDataState],
  (referenceDataState) => referenceDataState.medications
);

export const selectSpecialties = createSelector(
  [selectReferenceDataState],
  (referenceDataState) => referenceDataState.specialties
);

export const selectGeographicRegions = createSelector(
  [selectReferenceDataState],
  (referenceDataState) => referenceDataState.geographicRegions
);


export const selectReferenceDataLoading = createSelector(
  [selectReferenceDataState],
  (referenceDataState) => referenceDataState.isLoading
);

export default referenceDataSlice.reducer;
