import React, { useState } from 'react';
import { useAppSelector } from '../../hooks';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { 
  Pill, 
  Search,
  Plus,
  Filter,
  Activity,
  Beaker,
  Box,
  RefreshCw,
  TrendingUp,
  Users,
  Heart,
  ArrowRightLeft,
  Activity as ActivityIcon,
  BarChart2
} from 'lucide-react';
import { cn } from '../../utils/cn';

// Interface for alternative medications
interface AlternativeMedication {
  id: string;
  name: string;
  category: string;
  relativeCost: number; // 1-10 scale
  similarityScore: number; // percentage
}

// Interface for related conditions
interface RelatedCondition {
  id: string;
  name: string;
  prescriptionRate: number; // percentage of the time this medication is prescribed for this condition
}

// Interface for prescriber specialties
interface PrescriberSpecialty {
  specialty: string;
  percentage: number;
}

// Enhanced medication interface with statistics and related data
interface EnhancedMedication {
  id: string;
  name: string;
  category: string;
  description?: string;
  monthlyPrescriptions?: number;
  annualGrowth?: number; // percentage
  formulations?: string[]; // e.g., "Tablet", "Capsule", "Injection"
  alternativeMedications?: AlternativeMedication[];
  relatedConditions?: RelatedCondition[];
  prescriberSpecialties?: PrescriberSpecialty[];
  stats?: {
    marketShare?: number; // percentage
    patientDemographics?: {
      averageAge?: number;
      genderRatio?: number; // Male/Female ratio, higher means more male
    };
    averageDailyDose?: string;
    adherenceRate?: number; // percentage
  };
}

export function MedicationsList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedMedicationId, setExpandedMedicationId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'stats' | 'alternatives' | 'conditions'>('stats');

  // Get medications with type assertion
  const medications = useAppSelector(state => {
    const refData = state.referenceData as { medications: any[] };
    return refData.medications || [];
  });

  // Toggle expanded view for a medication
  const toggleExpanded = (medicationId: string) => {
    if (expandedMedicationId === medicationId) {
      setExpandedMedicationId(null);
    } else {
      setExpandedMedicationId(medicationId);
      setActiveTab('stats'); // Reset to stats tab when expanding
    }
  };

  // Enhanced placeholder data with statistics and related items
  const medicationsWithDefaults: EnhancedMedication[] = medications.length > 0 ? 
    medications : 
    [
      { 
        id: '1', 
        name: 'Lisinopril', 
        category: 'ACE Inhibitor', 
        description: 'Used to treat high blood pressure and heart failure.',
        monthlyPrescriptions: 2450000,
        annualGrowth: 3.2,
        formulations: ['Tablet', 'Oral Solution'],
        alternativeMedications: [
          { id: 'a1', name: 'Enalapril', category: 'ACE Inhibitor', relativeCost: 1.2, similarityScore: 92 },
          { id: 'a2', name: 'Losartan', category: 'ARB', relativeCost: 2.4, similarityScore: 85 },
          { id: 'a3', name: 'Amlodipine', category: 'Calcium Channel Blocker', relativeCost: 1.8, similarityScore: 78 }
        ],
        relatedConditions: [
          { id: 'c1', name: 'Hypertension', prescriptionRate: 65 },
          { id: 'c2', name: 'Heart Failure', prescriptionRate: 25 },
          { id: 'c3', name: 'Diabetic Nephropathy', prescriptionRate: 10 }
        ],
        prescriberSpecialties: [
          { specialty: 'Primary Care', percentage: 55 },
          { specialty: 'Cardiology', percentage: 35 },
          { specialty: 'Nephrology', percentage: 10 }
        ],
        stats: {
          marketShare: 28.5,
          patientDemographics: {
            averageAge: 62,
            genderRatio: 1.1 // slightly more males
          },
          averageDailyDose: '10-20mg',
          adherenceRate: 72
        }
      },
      { 
        id: '2', 
        name: 'Metformin', 
        category: 'Biguanide', 
        description: 'Used to treat type 2 diabetes.',
        monthlyPrescriptions: 1850000,
        annualGrowth: 5.4,
        formulations: ['Tablet', 'Extended-Release Tablet'],
        alternativeMedications: [
          { id: 'a4', name: 'Glipizide', category: 'Sulfonylurea', relativeCost: 1.3, similarityScore: 75 },
          { id: 'a5', name: 'Pioglitazone', category: 'Thiazolidinedione', relativeCost: 3.6, similarityScore: 68 },
          { id: 'a6', name: 'Empagliflozin', category: 'SGLT2 Inhibitor', relativeCost: 8.4, similarityScore: 62 }
        ],
        relatedConditions: [
          { id: 'c2', name: 'Type 2 Diabetes', prescriptionRate: 85 },
          { id: 'c3', name: 'Prediabetes', prescriptionRate: 10 },
          { id: 'c4', name: 'Polycystic Ovary Syndrome', prescriptionRate: 5 }
        ],
        prescriberSpecialties: [
          { specialty: 'Primary Care', percentage: 65 },
          { specialty: 'Endocrinology', percentage: 30 },
          { specialty: 'Internal Medicine', percentage: 5 }
        ],
        stats: {
          marketShare: 42.3,
          patientDemographics: {
            averageAge: 58,
            genderRatio: 0.9 // slightly more females
          },
          averageDailyDose: '1000-2000mg',
          adherenceRate: 68
        }
      },
      { 
        id: '3', 
        name: 'Atorvastatin', 
        category: 'Statin', 
        description: 'Used to lower cholesterol levels in the blood.',
        monthlyPrescriptions: 2150000,
        annualGrowth: 1.8,
        formulations: ['Tablet'],
        alternativeMedications: [
          { id: 'a7', name: 'Rosuvastatin', category: 'Statin', relativeCost: 2.8, similarityScore: 94 },
          { id: 'a8', name: 'Simvastatin', category: 'Statin', relativeCost: 0.6, similarityScore: 88 },
          { id: 'a9', name: 'Ezetimibe', category: 'Cholesterol Absorption Inhibitor', relativeCost: 5.2, similarityScore: 58 }
        ],
        relatedConditions: [
          { id: 'c5', name: 'Hyperlipidemia', prescriptionRate: 72 },
          { id: 'c1', name: 'Coronary Artery Disease', prescriptionRate: 15 },
          { id: 'c6', name: 'Stroke Prevention', prescriptionRate: 8 },
          { id: 'c7', name: 'Diabetes with CV Risk', prescriptionRate: 5 }
        ],
        prescriberSpecialties: [
          { specialty: 'Primary Care', percentage: 60 },
          { specialty: 'Cardiology', percentage: 30 },
          { specialty: 'Endocrinology', percentage: 10 }
        ],
        stats: {
          marketShare: 38.6,
          patientDemographics: {
            averageAge: 65,
            genderRatio: 1.0 // equal distribution
          },
          averageDailyDose: '10-40mg',
          adherenceRate: 65
        }
      },
      { 
        id: '4', 
        name: 'Levothyroxine', 
        category: 'Thyroid Medication', 
        description: 'Used to treat hypothyroidism.',
        monthlyPrescriptions: 1620000,
        annualGrowth: 0.5,
        formulations: ['Tablet', 'Capsule', 'Oral Solution'],
        alternativeMedications: [
          { id: 'a10', name: 'Liothyronine', category: 'Thyroid Medication', relativeCost: 5.8, similarityScore: 82 },
          { id: 'a11', name: 'Desiccated Thyroid', category: 'Thyroid Medication', relativeCost: 3.2, similarityScore: 75 }
        ],
        relatedConditions: [
          { id: 'c8', name: 'Hypothyroidism', prescriptionRate: 92 },
          { id: 'c9', name: 'Thyroid Cancer (post-treatment)', prescriptionRate: 6 },
          { id: 'c10', name: 'Goiter', prescriptionRate: 2 }
        ],
        prescriberSpecialties: [
          { specialty: 'Primary Care', percentage: 55 },
          { specialty: 'Endocrinology', percentage: 40 },
          { specialty: 'Internal Medicine', percentage: 5 }
        ],
        stats: {
          marketShare: 95.2,
          patientDemographics: {
            averageAge: 52,
            genderRatio: 0.3 // many more females
          },
          averageDailyDose: '50-100mcg',
          adherenceRate: 78
        }
      },
      { 
        id: '5', 
        name: 'Sertraline', 
        category: 'SSRI', 
        description: 'Used to treat depression, panic attacks, and anxiety disorders.',
        monthlyPrescriptions: 1380000,
        annualGrowth: 2.8,
        formulations: ['Tablet', 'Oral Solution'],
        alternativeMedications: [
          { id: 'a12', name: 'Escitalopram', category: 'SSRI', relativeCost: 1.6, similarityScore: 90 },
          { id: 'a13', name: 'Fluoxetine', category: 'SSRI', relativeCost: 0.8, similarityScore: 85 },
          { id: 'a14', name: 'Venlafaxine', category: 'SNRI', relativeCost: 1.2, similarityScore: 75 },
          { id: 'a15', name: 'Bupropion', category: 'NDRI', relativeCost: 1.8, similarityScore: 62 }
        ],
        relatedConditions: [
          { id: 'c11', name: 'Depression', prescriptionRate: 58 },
          { id: 'c12', name: 'Generalized Anxiety Disorder', prescriptionRate: 25 },
          { id: 'c13', name: 'Panic Disorder', prescriptionRate: 8 },
          { id: 'c14', name: 'OCD', prescriptionRate: 5 },
          { id: 'c15', name: 'PTSD', prescriptionRate: 4 }
        ],
        prescriberSpecialties: [
          { specialty: 'Primary Care', percentage: 50 },
          { specialty: 'Psychiatry', percentage: 45 },
          { specialty: 'Neurology', percentage: 5 }
        ],
        stats: {
          marketShare: 32.1,
          patientDemographics: {
            averageAge: 42,
            genderRatio: 0.6 // more females
          },
          averageDailyDose: '50-100mg',
          adherenceRate: 62
        }
      }
    ];

  // Extract unique categories
  const categories = [...new Set(medicationsWithDefaults.map(med => med.category))];
  
  // Filter based on search and category
  const filteredMedications = medicationsWithDefaults.filter(medication => {
    const matchesSearch = searchQuery === '' || 
      medication.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (medication.description && medication.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = categoryFilter === '' || medication.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const categoryOptions = [
    { value: '', label: 'All Categories' },
    ...categories.map(category => ({ value: category, label: category }))
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
              <p>The medications database is under development. Check back soon for more detailed medication data and analysis tools!</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Pill className="h-6 w-6 text-primary-500 mr-2" />
            <h1 className="text-2xl font-bold text-gray-900">Medications</h1>
          </div>
          <Button variant="default" leftIcon={<Plus className="h-4 w-4" />}>
            Add Medication
          </Button>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search medications..."
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
                label="Category"
                options={categoryOptions}
                value={categoryFilter}
                onChange={(value) => setCategoryFilter(value)}
              />
            </div>
          )}
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <ul className="divide-y divide-gray-200">
          {filteredMedications.map((medication) => (
            <li key={medication.id} className="p-6">
              <div className="flex flex-col">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="bg-primary-50 p-2 rounded-lg">
                      <Beaker className="h-5 w-5 text-primary-500" />
                    </div>
                  </div>
                  <div className="ml-4 flex-grow">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center">
                          <h3 className="text-lg font-medium text-gray-900">{medication.name}</h3>
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {medication.category}
                          </span>
                        </div>
                        {medication.description && (
                          <p className="mt-1 text-sm text-gray-500">{medication.description}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {medication.monthlyPrescriptions && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {(medication.monthlyPrescriptions / 1000000).toFixed(1)}M monthly scripts
                          </span>
                        )}
                        {medication.annualGrowth && (
                          <span className={cn(
                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                            medication.annualGrowth > 3 
                              ? "bg-green-100 text-green-800" 
                              : medication.annualGrowth > 1 
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                          )}>
                            <TrendingUp className="h-3 w-3 mr-1" /> {medication.annualGrowth}%
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-4">
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<Activity className="h-4 w-4" />}
                        onClick={() => toggleExpanded(medication.id)}
                      >
                        {expandedMedicationId === medication.id ? 'Hide Details' : 'View Details'}
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* Expanded details section */}
                {expandedMedicationId === medication.id && (
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
                          onClick={() => setActiveTab('alternatives')}
                          className={cn(
                            "px-3 py-2 text-sm font-medium border-b-2 focus:outline-none",
                            activeTab === 'alternatives'
                              ? "border-primary-500 text-primary-600"
                              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                          )}
                        >
                          <ArrowRightLeft className="inline-block h-4 w-4 mr-1" />
                          Alternative Medications
                        </button>
                        <button
                          onClick={() => setActiveTab('conditions')}
                          className={cn(
                            "px-3 py-2 text-sm font-medium border-b-2 focus:outline-none",
                            activeTab === 'conditions'
                              ? "border-primary-500 text-primary-600"
                              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                          )}
                        >
                          <Heart className="inline-block h-4 w-4 mr-1" />
                          Related Conditions
                        </button>
                      </nav>
                    </div>
                    
                    {/* Tab content */}
                    <div className="mt-4">
                      {/* Statistics tab */}
                      {activeTab === 'stats' && (
                        <>
                          {medication.stats ? (
                            <div className="space-y-6">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-white p-4 rounded-lg shadow-sm">
                                  <div className="flex items-center">
                                    <div className="p-2 rounded-full bg-blue-100">
                                      <BarChart2 className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div className="ml-3">
                                      <p className="text-sm font-medium text-gray-700">Market Share</p>
                                      <p className="text-xl font-semibold text-gray-900">{medication.stats.marketShare}%</p>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="bg-white p-4 rounded-lg shadow-sm">
                                  <div className="flex items-center">
                                    <div className="p-2 rounded-full bg-green-100">
                                      <Box className="h-5 w-5 text-green-600" />
                                    </div>
                                    <div className="ml-3">
                                      <p className="text-sm font-medium text-gray-700">Typical Dose</p>
                                      <p className="text-xl font-semibold text-gray-900">{medication.stats.averageDailyDose}</p>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="bg-white p-4 rounded-lg shadow-sm">
                                  <div className="flex items-center">
                                    <div className="p-2 rounded-full bg-purple-100">
                                      <ActivityIcon className="h-5 w-5 text-purple-600" />
                                    </div>
                                    <div className="ml-3">
                                      <p className="text-sm font-medium text-gray-700">Adherence Rate</p>
                                      <p className="text-xl font-semibold text-gray-900">{medication.stats.adherenceRate}%</p>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {medication.formulations && medication.formulations.length > 0 && (
                                <div className="bg-white p-4 rounded-lg shadow-sm">
                                  <h4 className="font-medium text-gray-900 mb-2">Available Formulations</h4>
                                  <div className="flex flex-wrap gap-2">
                                    {medication.formulations.map((form, idx) => (
                                      <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                        {form}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {medication.stats.patientDemographics && (
                                <div className="bg-white p-4 rounded-lg shadow-sm">
                                  <h4 className="font-medium text-gray-900 mb-2">Patient Demographics</h4>
                                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                                    <div className="sm:col-span-1">
                                      <dt className="text-sm font-medium text-gray-500">Average Patient Age</dt>
                                      <dd className="mt-1 text-sm text-gray-900">{medication.stats.patientDemographics.averageAge} years</dd>
                                    </div>
                                    <div className="sm:col-span-1">
                                      <dt className="text-sm font-medium text-gray-500">Gender Distribution</dt>
                                      <dd className="mt-1 text-sm text-gray-900">
                                        {medication.stats.patientDemographics.genderRatio !== undefined 
                                          ? (medication.stats.patientDemographics.genderRatio > 1 
                                            ? `Predominantly male (${Math.round(medication.stats.patientDemographics.genderRatio * 100)}%)`
                                            : medication.stats.patientDemographics.genderRatio === 1
                                              ? 'Equal gender distribution'
                                              : `Predominantly female (${Math.round((1 - medication.stats.patientDemographics.genderRatio) * 100)}%)`)
                                          : 'Not available'
                                        }
                                      </dd>
                                    </div>
                                  </dl>
                                </div>
                              )}
                              
                              {medication.prescriberSpecialties && medication.prescriberSpecialties.length > 0 && (
                                <div className="bg-white p-4 rounded-lg shadow-sm">
                                  <h4 className="font-medium text-gray-900 mb-2">Prescriber Specialties</h4>
                                  <ul className="divide-y divide-gray-200">
                                    {medication.prescriberSpecialties.map((specialty, idx) => (
                                      <li key={idx} className="py-2 flex items-center justify-between">
                                        <span className="text-sm text-gray-800">{specialty.specialty}</span>
                                        <div className="flex items-center">
                                          <div className="w-32 bg-gray-200 rounded-full h-2">
                                            <div 
                                              className="bg-primary-500 h-2 rounded-full" 
                                              style={{ width: `${specialty.percentage}%` }}
                                            ></div>
                                          </div>
                                          <span className="ml-2 text-xs text-gray-500">{specialty.percentage}%</span>
                                        </div>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
                              <BarChart2 className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                              <h3 className="text-lg font-medium text-gray-700 mb-1">No Statistics Available</h3>
                              <p className="text-sm text-gray-500">
                                Statistical data for {medication.name} is not available at this time.
                              </p>
                            </div>
                          )}
                        </>
                      )}
                      
                      {/* Alternatives tab */}
                      {activeTab === 'alternatives' && (
                        <>
                          {medication.alternativeMedications && medication.alternativeMedications.length > 0 ? (
                            <div>
                              <p className="text-sm text-gray-500 mb-4">
                                Alternative medications for {medication.name}
                              </p>
                              <div className="space-y-4">
                                {medication.alternativeMedications.map((alt) => (
                                  <div key={alt.id} className="bg-white p-4 rounded-lg shadow-sm">
                                    <div className="flex items-start justify-between">
                                      <div className="flex items-center">
                                        <div className="p-2 bg-blue-50 rounded-lg">
                                          <Pill className="h-4 w-4 text-blue-500" />
                                        </div>
                                        <div className="ml-3">
                                          <p className="text-sm font-medium text-gray-900">{alt.name}</p>
                                          <p className="text-xs text-gray-500">{alt.category}</p>
                                        </div>
                                      </div>
                                      <div className="flex items-center space-x-4">
                                        <div className="flex flex-col items-end">
                                          <span className="text-xs text-gray-500">Similarity</span>
                                          <span className="text-sm font-medium text-gray-900">{alt.similarityScore}%</span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                          <span className="text-xs text-gray-500">Relative Cost</span>
                                          <span className={cn(
                                            "text-sm font-medium",
                                            alt.relativeCost > 2 ? "text-red-600" : 
                                            alt.relativeCost < 0.8 ? "text-green-600" : "text-gray-900"
                                          )}>
                                            {alt.relativeCost < 1 ? 'Lower' : alt.relativeCost > 1 ? 'Higher' : 'Similar'}
                                            {alt.relativeCost !== 1 && ` (${alt.relativeCost}x)`}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
                              <ArrowRightLeft className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                              <h3 className="text-lg font-medium text-gray-700 mb-1">No Alternatives Available</h3>
                              <p className="text-sm text-gray-500">
                                Alternative medication information for {medication.name} is not available at this time.
                              </p>
                            </div>
                          )}
                        </>
                      )}
                      
                      {/* Related Conditions tab */}
                      {activeTab === 'conditions' && (
                        <>
                          {medication.relatedConditions && medication.relatedConditions.length > 0 ? (
                            <div>
                              <p className="text-sm text-gray-500 mb-4">
                                Common conditions treated with {medication.name}
                              </p>
                              <ul className="divide-y divide-gray-200">
                                {medication.relatedConditions.map((condition, index) => (
                                  <li key={index} className="py-3 flex items-center justify-between">
                                    <div className="flex items-center">
                                      <Heart className="h-5 w-5 text-primary-500 mr-2" />
                                      <p className="text-sm font-medium text-gray-900">{condition.name}</p>
                                    </div>
                                    <div className="flex items-center">
                                      <div className="w-32 bg-gray-200 rounded-full h-2.5">
                                        <div 
                                          className="bg-primary-500 h-2.5 rounded-full" 
                                          style={{ width: `${condition.prescriptionRate}%` }}
                                        ></div>
                                      </div>
                                      <span className="ml-2 text-xs text-gray-500">{condition.prescriptionRate}%</span>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : (
                            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
                              <Heart className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                              <h3 className="text-lg font-medium text-gray-700 mb-1">No Condition Data</h3>
                              <p className="text-sm text-gray-500">
                                Related condition information for {medication.name} is not available at this time.
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
