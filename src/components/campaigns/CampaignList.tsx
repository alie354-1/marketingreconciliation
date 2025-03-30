import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { fetchCampaigns, selectCampaignsWithLoadingState } from '../../store/slices/campaignSlice';
import { updateCampaignStatusesWithSideEffects } from '../../lib/campaignUtils';
import { selectSpecialties } from '../../store/slices/referenceDataSlice';
import { addNotification } from '../../store/slices/uiSlice';
import { Campaign } from '../../types';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';
import { 
  ListFilter, 
  ChevronRight, 
  Target, 
  Plus, 
  Calendar, 
  Search,
  RefreshCw,
  Filter,
  Activity
} from 'lucide-react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { ExpandableCampaignCard } from '../ui/ExpandableCampaignCard';


export function CampaignList() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [specialtyFilter, setSpecialtyFilter] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [highlightedCampaignId, setHighlightedCampaignId] = useState<string | null>(null);

  // Use memoized selector to get campaigns and loading state
  const { campaigns, isLoading } = useAppSelector(selectCampaignsWithLoadingState);

  // Get specialties for filtering with memoized selector
  const specialties = useAppSelector(selectSpecialties);

  useEffect(() => {
    dispatch(fetchCampaigns());
    
    // Check if there's a newly created campaign to highlight
    const newCampaignId = localStorage.getItem('newCampaignId');
    if (newCampaignId) {
      setHighlightedCampaignId(newCampaignId);
      
      // Show success message when returning from campaign creation
      dispatch(addNotification({
        type: 'success',
        message: 'Campaign created and ready to view!'
      }));
      
      // Clear the stored ID after 3 seconds
      setTimeout(() => {
        setHighlightedCampaignId(null);
        localStorage.removeItem('newCampaignId');
      }, 3000);
    }
  }, [dispatch]);

  // Effect to check for automatic campaign status updates
  useEffect(() => {
    if (campaigns.length > 0) {
      // Update campaign statuses with side effects (database update + prescription data generation)
      updateCampaignStatusesWithSideEffects(campaigns)
        .then(updatedCampaigns => {
          // Check if any statuses changed
          const statusChanged = updatedCampaigns.some((updated, index) => 
            updated.status !== campaigns[index].status
          );
          
          // If status changes occurred, refresh the campaign list
          if (statusChanged) {
            dispatch(fetchCampaigns());
            dispatch(addNotification({
              type: 'info',
              message: 'Campaign statuses have been automatically updated based on dates'
            }));
          }
        })
        .catch(err => console.error('Error updating campaign statuses:', err));
    }
  }, [campaigns, dispatch]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await dispatch(fetchCampaigns());
    setIsRefreshing(false);
  };

  // Filter campaigns based on search query and filters
  const filteredCampaigns = campaigns.filter((campaign: Campaign) => {
    // Apply search filter
    const matchesSearch = searchQuery === '' || 
      campaign.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Apply status filter
    const matchesStatus = statusFilter === '' || 
      campaign.status === statusFilter;
    
    // Apply specialty filter
    const matchesSpecialty = specialtyFilter === '' || 
      campaign.target_specialty === specialtyFilter;
    
    return matchesSearch && matchesStatus && matchesSpecialty;
  });

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'active', label: 'Active' },
    { value: 'draft', label: 'Draft' },
    { value: 'completed', label: 'Completed' },
    { value: 'paused', label: 'Paused' }
  ];

  const specialtyOptionsList = [
    { value: '', label: 'All Specialties' },
    ...specialties.map(specialty => ({
      value: specialty.name,
      label: specialty.name
    }))
  ];
  
  // If specialties are empty, use some default specialties for the demo
  const specialtyOptionsWithDefaults = specialtyOptionsList.length > 1 ? 
    specialtyOptionsList : 
    [
      { value: '', label: 'All Specialties' },
      { value: 'Primary Care', label: 'Primary Care' },
      { value: 'Cardiology', label: 'Cardiology' },
      { value: 'Neurology', label: 'Neurology' },
      { value: 'Psychiatry', label: 'Psychiatry' },
      { value: 'Oncology', label: 'Oncology' }
    ];

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <ListFilter className="h-6 w-6 text-primary-500 mr-2" />
            <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
          </div>
          <Link to="/campaigns/create">
            <Button variant="default" leftIcon={<Plus className="h-4 w-4" />}>
              New Campaign
            </Button>
          </Link>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search campaigns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="h-4 w-4 text-gray-400" />}
                fullWidth
              />
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setShowFilters(!showFilters)}
                leftIcon={<Filter className="h-4 w-4" />}
              >
                Filters
              </Button>
              <Button 
                variant="outline" 
                onClick={handleRefresh}
                leftIcon={<RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />}
              >
                Refresh
              </Button>
            </div>
          </div>
          
          {showFilters && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Status"
                options={statusOptions}
                value={statusFilter}
                onChange={(value) => setStatusFilter(value)}
              />
              <Select
                label="Specialty"
                options={specialtyOptionsWithDefaults}
                value={specialtyFilter}
                onChange={(value) => setSpecialtyFilter(value)}
              />
            </div>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          {filteredCampaigns.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {filteredCampaigns.map((campaign: Campaign, index: number) => {
                // Transform campaign data to match ExpandableCampaignCard props
                const target = {
                  specialty: campaign.target_specialty || 'All Specialties',
                  geographic: campaign.target_geographic_area || 'Nationwide',
                  condition: campaign.targeting_metadata?.condition || 'All Conditions',
                  medication: campaign.targeting_metadata?.medication || 'All Medications',
                  targetMedicationId: campaign.target_medication_id
                };
                
                // Extract targeting data from metadata
                const targeting = {
                  medicationCategory: campaign.targeting_metadata?.medicationCategory,
                  medications: campaign.targeting_metadata?.medications || [],
                  excludedMedications: campaign.targeting_metadata?.excluded_medications || [],
                  specialties: campaign.target_specialty ? [campaign.target_specialty] : [],
                  regions: campaign.target_geographic_area ? [campaign.target_geographic_area] : [],
                  prescribingVolume: campaign.targeting_metadata?.prescribing_volume || 'all',
                  timeframe: campaign.targeting_metadata?.timeframe || 'last_quarter'
                };
                
                // Estimate audience counts
                const baseProviderCount = 1000; // Default
                const providers = campaign.targeting_metadata?.affected_providers?.length || baseProviderCount;
                const audienceCounts = {
                  providers: providers,
                  patients: providers * 250, // Each provider reaches ~250 patients
                  identityMatched: Math.round(providers * 0.92), // 92% match rate
                  identityMatchRate: 92
                };
                
                // Generate metrics if not available
                const metrics = {
                  impressions: Math.round(providers * 150), // ~150 impressions per provider
                  clicks: Math.round(providers * 7.5), // ~5% CTR
                  conversions: Math.round(providers * 3), // ~40% conversion from clicks
                  scriptLift: (Math.random() * 10 + 10).toFixed(1), // Random between 10-20%
                  roi: (Math.random() * 5 + 8).toFixed(1), // Random between 8-13x
                  providerReach: providers
                };
                
                return (
                  <li key={campaign.id || index} 
                      className={cn(
                        "mb-4 transition-all",
                        highlightedCampaignId === campaign.id && "animate-pulse"
                      )}>
                    <ExpandableCampaignCard
                      id={campaign.id || `campaign-${index}`}
                      name={campaign.name || `Campaign ${index + 1}`}
                      status={campaign.status || 'draft'}
                      startDate={campaign.start_date}
                      endDate={campaign.end_date}
                      target={target}
                      targeting={targeting}
                      audienceCounts={audienceCounts}
                      metrics={metrics}
                      onViewResults={(id) => navigate(`/campaigns/${id}/results`)}
                    />
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="px-6 py-12">
              <div className="text-center">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No campaigns found</p>
                <p className="text-gray-400 text-sm mb-6">
                  {searchQuery || statusFilter || specialtyFilter 
                    ? 'Try adjusting your search or filters'
                    : 'Start by creating your first campaign'}
                </p>
                <Link
                  to="/campaigns/create"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Campaign
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
