import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { fetchCampaignById } from '../../store/slices/campaignSlice';
import { fetchAllReferenceData } from '../../store/slices/referenceDataSlice';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { MultiSelect } from '../ui/MultiSelect';
import { 
  Pill, 
  TrendingUp, 
  Save,
  RefreshCw,
  ChevronRight,
  Info
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { 
  ScriptLiftConfig,
  MedicationLiftConfig
} from '../../types/scriptLift';
import { 
  getScriptLiftConfig, 
  saveScriptLiftConfig, 
  generateDefaultScriptLiftConfig 
} from '../../lib/scriptLiftConfigStore';

interface ScriptLiftConfiguratorProps {
  isModal?: boolean;
  campaignId?: string;
  onClose?: () => void;
  onSave?: (config: ScriptLiftConfig) => void;
}

export const ScriptLiftConfigurator: React.FC<ScriptLiftConfiguratorProps> = ({
  isModal = false,
  campaignId: propCampaignId,
  onClose,
  onSave
}) => {
  const { id: paramCampaignId } = useParams<{ id: string }>();
  const actualCampaignId = propCampaignId || paramCampaignId || '';
  
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  // UI state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState<boolean>(false);
  
  // Configuration state
  const [config, setConfig] = useState<ScriptLiftConfig | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [targetMedicationId, setTargetMedicationId] = useState<string>('');
  const [compareWholeClass, setCompareWholeClass] = useState<boolean>(true);
  const [selectedComparisonMedications, setSelectedComparisonMedications] = useState<string[]>([]);
  
  // Get data from store
  const campaign = useAppSelector(state => 
    state.campaigns.campaigns.find(c => c.id === actualCampaignId)
  );
  
  const medications = useAppSelector(state => {
    const refData = state.referenceData as { medications: any[] };
    return refData.medications || [];
  });
  
  // Load data when component mounts
  useEffect(() => {
    if (!actualCampaignId) return;
    
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Load campaign data if not already loaded
        if (!campaign) {
          await dispatch(fetchCampaignById(actualCampaignId));
        }
        
        // Ensure reference data is loaded
        await dispatch(fetchAllReferenceData());
        
        // Try to get existing config
        const existingConfig = getScriptLiftConfig(actualCampaignId);
        
        if (existingConfig) {
          // Use existing config
          setConfig(existingConfig);
          setNotes(existingConfig.notes || '');
          
          // Find target medication
          const targetMed = existingConfig.medications.find(m => m.isTargeted);
          if (targetMed) {
            setTargetMedicationId(targetMed.id);
          }
          
          // Set comparison medications
          const comparisonMeds = existingConfig.medications
            .filter(m => !m.isTargeted)
            .map(m => m.id);
            
          if (comparisonMeds.length === 0) {
            setCompareWholeClass(true);
          } else {
            setCompareWholeClass(false);
            setSelectedComparisonMedications(comparisonMeds);
          }
        } else if (campaign && medications.length > 0) {
          // Set default target medication from campaign if available
          if (campaign.target_medication_id) {
            setTargetMedicationId(campaign.target_medication_id);
          } else if (medications.length > 0) {
            setTargetMedicationId(medications[0].id);
          }
          
          // Default to comparing whole class
          setCompareWholeClass(true);
          
          // Generate default config (still needed for structure)
          const newConfig = generateDefaultScriptLiftConfig(
            actualCampaignId,
            campaign.name || 'Unnamed Campaign',
            medications,
            campaign.target_medication_id,
            campaign.targeting_metadata?.medicationCategory,
            [], // No specialties needed for simplified version
            []  // No regions needed for simplified version
          );
          
          setConfig(newConfig);
          setHasChanges(true); // Mark as having changes to encourage saving
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load necessary data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [actualCampaignId, campaign, dispatch, medications]);
  
  // Update config when target medication changes
  useEffect(() => {
    if (!config || !targetMedicationId) return;
    
    // Update medications to mark the target
    const updatedMedications = config.medications.map(med => ({
      ...med,
      isTargeted: med.id === targetMedicationId,
      // If targeted, set a positive lift; if comparison, set to 0 or slight negative
      liftPercentage: med.id === targetMedicationId ? 25 : -5
    }));
    
    setConfig({
      ...config,
      medications: updatedMedications
    });
    
    setHasChanges(true);
  }, [targetMedicationId, config]);
  
  // Update comparison medications
  useEffect(() => {
    if (!config || !targetMedicationId) return;
    
    // Don't update if we're targeting the whole class
    if (compareWholeClass) return;
    
    // Get current medications
    const targetMedication = medications.find(m => m.id === targetMedicationId);
    if (!targetMedication) return;
    
    // Get medications in the same category
    const sameClassMedications = medications
      .filter(m => m.category === targetMedication.category && m.id !== targetMedicationId);
    
    // Update medications in config to reflect selected comparisons
    const updatedMedications = [...config.medications];
    
    // First ensure target is properly set
    const targetIndex = updatedMedications.findIndex(m => m.id === targetMedicationId);
    if (targetIndex >= 0) {
      updatedMedications[targetIndex] = {
        ...updatedMedications[targetIndex],
        isTargeted: true,
        liftPercentage: 25 // Default positive lift for target
      };
    }
    
    // Then update comparison medications
    sameClassMedications.forEach(med => {
      const isSelected = selectedComparisonMedications.includes(med.id);
      const medIndex = updatedMedications.findIndex(m => m.id === med.id);
      
      if (medIndex >= 0) {
        updatedMedications[medIndex] = {
          ...updatedMedications[medIndex],
          isTargeted: false,
          liftPercentage: isSelected ? -5 : 0 // Slight negative for comparisons
        };
      }
    });
    
    setConfig({
      ...config,
      medications: updatedMedications
    });
    
    setHasChanges(true);
  }, [compareWholeClass, selectedComparisonMedications, config, medications, targetMedicationId]);
  
  // Update notes in config when changed
  useEffect(() => {
    if (config && notes !== config.notes) {
      setConfig({
        ...config,
        notes
      });
      setHasChanges(true);
    }
  }, [notes, config]);
  
  // Calculate totals for target medication and comparisons
  const calculateTotals = () => {
    if (!config) return { target: { baseline: 0, projected: 0, change: 0, percentChange: 0 }, 
                           comparison: { baseline: 0, projected: 0, change: 0, percentChange: 0 } };
    
    // Get target medication
    const targetMed = config.medications.find(m => m.isTargeted);
    if (!targetMed) {
      return { target: { baseline: 0, projected: 0, change: 0, percentChange: 0 }, 
               comparison: { baseline: 0, projected: 0, change: 0, percentChange: 0 } };
    }
    
    // Calculate target metrics
    const targetBaseline = targetMed.baselinePrescriptions;
    const targetProjected = targetBaseline * (1 + (targetMed.liftPercentage / 100));
    const targetChange = targetProjected - targetBaseline;
    const targetPercentChange = (targetChange / targetBaseline) * 100;
    
    // Calculate comparison metrics (for selected comparisons or whole class)
    const comparisonMeds = config.medications.filter(med => 
      !med.isTargeted && 
      (compareWholeClass || selectedComparisonMedications.includes(med.id))
    );
    
    const comparisonBaseline = comparisonMeds.reduce((sum, med) => sum + med.baselinePrescriptions, 0);
    const comparisonProjected = comparisonMeds.reduce((sum, med) => {
      const liftMultiplier = 1 + (med.liftPercentage / 100);
      return sum + (med.baselinePrescriptions * liftMultiplier);
    }, 0);
    
    const comparisonChange = comparisonProjected - comparisonBaseline;
    const comparisonPercentChange = comparisonBaseline > 0 ? (comparisonChange / comparisonBaseline) * 100 : 0;
    
    return { 
      target: {
        baseline: Math.round(targetBaseline), 
        projected: Math.round(targetProjected), 
        change: Math.round(targetChange), 
        percentChange: parseFloat(targetPercentChange.toFixed(1))
      },
      comparison: {
        baseline: Math.round(comparisonBaseline), 
        projected: Math.round(comparisonProjected), 
        change: Math.round(comparisonChange), 
        percentChange: parseFloat(comparisonPercentChange.toFixed(1))
      }
    };
  };
  
  // Reset configuration to defaults
  const resetToDefaults = () => {
    if (!campaign || !actualCampaignId) return;
    
    // Reset target medication to campaign target if available
    if (campaign.target_medication_id) {
      setTargetMedicationId(campaign.target_medication_id);
    } else if (medications.length > 0) {
      setTargetMedicationId(medications[0].id);
    }
    
    // Reset to compare whole class
    setCompareWholeClass(true);
    setSelectedComparisonMedications([]);
    
    // Create default config
    const newConfig = generateDefaultScriptLiftConfig(
      actualCampaignId,
      campaign.name || 'Unnamed Campaign',
      medications,
      campaign.target_medication_id,
      campaign.targeting_metadata?.medicationCategory,
      [], // No specialties needed
      []  // No regions needed
    );
    
    setConfig(newConfig);
    setNotes('');
    setHasChanges(true);
  };
  
  // Save configuration
  const saveConfiguration = () => {
    if (!config) return;
    
    // Make sure specialties and regions arrays exist but are empty
    const updatedConfig = {
      ...config,
      specialties: [],
      regions: [],
      // Set campaign impact based on the target medication's lift
      campaignImpact: {
        ...config.campaignImpact,
        overallLiftPercentage: config.medications.find(m => m.isTargeted)?.liftPercentage || 0
      }
    };
    
    saveScriptLiftConfig(updatedConfig);
    setHasChanges(false);
    
    // Call onSave callback if provided
    if (onSave) {
      onSave(updatedConfig);
    }
    
    // Close modal or navigate back if needed
    if (isModal && onClose) {
      onClose();
    }
  };
  
  // Cancel and close
  const handleCancel = () => {
    if (onClose) {
      onClose();
    } else {
      navigate(-1);
    }
  };
  
  // Get medications in the same category as target medication
  const getSameClassMedications = () => {
    if (!targetMedicationId) return [];
    
    const targetMedication = medications.find(m => m.id === targetMedicationId);
    if (!targetMedication) return [];
    
    return medications
      .filter(m => m.category === targetMedication.category && m.id !== targetMedicationId);
  };

  // Get target medication from ID
  const getTargetMedication = () => {
    return medications.find(m => m.id === targetMedicationId);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>;
  }
  
  if (error) {
    return <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">{error}</div>;
  }
  
  if (!config || !campaign) {
    return <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded">
      No campaign data available for configuration.
    </div>;
  }
  
  // Calculated metrics
  const totals = calculateTotals();
  const targetMedication = getTargetMedication();
  const sameClassMedications = getSameClassMedications();
  
  // Main component render
  return (
    <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Header with campaign name */}
      <div className="px-6 py-4 bg-primary-700 text-white">
        <h2 className="text-xl font-semibold">{campaign.name} - Script Lift Configurator</h2>
        <p className="text-sm opacity-80">Configure which medications to track for this campaign</p>
      </div>
      
      {/* Main content */}
      <div className="px-6 py-6">
        <div className="space-y-8">
          {/* Target Medication Section */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Pill className="mr-2 text-primary-500" size={18} />
              Target Medication
            </h3>
            
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-3">
                Select the medication you want to track for increased prescriptions
              </p>
              
              <Select
                options={[
                  { value: '', label: 'Select target medication' },
                  ...medications.map(med => ({ value: med.id, label: med.name }))
                ]}
                value={targetMedicationId}
                onChange={(value) => setTargetMedicationId(value)}
                className="w-full max-w-md"
              />
            </div>
            
            {targetMedication && (
              <div className="p-4 bg-primary-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{targetMedication.name}</span>
                  <span className="text-green-600 font-medium">
                    +{config.medications.find(m => m.id === targetMedicationId)?.liftPercentage || 0}% Lift
                  </span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Baseline: {totals.target.baseline} prescriptions</span>
                  <span>Projected: {totals.target.projected} prescriptions</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Comparison Medications Section */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <TrendingUp className="mr-2 text-primary-500" size={18} />
              Comparison Medications
            </h3>
            
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-3">
                Select how you want to compare your target medication against other medications
              </p>
              
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="compare-whole-class"
                    name="compare-type"
                    checked={compareWholeClass}
                    onChange={() => setCompareWholeClass(true)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor="compare-whole-class" className="ml-2 block text-sm text-gray-700">
                    Compare against all medications in the same class
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="compare-specific"
                    name="compare-type"
                    checked={!compareWholeClass}
                    onChange={() => setCompareWholeClass(false)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor="compare-specific" className="ml-2 block text-sm text-gray-700">
                    Compare against specific medications
                  </label>
                </div>
              </div>
            </div>
            
            {!compareWholeClass && sameClassMedications.length > 0 && (
              <div className="mb-6 pl-6">
                <MultiSelect
                  options={sameClassMedications.map(med => ({ value: med.id, label: med.name }))}
                  value={selectedComparisonMedications}
                  onChange={(values) => setSelectedComparisonMedications(values)}
                  placeholder="Select comparison medications"
                  className="w-full max-w-md"
                />
              </div>
            )}
            
            {targetMedication && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">
                    {compareWholeClass 
                      ? `All ${targetMedication.category} Medications` 
                      : `Selected Comparison Medications (${selectedComparisonMedications.length})`}
                  </span>
                  <span className={cn(
                    "font-medium",
                    totals.comparison.percentChange >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {totals.comparison.percentChange >= 0 ? '+' : ''}
                    {totals.comparison.percentChange}% Lift
                  </span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Baseline: {totals.comparison.baseline} prescriptions</span>
                  <span>Projected: {totals.comparison.projected} prescriptions</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Summary & Notes Section */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Info className="mr-2 text-primary-500" size={18} />
              Summary & Notes
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes about your script lift projections
              </label>
              <textarea
                className="w-full h-32 p-2 border rounded"
                placeholder="Add notes about your script lift projections here..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              ></textarea>
            </div>
            
            <div className="p-4 bg-primary-50 rounded-lg">
              <h4 className="font-medium mb-2">Overall Impact Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Target Medication</div>
                  <div className="text-lg font-semibold text-primary-700">{targetMedication?.name || 'None Selected'}</div>
                  <div className="text-sm text-gray-600">
                    {totals.target.change >= 0 ? '+' : ''}{totals.target.change} prescriptions ({totals.target.percentChange}%)
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Comparison Medications</div>
                  <div className="text-lg font-semibold text-gray-700">
                    {compareWholeClass 
                      ? `All ${targetMedication?.category || ''} Class` 
                      : `${selectedComparisonMedications.length} Selected Medications`}
                  </div>
                  <div className="text-sm text-gray-600">
                    {totals.comparison.change >= 0 ? '+' : ''}{totals.comparison.change} prescriptions ({totals.comparison.percentChange}%)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer with actions */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between">
        <Button
          variant="outline"
          onClick={handleCancel}
        >
          Cancel
        </Button>
        
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={resetToDefaults}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Reset
          </Button>
          
          <Button
            variant="default"
            onClick={saveConfiguration}
          >
            <Save className="h-4 w-4 mr-1" />
            Save Configuration
          </Button>
        </div>
      </div>
    </div>
  );
};
