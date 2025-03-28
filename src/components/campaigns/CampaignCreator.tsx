import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { createCampaign } from '../../store/slices/campaignSlice';
import { fetchAllReferenceData } from '../../store/slices/referenceDataSlice';
import { 
  fetchFilteredProviders, 
  updateFilterState, 
  updateQueryExpression,
  toggleAndLogic 
} from '../../store/slices/providerSlice';
import { QueryBuilder } from '../query/QueryBuilder';
import { QueryExpression, QueryField } from '../../types';
import { createDefaultExpression } from '../../lib/queryBuilderV2';
import { useForm, Controller } from 'react-hook-form';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';
import { 
  Target, 
  Send, 
  AlertCircle, 
  ChevronRight, 
  Plus, 
  Users, 
  Calendar, 
  Radio,
  CheckCircle,
  XCircle,
  Globe,
  HeartPulse
} from 'lucide-react';
import { generateCreative } from '../../lib/creative';
import { addNotification } from '../../store/slices/uiSlice';

// Define the form interface
interface CampaignForm {
  name: string;
  target_condition_id?: string;
  target_medication_id?: string;
  target_geographic_area?: string;
  target_specialty?: string;
  template_id?: string;
  start_date?: string;
  end_date?: string;
}

export function CampaignCreator() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  // Simplified to focus on targeting - start with step 2 by default
  const [step, setStep] = useState(2);
  const [loading, setLoading] = useState(false);
  const [showAdvancedTargeting, setShowAdvancedTargeting] = useState(false);
  const [queryFields, setQueryFields] = useState<QueryField[]>([]);
  const [queryExpression, setQueryExpression] = useState<QueryExpression>(createDefaultExpression());
  const [previewCreative, setPreviewCreative] = useState<{
    headline: string;
    body: string;
    cta: string;
  } | null>(null);
  
  // New state for target confirmation animation
  const [showTargetingConfirmation, setShowTargetingConfirmation] = useState(false);
  
  // Get state with type assertions
  const conditions = useAppSelector(state => {
    const refData = state.referenceData as { conditions: any[] };
    return refData.conditions || [];
  });
  
  const medications = useAppSelector(state => {
    const refData = state.referenceData as { medications: any[] };
    return refData.medications || [];
  });
  
  const specialties = useAppSelector(state => {
    const refData = state.referenceData as { specialties: any[] };
    return refData.specialties || [];
  });
  
  const geographicRegions = useAppSelector(state => {
    const refData = state.referenceData as { geographicRegions: any[] };
    return refData.geographicRegions || [];
  });

  const templates = useAppSelector(state => {
    const refData = state.referenceData as { creativeTemplates: any[] };
    return refData.creativeTemplates || [];
  });
  
  const { useAndLogic, targetingCounts } = useAppSelector(state => {
    const providerState = state.providers as { 
      filterState: { useAndLogic: boolean };
      targetingCounts: { total: number; filtered: number; identityMatched: number } | null;
    };
    return {
      useAndLogic: providerState.filterState?.useAndLogic || false,
      targetingCounts: providerState.targetingCounts
    };
  });

  // Initialize query fields for advanced targeting
  useEffect(() => {
    // Create query fields from our reference data for the QueryBuilder
    const fields: QueryField[] = [
      // Specialty field
      {
        id: 'specialty',
        name: 'specialty',
        label: 'Healthcare Specialty',
        type: 'string',
        options: specialties.map(specialty => ({
          value: specialty.name,
          label: specialty.name
        }))
      },
      // Geographic area field
      {
        id: 'geographic_area',
        name: 'geographic_area',
        label: 'Geographic Region',
        type: 'string',
        options: geographicRegions.map(region => ({
          value: region.name,
          label: `${region.name} ${region.type ? `(${region.type})` : ''}`
        }))
      },
      // Condition field
      {
        id: 'condition_id',
        name: 'condition_id',
        label: 'Medical Condition',
        type: 'string',
        options: conditions.map(condition => ({
          value: condition.id,
          label: condition.name
        }))
      },
      // Medication field
      {
        id: 'medication_id',
        name: 'medication_id',
        label: 'Medication',
        type: 'string',
        options: medications.map(medication => ({
          value: medication.id,
          label: medication.name
        }))
      },
      // Practice size field
      {
        id: 'practice_size',
        name: 'practice_size',
        label: 'Practice Size',
        type: 'string',
        options: [
          { value: 'small', label: 'Small Practice (<5 providers)' },
          { value: 'medium', label: 'Medium Practice (5-20 providers)' },
          { value: 'large', label: 'Large Practice (>20 providers)' },
          { value: 'hospital', label: 'Hospital' }
        ]
      }
    ];
    
    setQueryFields(fields);
  }, [conditions, medications, specialties, geographicRegions]);
  
  // Handle query expression changes
  const handleQueryExpressionChange = (expression: QueryExpression) => {
    // Store previous expression for comparison
    const prevExpression = queryExpression;
    
    // Update local state
    setQueryExpression(expression);
    
    // Only update Redux store if the expression structure has meaningfully changed
    // This helps prevent the infinite update loop
    const hasOperatorChanged = 
      expression.type === 'logical' && 
      prevExpression.type === 'logical' && 
      expression.operator !== prevExpression.operator;
      
    if (hasOperatorChanged) {
      // Only sync the AND/OR logic if it actually changed
      if ((expression.operator === 'and' && !useAndLogic) || 
          (expression.operator === 'or' && useAndLogic)) {
        dispatch(toggleAndLogic());
      }
    }
    
    // Don't update the store on every change - use a debounced approach
    // Only dispatch the Redux action if we have expressions to filter by
    const hasExpressions = expression.type === 'logical' && expression.expressions.length > 0;
    
    if (hasExpressions) {
      // Update the expression in the store
      dispatch(updateQueryExpression(expression));
      
      // Fetch providers based on the new expression - but less frequently
      dispatch(fetchFilteredProviders({
        conditions: [],
        medications: [],
        specialties: [],
        geographicAreas: [],
        useAndLogic,
        queryExpression: expression
      }));
    }
  };

  const { register, handleSubmit, watch, control, setValue, formState: { errors } } = useForm<CampaignForm>();
  const watchedValues = watch();

  useEffect(() => {
    // Load reference data if needed
    dispatch(fetchAllReferenceData());
  }, [dispatch]);
  
  useEffect(() => {
    // Preview the creative when template and condition/medication are selected
    if (watchedValues.template_id && (watchedValues.target_condition_id || watchedValues.target_medication_id)) {
      try {
        const selectedTemplate = templates.find(t => t.id === watchedValues.template_id);
        if (!selectedTemplate) return;
        
        const condition = conditions.find(c => c.id === watchedValues.target_condition_id);
        const medication = medications.find(m => m.id === watchedValues.target_medication_id);
        
        // Build variables for creative generation
        const variables: Record<string, string | number> = {
          // Add default variables
          efficacy_rate: '85',
          timeframe: '4',
          statistic: '78',
          key_benefit: 'improved quality of life'
        };
        
        if (condition) {
          variables.condition_name = condition.name;
        }
        
        if (medication) {
          variables.medication_name = medication.name;
        }
        
        if (watchedValues.target_specialty) {
          variables.specialty = watchedValues.target_specialty;
        }
        
        // Generate creative preview
        const creative = generateCreative({
          headline_template: selectedTemplate.headline_template,
          body_template: selectedTemplate.body_template,
          cta_template: selectedTemplate.cta_template,
          variables: selectedTemplate.variables
        }, variables);
        
        setPreviewCreative(creative);
      } catch (error) {
        console.error('Error generating creative preview:', error);
      }
    }
  }, [
    watchedValues.template_id, 
    watchedValues.target_condition_id, 
    watchedValues.target_medication_id,
    watchedValues.target_specialty,
    templates,
    conditions,
    medications
  ]);
  
  useEffect(() => {
    // Update provider filters when targeting options change
    if (watchedValues.target_specialty || watchedValues.target_geographic_area) {
      dispatch(updateFilterState({
        specialties: watchedValues.target_specialty ? [watchedValues.target_specialty] : [],
        geographicAreas: watchedValues.target_geographic_area ? [watchedValues.target_geographic_area] : [],
      }));
      
      // Get provider counts
      dispatch(fetchFilteredProviders({
        conditions: [],
        medications: [],
        specialties: watchedValues.target_specialty ? [watchedValues.target_specialty] : [],
        geographicAreas: watchedValues.target_geographic_area ? [watchedValues.target_geographic_area] : [],
        useAndLogic
      }));
    }
  }, [
    watchedValues.target_specialty, 
    watchedValues.target_geographic_area,
    useAndLogic,
    dispatch
  ]);

  const onSubmit = async (data: CampaignForm) => {
    setLoading(true);
    
    try {
      // Generate creative content
      let creativeContent = previewCreative;
      
      if (!creativeContent && data.template_id) {
        // If no preview was generated, try to generate now
        const selectedTemplate = templates.find(t => t.id === data.template_id);
        
        if (selectedTemplate) {
          const condition = conditions.find(c => c.id === data.target_condition_id);
          const medication = medications.find(m => m.id === data.target_medication_id);
          
          const variables: Record<string, string | number> = {
            efficacy_rate: '85',
            timeframe: '4',
            statistic: '78',
            key_benefit: 'improved quality of life'
          };
          
          if (condition) variables.condition_name = condition.name;
          if (medication) variables.medication_name = medication.name;
          if (data.target_specialty) variables.specialty = data.target_specialty;
          
          creativeContent = generateCreative({
            headline_template: selectedTemplate.headline_template,
            body_template: selectedTemplate.body_template,
            cta_template: selectedTemplate.cta_template,
            variables: selectedTemplate.variables
          }, variables);
        }
      }
      
      // If still no creative, use a default
      if (!creativeContent) {
        creativeContent = {
          headline: 'New Healthcare Campaign',
          body: 'This campaign targets healthcare providers with relevant information.',
          cta: 'Learn More'
        };
      }
      
      // Create the campaign
      const campaign = {
        ...data,
        status: 'draft' as 'draft', // Type assertion to match Campaign type
        targeting_logic: (useAndLogic ? 'and' : 'or') as 'and' | 'or',
        creative_content: creativeContent
      };
      
      await dispatch(createCampaign(campaign));
      
      dispatch(addNotification({
        type: 'success',
        message: 'Campaign created successfully!'
      }));
      
      navigate('/campaigns');
    } catch (error) {
      console.error('Error creating campaign:', error);
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to create campaign. Please try again.'
      }));
    } finally {
      setLoading(false);
    }
  };
  
  const nextStep = () => {
    setStep(step + 1);
  };
  
  const prevStep = () => {
    setStep(step - 1);
  };
  
  const handleToggleLogic = () => {
    dispatch(toggleAndLogic());
  };

  // Default options for select inputs
  const specialtyOptions = [
    { value: '', label: 'Select a specialty' },
    ...(specialties.length > 0 
      ? specialties.map(specialty => ({ value: specialty.name, label: specialty.name }))
      : [
          { value: 'Primary Care', label: 'Primary Care' },
          { value: 'Cardiology', label: 'Cardiology' },
          { value: 'Neurology', label: 'Neurology' },
          { value: 'Psychiatry', label: 'Psychiatry' },
          { value: 'Oncology', label: 'Oncology' }
        ]
    )
  ];
  
  const regionOptions = [
    { value: '', label: 'Select a region' },
    ...(geographicRegions.length > 0
      ? geographicRegions.map(region => ({ 
          value: region.name, 
          label: `${region.name} ${region.type ? `(${region.type})` : ''}` 
        }))
      : [
          { value: 'Northeast US', label: 'Northeast US (Region)' },
          { value: 'Southeast US', label: 'Southeast US (Region)' },
          { value: 'Midwest US', label: 'Midwest US (Region)' },
          { value: 'Southwest US', label: 'Southwest US (Region)' },
          { value: 'West US', label: 'West US (Region)' }
        ]
    )
  ];
  
  const conditionOptions = [
    { value: '', label: 'Select a condition' },
    ...conditions.map(condition => ({ value: condition.id, label: condition.name }))
  ];
  
  const medicationOptions = [
    { value: '', label: 'Select a medication' },
    ...medications.map(medication => ({ value: medication.id, label: medication.name }))
  ];
  
  const templateOptions = [
    { value: '', label: 'Select a template' },
    ...templates.map(template => ({ value: template.id, label: template.name }))
  ];

  return (
    <div className="bg-white shadow-sm rounded-lg p-6">
      <div className="flex items-center mb-6">
        <Target className="h-6 w-6 text-primary-600 mr-2" aria-hidden="true" />
        <h2 className="text-2xl font-bold text-gray-900">Create New Campaign</h2>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-center">
          <ol className="flex items-center w-full">
            <li className={cn(
              "flex w-full items-center text-primary-600 after:content-[''] after:w-full after:h-1 after:border-b after:border-primary-100 after:border-4 after:inline-block",
              step >= 1 && "after:border-primary-600 text-primary-800"
            )}>
              <span className={cn(
                "flex items-center justify-center w-10 h-10 bg-primary-100 rounded-full lg:h-12 lg:w-12",
                step >= 1 && "bg-primary-200"
              )}>
                <Target className={cn(
                  "w-5 h-5 text-primary-600",
                  step >= 1 && "text-primary-800"
                )} />
              </span>
            </li>
            <li className="flex w-full items-center">
              <span className={cn(
                "flex items-center justify-center w-10 h-10 bg-primary-100 rounded-full lg:h-12 lg:w-12",
                step >= 2 && "bg-primary-200"
              )}>
                <Users className={cn(
                  "w-5 h-5 text-primary-600",
                  step >= 2 && "text-primary-800"
                )} />
              </span>
            </li>
          </ol>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Step 1: Basic Campaign Info */}
        {step === 1 && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Campaign Information</h3>
            
            <Input
              label="Campaign Name"
              id="name"
              type="text"
              error={errors.name?.message}
              fullWidth
              {...register('name', { required: 'Campaign name is required' })}
            />
            
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Controller
                name="start_date"
                control={control}
                render={({ field }) => (
                  <Input
                    label="Start Date"
                    id="start_date"
                    type="date"
                    fullWidth
                    leftIcon={<Calendar className="h-4 w-4 text-gray-400" />}
                    {...field}
                  />
                )}
              />
              
              <Controller
                name="end_date"
                control={control}
                render={({ field }) => (
                  <Input
                    label="End Date"
                    id="end_date"
                    type="date"
                    fullWidth
                    leftIcon={<Calendar className="h-4 w-4 text-gray-400" />}
                    {...field}
                  />
                )}
              />
            </div>
            
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={nextStep}
                variant="default"
                rightIcon={<ChevronRight className="h-4 w-4" />}
              >
                Next: Target Audience
              </Button>
            </div>
          </div>
        )}
        
        {/* Step 2: Targeting */}
        {step === 2 && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Target Audience</h3>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Targeting Mode:</span>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAdvancedTargeting(false)}
                  className={cn(
                    "px-3 py-1 text-sm font-medium rounded-md transition-colors",
                    !showAdvancedTargeting
                      ? "bg-primary-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  )}
                >
                  Simple
                </button>
                <button
                  type="button"
                  onClick={() => setShowAdvancedTargeting(true)}
                  className={cn(
                    "px-3 py-1 text-sm font-medium rounded-md transition-colors",
                    showAdvancedTargeting
                      ? "bg-primary-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  )}
                >
                  Advanced
                </button>
              </div>
            </div>
            
            {!showAdvancedTargeting ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Controller
                  name="target_specialty"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label="Healthcare Specialty"
                      id="target_specialty"
                      options={specialtyOptions}
                      value={field.value || ''}
                      onChange={field.onChange}
                    />
                  )}
                />
                
                <Controller
                  name="target_geographic_area"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label="Geographic Area"
                      id="target_geographic_area"
                      options={regionOptions}
                      value={field.value || ''}
                      onChange={field.onChange}
                    />
                  )}
                />
                
                <Controller
                  name="target_condition_id"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label="Medical Condition"
                      id="target_condition_id"
                      options={conditionOptions}
                      value={field.value || ''}
                      onChange={field.onChange}
                    />
                  )}
                />
                
                <Controller
                  name="target_medication_id"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label="Medication"
                      id="target_medication_id"
                      options={medicationOptions}
                      value={field.value || ''}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>
            ) : (
              <div className="rounded-lg border border-gray-200 p-4">
                <h4 className="text-md font-medium text-gray-900 mb-4">Advanced Query Builder</h4>
                
                {queryFields.length > 0 && (
                  <QueryBuilder
                    availableFields={queryFields}
                    initialExpression={queryExpression}
                    onChange={handleQueryExpressionChange}
                    showPreview={true}
                  />
                )}
              </div>
            )}
            
            {/* Targeting Logic - Only show in simple mode */}
            {!showAdvancedTargeting && (
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-gray-700">Provider Targeting Logic:</span>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={handleToggleLogic}
                      className={cn(
                        "px-3 py-1 text-sm font-medium rounded-md transition-colors",
                        useAndLogic
                          ? "bg-primary-600 text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      )}
                    >
                      AND
                    </button>
                    <button
                      type="button"
                      onClick={handleToggleLogic}
                      className={cn(
                        "px-3 py-1 text-sm font-medium rounded-md transition-colors",
                        !useAndLogic
                          ? "bg-primary-600 text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      )}
                    >
                      OR
                    </button>
                  </div>
                </div>
                
                {targetingCounts && (
                  <div>
                    {/* Confirmation button */}
                    {!showTargetingConfirmation ? (
                      <div className="text-sm text-gray-600">
                        <p className="mb-2">
                          Found <span className="font-medium text-primary-600">{targetingCounts.filtered}</span> providers matching your criteria
                        </p>
                        <Button
                          type="button"
                          onClick={() => setShowTargetingConfirmation(true)}
                          variant="default"
                          size="sm"
                          className="mt-2"
                        >
                          Confirm Targeting
                        </Button>
                      </div>
                    ) : (
                      <div className="bg-green-50 border border-green-100 rounded-lg p-4 animate-fadeIn">
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <CheckCircle className="h-5 w-5 text-green-500" aria-hidden="true" />
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-green-800">Target audience confirmed</h3>
                            <div className="mt-2 text-sm text-green-700">
                              <p>Your campaign will reach <span className="font-bold">{targetingCounts.filtered}</span> healthcare providers</p>
                            </div>
                            
                            {/* Animated target icons representing providers */}
                            <div className="flex items-center space-x-2 mt-3">
                              <div className="flex -space-x-2">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <div 
                                    key={i}
                                    className={cn(
                                      "w-8 h-8 rounded-full bg-primary-100 border-2 border-primary-200 flex items-center justify-center",
                                      "animate-pulse"
                                    )}
                                    style={{ animationDelay: `${i * 150}ms` }}
                                  >
                                    <Users size={14} className="text-primary-600" />
                                  </div>
                                ))}
                              </div>
                              <span className="text-xs text-green-600 font-medium">Identity-matched for precise targeting</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <p className="text-xs text-gray-500 mt-2">
                      {useAndLogic ? 'Providers must match ALL selected criteria' : 'Providers must match ANY selected criteria'}
                    </p>
                  </div>
                )}
              </div>
            )}
            
            <div className="grid grid-cols-1 gap-6">
              <Controller
                name="template_id"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Creative Template"
                    id="template_id"
                    options={templateOptions}
                    value={field.value || ''}
                    onChange={field.onChange}
                  />
                )}
              />
              
              {/* Creative Preview */}
              {previewCreative && (
                <div className="bg-gray-50 rounded-lg p-6 mt-4">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Creative Preview</h4>
                  
                  <div className="bg-white shadow-sm rounded-lg p-4 mb-4">
                    <h5 className="text-lg font-semibold text-primary-700 mb-3">{previewCreative.headline}</h5>
                    <p className="text-gray-600 mb-4">{previewCreative.body}</p>
                    <div className="inline-block bg-primary-600 text-white px-4 py-2 rounded-md font-medium">
                      {previewCreative.cta}
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-2 text-sm text-gray-500">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <p>This is a preview of how your campaign creative will appear to healthcare providers.</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-between">
              <Button
                type="button"
                onClick={prevStep}
                variant="outline"
              >
                Back
              </Button>
              <Button
                type="submit"
                variant="default"
                isLoading={loading}
                leftIcon={<Send className="h-4 w-4" />}
              >
                Create Campaign
              </Button>
            </div>
          </div>
        )}

      </form>
    </div>
  );
}
