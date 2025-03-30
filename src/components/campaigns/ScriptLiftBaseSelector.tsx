import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Save, Plus, CheckCircle, Database } from 'lucide-react';
import { getScriptLiftConfig, saveScriptLiftConfig, generateDefaultScriptLiftConfig } from '../../lib/scriptLiftConfigStore';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { fetchAllReferenceData } from '../../store/slices/referenceDataSlice';
import { ScriptLiftConfig } from '../../types/scriptLift';
import { regeneratePrescriptionData } from '../../lib/prescriptionDataFixer';

interface ScriptLiftBaseSelectorProps {
  campaignId: string;
  campaignName?: string;
}

export const ScriptLiftBaseSelector: React.FC<ScriptLiftBaseSelectorProps> = ({ 
  campaignId, 
  campaignName = 'Campaign' 
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasExistingConfig, setHasExistingConfig] = useState(false);
  
  const medications = useAppSelector(state => {
    const refData = state.referenceData as { medications: any[] };
    return refData.medications || [];
  });
  
  const campaign = useAppSelector(state => 
    state.campaigns.campaigns.find(c => c.id === campaignId)
  );
  
  const dispatch = useAppDispatch();
  
  // Check for existing configuration on mount
  useEffect(() => {
    if (campaignId) {
      const config = getScriptLiftConfig(campaignId);
      setHasExistingConfig(!!config);
    }
    
    // Load reference data if needed
    if (medications.length === 0) {
      dispatch(fetchAllReferenceData());
    }
  }, [campaignId, dispatch, medications.length]);
  
  // Save current prescription data as a new base
  const saveNewBase = async () => {
    setIsSaving(true);
    setError(null);
    
    try {
      // Get existing configuration or create a new one
      let config = getScriptLiftConfig(campaignId);
      
      if (!config && campaign && medications.length > 0) {
        // Create a new default configuration, preserving any existing preferences
        config = generateDefaultScriptLiftConfig(
          campaignId,
          campaignName || campaign.name || 'Unnamed Campaign',
          medications,
          campaign.target_medication_id,
          campaign.targeting_metadata?.medicationCategory,
          [], // No specialties needed
          []  // No regions needed
        );
      }
      
      if (config) {
        // Update timestamp and save
        const updatedConfig: ScriptLiftConfig = {
          ...config,
          lastModified: new Date().toISOString(),
          notes: config.notes || `Base saved on ${new Date().toLocaleString()}`
        };
        
        // Save the configuration
        saveScriptLiftConfig(updatedConfig);
        setHasExistingConfig(true);
        
        // Regenerate prescription data based on this new configuration
        try {
          console.log(`Regenerating prescription data for campaign ${campaignId}...`);
          await regeneratePrescriptionData(campaignId);
          console.log(`Prescription data regenerated for campaign ${campaignId}`);
          
          // Force page refresh - in a real app we'd use context or redux instead
          window.location.reload();
        } catch (dataError) {
          console.error('Error regenerating prescription data:', dataError);
          // Don't fail the entire operation if this part fails
        }
        
        setSaved(true);
        
        // Reset saved message after 3 seconds
        setTimeout(() => {
          setSaved(false);
        }, 3000);
      } else {
        setError('Could not create configuration. Please try again later.');
      }
    } catch (err) {
      console.error('Error saving script lift base:', err);
      setError('Failed to save script lift base.');
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="mt-4 mb-2">
      <div className="flex items-center justify-between p-3 bg-white border rounded-lg">
        <div className="flex items-center">
          <Database className="h-5 w-5 text-primary-500 mr-2" />
          <div>
            <h4 className="font-medium text-gray-900">Prescription Base Data</h4>
            <p className="text-sm text-gray-500">
              {hasExistingConfig 
                ? 'Base prescription data is available for comparison' 
                : 'Save current data as a baseline for lift calculations'}
            </p>
          </div>
        </div>
        
        <div>
          <Button
            variant={hasExistingConfig ? "outline" : "default"}
            onClick={saveNewBase}
            disabled={isSaving}
            size="sm"
          >
            {isSaving ? (
              <div className="flex items-center">
                <div className="animate-spin h-4 w-4 mr-1.5 border-2 border-white border-t-transparent rounded-full"></div>
                Saving...
              </div>
            ) : saved ? (
              <div className="flex items-center text-green-600">
                <CheckCircle className="h-4 w-4 mr-1.5" />
                Saved
              </div>
            ) : (
              <div className="flex items-center">
                {hasExistingConfig ? <Save className="h-4 w-4 mr-1.5" /> : <Plus className="h-4 w-4 mr-1.5" />}
                {hasExistingConfig ? 'Update Base' : 'Save Base'}
              </div>
            )}
          </Button>
        </div>
      </div>
      
      {error && (
        <div className="mt-2 text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  );
};
