import React, { useState } from 'react';
import { useAppSelector } from '../../hooks';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { 
  FileText, 
  Search,
  Plus,
  Activity,
  Heart,
  UserCheck,
  Pill,
  BarChart2,
  TrendingUp,
  Users,
  PieChart,
  Layers,
  Globe
} from 'lucide-react';
import { cn } from '../../utils/cn';

// Interface for related items data
interface RelatedMedication {
  id: string;
  name: string;
  prescriptionRate: number; // percentage
  category: string;
}

interface SpecialtyDistribution {
  specialty: string;
  percentage: number;
}

// Enhanced condition interface with related data
interface EnhancedCondition {
  id: string;
  name: string;
  description?: string;
  prevalence?: number; // per 100,000 population
  annualGrowth?: number; // percentage change
  relatedMedications?: RelatedMedication[];
  specialtyDistribution?: SpecialtyDistribution[];
  stats?: {
    avgPatientAge?: number;
    maleFemaleRatio?: number; // higher = more male, lower = more female
    regionalVariation?: boolean;
  };
}

export function ConditionsList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedConditionId, setExpandedConditionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'stats' | 'medications' | 'specialties'>('stats');

  // Get conditions with type assertion
  const conditions = useAppSelector(state => {
    const refData = state.referenceData as { conditions: any[] };
    return refData.conditions || [];
  });

  // Toggle expanded view for a condition
  const toggleExpanded = (conditionId: string) => {
    if (expandedConditionId === conditionId) {
      setExpandedConditionId(null);
    } else {
      setExpandedConditionId(conditionId);
      setActiveTab('stats'); // Reset to stats tab when expanding
    }
  };

  // Enhanced placeholder data with statistics and related items
  const conditionsWithDefaults: EnhancedCondition[] = conditions.length > 0 ? 
    conditions : 
    [
      { 
        id: '1', 
        name: 'Hypertension', 
        description: 'High blood pressure condition affecting cardiovascular health.',
        prevalence: 1120, // per 100,000
        annualGrowth: 2.3,
        relatedMedications: [
          { id: 'm1', name: 'Lisinopril', prescriptionRate: 42, category: 'ACE Inhibitor' },
          { id: 'm2', name: 'Amlodipine', prescriptionRate: 38, category: 'Calcium Channel Blocker' },
          { id: 'm3', name: 'Hydrochlorothiazide', prescriptionRate: 25, category: 'Diuretic' }
        ],
        specialtyDistribution: [
          { specialty: 'Primary Care', percentage: 65 },
          { specialty: 'Cardiology', percentage: 30 },
          { specialty: 'Internal Medicine', percentage: 5 }
        ],
        stats: {
          avgPatientAge: 58,
          maleFemaleRatio: 1.2,
          regionalVariation: true
        }
      },
      { 
        id: '2', 
        name: 'Type 2 Diabetes', 
        description: 'Metabolic disorder characterized by high blood sugar levels.',
        prevalence: 860,
        annualGrowth: 3.1,
        relatedMedications: [
          { id: 'm4', name: 'Metformin', prescriptionRate: 65, category: 'Biguanide' },
          { id: 'm5', name: 'Glipizide', prescriptionRate: 22, category: 'Sulfonylurea' },
          { id: 'm6', name: 'Insulin Glargine', prescriptionRate: 18, category: 'Insulin' }
        ],
        specialtyDistribution: [
          { specialty: 'Primary Care', percentage: 55 },
          { specialty: 'Endocrinology', percentage: 35 },
          { specialty: 'Internal Medicine', percentage: 10 }
        ],
        stats: {
          avgPatientAge: 62,
          maleFemaleRatio: 0.9,
          regionalVariation: true
        }
      },
      { 
        id: '3', 
        name: 'Asthma', 
        description: 'Chronic condition affecting the airways and breathing.',
        prevalence: 790,
        annualGrowth: 1.5,
        relatedMedications: [
          { id: 'm7', name: 'Albuterol', prescriptionRate: 72, category: 'Bronchodilator' },
          { id: 'm8', name: 'Fluticasone', prescriptionRate: 45, category: 'Corticosteroid' },
          { id: 'm9', name: 'Montelukast', prescriptionRate: 28, category: 'Leukotriene Modifier' }
        ],
        specialtyDistribution: [
          { specialty: 'Primary Care', percentage: 50 },
          { specialty: 'Pulmonology', percentage: 35 },
          { specialty: 'Allergy & Immunology', percentage: 15 }
        ],
        stats: {
          avgPatientAge: 34,
          maleFemaleRatio: 0.8,
          regionalVariation: true
        }
      },
      { 
        id: '4', 
        name: 'Rheumatoid Arthritis', 
        description: 'Autoimmune disorder causing joint inflammation and pain.',
        prevalence: 410,
        annualGrowth: 1.2,
        relatedMedications: [
          { id: 'm10', name: 'Methotrexate', prescriptionRate: 60, category: 'DMARD' },
          { id: 'm11', name: 'Adalimumab', prescriptionRate: 35, category: 'Biologic' },
          { id: 'm12', name: 'Prednisone', prescriptionRate: 40, category: 'Corticosteroid' }
        ],
        specialtyDistribution: [
          { specialty: 'Rheumatology', percentage: 65 },
          { specialty: 'Primary Care', percentage: 20 },
          { specialty: 'Internal Medicine', percentage: 15 }
        ],
        stats: {
          avgPatientAge: 55,
          maleFemaleRatio: 0.3,  // more common in women
          regionalVariation: false
        }
      },
      { 
        id: '5', 
        name: 'Depression', 
        description: 'Mental health disorder characterized by persistent sadness and loss of interest.',
        prevalence: 970,
        annualGrowth: 4.5,
        relatedMedications: [
          { id: 'm13', name: 'Sertraline', prescriptionRate: 45, category: 'SSRI' },
          { id: 'm14', name: 'Escitalopram', prescriptionRate: 30, category: 'SSRI' },
          { id: 'm15', name: 'Bupropion', prescriptionRate: 25, category: 'NDRI' }
        ],
        specialtyDistribution: [
          { specialty: 'Psychiatry', percentage: 40 },
          { specialty: 'Primary Care', percentage: 45 },
          { specialty: 'Psychology', percentage: 15 }
        ],
        stats: {
          avgPatientAge: 42,
          maleFemaleRatio: 0.5,  // more common in women
          regionalVariation: false
        }
      }
    ];

  // Filter based on search
  const filteredConditions = conditionsWithDefaults.filter(condition => 
    condition.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (condition.description && condition.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
              <p>The conditions explorer is under development. Check back soon for more detailed condition data and analysis tools!</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <FileText className="h-6 w-6 text-primary-500 mr-2" />
            <h1 className="text-2xl font-bold text-gray-900">Medical Conditions</h1>
          </div>
          <Button variant="default" leftIcon={<Plus className="h-4 w-4" />}>
            Add Condition
          </Button>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <Input
            placeholder="Search conditions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="h-4 w-4 text-gray-400" />}
            fullWidth
          />
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <ul className="divide-y divide-gray-200">
          {filteredConditions.map((condition) => (
            <li key={condition.id} className="p-6">
              <div className="flex flex-col">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="bg-primary-50 p-2 rounded-lg">
                      <Heart className="h-5 w-5 text-primary-500" />
                    </div>
                  </div>
                  <div className="ml-4 flex-grow">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{condition.name}</h3>
                        {condition.description && (
                          <p className="mt-1 text-sm text-gray-500">{condition.description}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {condition.prevalence && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {condition.prevalence} per 100k
                          </span>
                        )}
                        {condition.annualGrowth && (
                          <span className={cn(
                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                            condition.annualGrowth > 3 
                              ? "bg-red-100 text-red-800" 
                              : condition.annualGrowth > 1 
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-green-100 text-green-800"
                          )}>
                            <TrendingUp className="h-3 w-3 mr-1" /> {condition.annualGrowth}%
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-4">
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<Activity className="h-4 w-4" />}
                        onClick={() => toggleExpanded(condition.id)}
                      >
                        {expandedConditionId === condition.id ? 'Hide Details' : 'View Details'}
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* Expanded details section */}
                {expandedConditionId === condition.id && (
                  <div className="mt-4 bg-gray-50 rounded-lg p-4">
                    {/* Tabs navigation */}
                    <div className="border-b border-gray-200">
                      <nav className="-mb-px flex space-x-4">
                        <button
                          onClick={() => setActiveTab('stats')}
                          className={cn(
                            "px-3 py-2 text-sm font-medium border-b-2 focus:outline-none",
                            activeTab === 'stats'
                              ? "border-primary-500 text-primary-600"
                              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                          )}
                        >
                          <BarChart2 className="inline-block h-4 w-4 mr-1" />
                          Statistics
                        </button>
                        <button
                          onClick={() => setActiveTab('medications')}
                          className={cn(
                            "px-3 py-2 text-sm font-medium border-b-2 focus:outline-none",
                            activeTab === 'medications'
                              ? "border-primary-500 text-primary-600"
                              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                          )}
                        >
                          <Pill className="inline-block h-4 w-4 mr-1" />
                          Related Medications
                        </button>
                        <button
                          onClick={() => setActiveTab('specialties')}
                          className={cn(
                            "px-3 py-2 text-sm font-medium border-b-2 focus:outline-none",
                            activeTab === 'specialties'
                              ? "border-primary-500 text-primary-600"
                              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                          )}
                        >
                          <UserCheck className="inline-block h-4 w-4 mr-1" />
                          Treating Specialties
                        </button>
                      </nav>
                    </div>
                    
                    {/* Tab content */}
                    <div className="mt-4">
                      {/* Statistics tab */}
                      {activeTab === 'stats' && (
                        <>
                          {condition.stats ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="bg-white p-4 rounded-lg shadow-sm">
                                <div className="flex items-center">
                                  <div className="p-2 rounded-full bg-blue-100">
                                    <Users className="h-5 w-5 text-blue-600" />
                                  </div>
                                  <div className="ml-3">
                                    <p className="text-sm font-medium text-gray-700">Average Patient Age</p>
                                    <p className="text-xl font-semibold text-gray-900">{condition.stats.avgPatientAge} years</p>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="bg-white p-4 rounded-lg shadow-sm">
                                <div className="flex items-center">
                                  <div className="p-2 rounded-full bg-purple-100">
                                    <PieChart className="h-5 w-5 text-purple-600" />
                                  </div>
                                  <div className="ml-3">
                                    <p className="text-sm font-medium text-gray-700">Gender Distribution</p>
                                    <p className="text-xl font-semibold text-gray-900">
                                      {condition.stats.maleFemaleRatio !== undefined 
                                        ? (condition.stats.maleFemaleRatio > 1 
                                          ? `${Math.round(condition.stats.maleFemaleRatio * 100)}% Male predominant`
                                          : condition.stats.maleFemaleRatio === 1
                                            ? 'Equal gender distribution'
                                            : `${Math.round((1 - condition.stats.maleFemaleRatio) * 100)}% Female predominant`)
                                        : 'Not available'
                                      }
                                    </p>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="bg-white p-4 rounded-lg shadow-sm">
                                <div className="flex items-center">
                                  <div className="p-2 rounded-full bg-green-100">
                                    <Globe className="h-5 w-5 text-green-600" />
                                  </div>
                                  <div className="ml-3">
                                    <p className="text-sm font-medium text-gray-700">Regional Variation</p>
                                    <p className="text-xl font-semibold text-gray-900">
                                      {condition.stats.regionalVariation ? 'Significant' : 'Minimal'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
                              <BarChart2 className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                              <h3 className="text-lg font-medium text-gray-700 mb-1">No Statistics Available</h3>
                              <p className="text-sm text-gray-500">
                                Statistical data for {condition.name} is not available at this time.
                              </p>
                            </div>
                          )}
                        </>
                      )}
                      
                      {/* Related Medications tab */}
                      {activeTab === 'medications' && (
                        <>
                          {condition.relatedMedications && condition.relatedMedications.length > 0 ? (
                            <div>
                              <p className="text-sm text-gray-500 mb-4">
                                Most commonly prescribed medications for {condition.name}
                              </p>
                              <ul className="divide-y divide-gray-200">
                                {condition.relatedMedications.map((medication) => (
                                  <li key={medication.id} className="py-3 flex items-center justify-between">
                                    <div className="flex items-center">
                                      <Pill className="h-5 w-5 text-primary-500 mr-2" />
                                      <div>
                                        <p className="text-sm font-medium text-gray-900">{medication.name}</p>
                                        <p className="text-xs text-gray-500">{medication.category}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center">
                                      <div className="w-24 bg-gray-200 rounded-full h-2.5">
                                        <div 
                                          className="bg-primary-500 h-2.5 rounded-full" 
                                          style={{ width: `${medication.prescriptionRate}%` }}
                                        ></div>
                                      </div>
                                      <span className="ml-2 text-xs text-gray-500">{medication.prescriptionRate}%</span>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : (
                            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
                              <Pill className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                              <h3 className="text-lg font-medium text-gray-700 mb-1">No Medication Data</h3>
                              <p className="text-sm text-gray-500">
                                Related medication information for {condition.name} is not available at this time.
                              </p>
                            </div>
                          )}
                        </>
                      )}
                      
                      {/* Treating Specialties tab */}
                      {activeTab === 'specialties' && (
                        <>
                          {condition.specialtyDistribution && condition.specialtyDistribution.length > 0 ? (
                            <div>
                              <p className="text-sm text-gray-500 mb-4">
                                Specialty distribution for treating {condition.name}
                              </p>
                              <ul className="divide-y divide-gray-200">
                                {condition.specialtyDistribution.map((specialty, index) => (
                                  <li key={index} className="py-3 flex items-center justify-between">
                                    <div className="flex items-center">
                                      <UserCheck className="h-5 w-5 text-primary-500 mr-2" />
                                      <p className="text-sm font-medium text-gray-900">{specialty.specialty}</p>
                                    </div>
                                    <div className="flex items-center">
                                      <div className="w-24 bg-gray-200 rounded-full h-2.5">
                                        <div 
                                          className="bg-primary-500 h-2.5 rounded-full" 
                                          style={{ width: `${specialty.percentage}%` }}
                                        ></div>
                                      </div>
                                      <span className="ml-2 text-xs text-gray-500">{specialty.percentage}%</span>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : (
                            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
                              <UserCheck className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                              <h3 className="text-lg font-medium text-gray-700 mb-1">No Specialty Data</h3>
                              <p className="text-sm text-gray-500">
                                Specialty distribution information for {condition.name} is not available at this time.
                              </p>
                            </div>
                          )}
                        </>
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
