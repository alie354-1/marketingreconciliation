import React, { useState } from 'react';
import { useAppSelector } from '../../hooks';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { 
  Map, 
  Search,
  Plus,
  Filter,
  Eye,
  Globe,
  Users,
  Building,
  Heart,
  Activity
} from 'lucide-react';
import { cn } from '../../utils/cn';

// Simple region interface
interface Region {
  id: string;
  name: string;
  type: string;
  population?: number;
  description?: string;
}

export function RegionsList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedRegionId, setExpandedRegionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'demographics' | 'healthcare' | 'health'>('demographics');
  
  // Toggle expanded view for a region
  const toggleExpanded = (regionId: string) => {
    if (expandedRegionId === regionId) {
      setExpandedRegionId(null);
    } else {
      setExpandedRegionId(regionId);
      setActiveTab('demographics');
    }
  };

  // Get regions from state
  const regions = useAppSelector(state => {
    const refData = state.referenceData as { geographicRegions: any[] };
    return refData.geographicRegions || [];
  });

  // Placeholder data if no regions exist
  const regionsWithDefaults: Region[] = regions.length > 0 ? 
    regions : 
    [
      { id: '1', name: 'Northeast US', type: 'Region', population: 55000000, description: 'Northeastern states including NY, MA, PA, etc.' },
      { id: '2', name: 'Southeast US', type: 'Region', population: 65000000, description: 'Southeastern states including FL, GA, NC, etc.' },
      { id: '3', name: 'Midwest US', type: 'Region', population: 52000000, description: 'Midwestern states including IL, OH, MI, etc.' },
      { id: '4', name: 'Southwest US', type: 'Region', population: 40000000, description: 'Southwestern states including TX, AZ, NM, etc.' },
      { id: '5', name: 'West US', type: 'Region', population: 60000000, description: 'Western states including CA, WA, OR, etc.' },
      { id: '6', name: 'New York', type: 'State', population: 19450000, description: 'State of New York' },
      { id: '7', name: 'California', type: 'State', population: 39510000, description: 'State of California' },
      { id: '8', name: 'Texas', type: 'State', population: 29000000, description: 'State of Texas' }
    ];

  // Extract unique region types
  const regionTypes = [...new Set(regionsWithDefaults.map(region => region.type))];
  
  // Filter based on search and type
  const filteredRegions = regionsWithDefaults.filter(region => {
    const matchesSearch = searchQuery === '' || 
      region.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (region.description && region.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = typeFilter === '' || region.type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  const typeOptions = [
    { value: '', label: 'All Types' },
    ...regionTypes.map(type => ({ value: type, label: type }))
  ];

  return (
    <div>
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Activity className="h-5 w-5 text-amber-500" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-amber-800">Coming Soon</h3>
            <div className="mt-2 text-sm text-amber-700">
              <p>The geographic regions module is under development. Check back soon for more detailed geographic data and targeting options!</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Map className="h-6 w-6 text-primary-500 mr-2" />
            <h1 className="text-2xl font-bold text-gray-900">Geographic Regions</h1>
          </div>
          <Button variant="default" leftIcon={<Plus className="h-4 w-4" />}>
            Add Region
          </Button>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search regions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="h-4 w-4 text-gray-400" />}
                fullWidth
              />
            </div>
            <div>
              <Button 
                variant="outline" 
                onClick={() => setShowFilters(!showFilters)}
                leftIcon={<Filter className="h-4 w-4" />}
              >
                Filters
              </Button>
            </div>
          </div>
          
          {showFilters && (
            <div className="mt-4">
              <Select
                label="Region Type"
                options={typeOptions}
                value={typeFilter}
                onChange={(value) => setTypeFilter(value)}
              />
            </div>
          )}
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <ul className="divide-y divide-gray-200">
          {filteredRegions.map((region) => (
            <li key={region.id} className="p-6">
              <div className="flex flex-col">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="bg-primary-50 p-2 rounded-lg">
                      <Globe className="h-5 w-5 text-primary-500" />
                    </div>
                  </div>
                  <div className="ml-4 flex-grow">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center">
                          <h3 className="text-lg font-medium text-gray-900">{region.name}</h3>
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {region.type}
                          </span>
                        </div>
                        {region.description && (
                          <p className="mt-1 text-sm text-gray-500">{region.description}</p>
                        )}
                      </div>
                      {region.population && (
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-500">Population</div>
                          <div className="text-lg font-semibold text-gray-900">
                            {region.population.toLocaleString()}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 flex items-center gap-4">
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<Eye className="h-4 w-4" />}
                        onClick={() => toggleExpanded(region.id)}
                      >
                        {expandedRegionId === region.id ? 'Hide Details' : 'View Details'}
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* Expanded details section */}
                {expandedRegionId === region.id && (
                  <div className="mt-4 bg-gray-50 rounded-lg p-4">
                    {/* Tabs navigation */}
                    <div className="border-b border-gray-200">
                      <nav className="-mb-px flex space-x-4">
                        <button
                          onClick={() => setActiveTab('demographics')}
                          className={cn(
                            "px-3 py-2 text-sm font-medium border-b-2 focus:outline-none",
                            activeTab === 'demographics'
                              ? "border-primary-500 text-primary-600"
                              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                          )}
                        >
                          <Users className="inline-block h-4 w-4 mr-1" />
                          Demographics
                        </button>
                        <button
                          onClick={() => setActiveTab('healthcare')}
                          className={cn(
                            "px-3 py-2 text-sm font-medium border-b-2 focus:outline-none",
                            activeTab === 'healthcare'
                              ? "border-primary-500 text-primary-600"
                              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                          )}
                        >
                          <Building className="inline-block h-4 w-4 mr-1" />
                          Healthcare
                        </button>
                        <button
                          onClick={() => setActiveTab('health')}
                          className={cn(
                            "px-3 py-2 text-sm font-medium border-b-2 focus:outline-none",
                            activeTab === 'health'
                              ? "border-primary-500 text-primary-600"
                              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                          )}
                        >
                          <Heart className="inline-block h-4 w-4 mr-1" />
                          Health Data
                        </button>
                      </nav>
                    </div>
                    
                    {/* Tab content */}
                    <div className="mt-4">
                      {activeTab === 'demographics' && (
                        <div className="bg-white p-6 rounded-lg shadow-sm text-center">
                          <Users className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                          <h3 className="text-lg font-medium text-gray-700 mb-1">No Demographic Data</h3>
                          <p className="text-sm text-gray-500">
                            Population: {region.population?.toLocaleString() || 'Unknown'}
                          </p>
                          <p className="text-sm text-gray-500 mt-2">
                            Detailed demographic data for {region.name} is not available at this time.
                          </p>
                        </div>
                      )}
                      
                      {activeTab === 'healthcare' && (
                        <div className="bg-white p-6 rounded-lg shadow-sm text-center">
                          <Building className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                          <h3 className="text-lg font-medium text-gray-700 mb-1">No Healthcare Data</h3>
                          <p className="text-sm text-gray-500">
                            Healthcare infrastructure information for {region.name} is not available at this time.
                          </p>
                        </div>
                      )}
                      
                      {activeTab === 'health' && (
                        <div className="bg-white p-6 rounded-lg shadow-sm text-center">
                          <Heart className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                          <h3 className="text-lg font-medium text-gray-700 mb-1">No Health Statistics</h3>
                          <p className="text-sm text-gray-500">
                            Health metrics and common conditions for {region.name} are not available at this time.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
