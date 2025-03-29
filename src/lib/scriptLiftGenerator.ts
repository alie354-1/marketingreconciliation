import { Medication, ScriptLiftAnalysis, Campaign } from '../types';

/**
 * Script Lift Generator
 * 
 * This utility generates realistic script lift data for medications
 * based on campaign parameters. It shows different patterns for 
 * targeted medications vs competitors in the same category.
 */

// Helper function to generate a deterministic random number within a range
function deterministicRandom(seed: string, min: number, max: number): number {
  // Create a simple hash of the seed string
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  
  // Use the hash to generate a value between 0 and 1
  const normalizedHash = Math.abs(hash) / 2147483647;
  
  // Scale to the requested range
  return min + normalizedHash * (max - min);
}

/**
 * Determine if a medication is targeted by the campaign
 */
function isMedicationTargeted(medication: Medication, campaign: Campaign): boolean {
  // Check if the medication ID is explicitly targeted
  if (campaign.target_medication_id === medication.id) {
    return true;
  }
  
  // If the campaign targets a medication category and this medication is in that category
  if (campaign.targeting_metadata?.medicationCategory === medication.category) {
    return true;
  }
  
  // Default to not targeted
  return false;
}

/**
 * Generate script lift data for a single medication
 */
export function generateMedicationScriptLift(
  medication: Medication, 
  campaign: Campaign,
  isTargeted: boolean = isMedicationTargeted(medication, campaign)
): ScriptLiftAnalysis {
  const seedBase = `${campaign.id}-${medication.id}-scriptlift`;
  
  // Baseline prescriptions (200-1000, depending on medication popularity)
  // We could enhance this to reflect real-world market share
  const baseline = Math.round(deterministicRandom(`${seedBase}-baseline`, 200, 1000));
  
  // Different lift percentage ranges for targeted vs. non-targeted medications
  let liftPercentage: number;
  
  if (isTargeted) {
    // Targeted medications show impressive gains (30-45%)
    liftPercentage = parseFloat(
      deterministicRandom(`${seedBase}-lift-targeted`, 30, 45).toFixed(1)
    );
  } else if (medication.category === 'competitors') {
    // Direct competitors may show negative trends (-10 to +5%)
    liftPercentage = parseFloat(
      deterministicRandom(`${seedBase}-lift-competitor`, -10, 5).toFixed(1)
    );
  } else {
    // Other medications in same category show modest gains (5-15%)
    liftPercentage = parseFloat(
      deterministicRandom(`${seedBase}-lift-same-category`, 5, 15).toFixed(1)
    );
  }
  
  // Calculate projected prescriptions
  const projected = Math.round(baseline * (1 + liftPercentage / 100));
  
  // Confidence score (60-95%)
  // Higher for targeted medications
  const confidenceScore = Math.round(
    deterministicRandom(
      `${seedBase}-confidence`, 
      isTargeted ? 80 : 60, 
      isTargeted ? 95 : 85
    )
  );
  
  // Time period string
  const timePeriod = "Last 90 Days";
  
  return {
    medication: {
      id: medication.id,
      name: medication.name
    },
    baseline,
    projected,
    liftPercentage,
    confidenceScore,
    timePeriod
  };
}

/**
 * Generate comparison data for other medications
 */
function generateComparisonData(
  allMedications: Medication[], 
  campaign: Campaign, 
  currentMedicationId: string
): Array<{ name: string, liftPercentage: number }> {
  // Get medications in the same category (excluding current one)
  return allMedications
    .filter(med => med.id !== currentMedicationId)
    .slice(0, 5) // Limit to 5 for comparison
    .map(med => {
      const isTargeted = isMedicationTargeted(med, campaign);
      const seedBase = `${campaign.id}-${med.id}-comparison`;
      
      let liftPercentage: number;
      if (isTargeted) {
        liftPercentage = parseFloat(
          deterministicRandom(`${seedBase}-lift`, 25, 40).toFixed(1)
        );
      } else if (med.category === 'competitors') {
        liftPercentage = parseFloat(
          deterministicRandom(`${seedBase}-lift`, -8, 3).toFixed(1)
        );
      } else {
        liftPercentage = parseFloat(
          deterministicRandom(`${seedBase}-lift`, 3, 12).toFixed(1)
        );
      }
      
      return {
        name: med.name,
        liftPercentage
      };
    });
}

/**
 * Generate script lift analysis for all medications in a category
 */
export function generateCategoryScriptLiftData(
  medications: Medication[], 
  campaign: Campaign,
  category?: string
): ScriptLiftAnalysis[] {
  // Filter to medications in specified category if provided
  const categoryMedications = category 
    ? medications.filter(med => med.category === category)
    : medications;
  
  return categoryMedications.map(medication => {
    const isTargeted = isMedicationTargeted(medication, campaign);
    
    // Generate base script lift data for this medication
    const baseLiftData = generateMedicationScriptLift(medication, campaign, isTargeted);
    
    // Add comparison data for other medications in the same category
    const comparisonData = generateComparisonData(categoryMedications, campaign, medication.id);
    
    return {
      ...baseLiftData,
      comparisonData
    };
  });
}

/**
 * Generate script lift data for targeted and related medications
 * Returns script lift data organized by medication categories
 */
export function generateCampaignScriptLiftData(
  allMedications: Medication[], 
  campaign: Campaign
): Record<string, ScriptLiftAnalysis[]> {
  // Get any specifically targeted medication
  const targetedMedicationId = campaign.target_medication_id;
  const targetedMedication = targetedMedicationId 
    ? allMedications.find(med => med.id === targetedMedicationId)
    : undefined;
  
  // Get the targeted category (from targeted medication or campaign metadata)
  const targetCategory = targetedMedication?.category || 
    (campaign.targeting_metadata?.medicationCategory as string);
  
  if (!targetCategory) {
    // If no category can be determined, use the first medication's category
    // as a fallback to prevent errors
    const fallbackCategory = allMedications[0]?.category;
    if (!fallbackCategory) {
      // If still no category, return empty result
      return {};
    }
    console.warn(`No target category found for campaign ${campaign.id}, using fallback: ${fallbackCategory}`);
    return {
      [fallbackCategory]: generateCategoryScriptLiftData(
        allMedications.filter(med => med.category === fallbackCategory), 
        campaign
      )
    };
  }
  
  // Get all medications in the targeted category
  const categoryMedications = allMedications.filter(med => med.category === targetCategory);
  
  // Generate lift data for these medications
  const categoryLiftData = generateCategoryScriptLiftData(categoryMedications, campaign);
  
  // Also get some competitor medications if available
  const competitorMedications = allMedications.filter(med => med.category === 'competitors');
  const competitorLiftData = competitorMedications.length > 0
    ? generateCategoryScriptLiftData(competitorMedications, campaign)
    : [];
  
  // Return lift data organized by category
  const result: Record<string, ScriptLiftAnalysis[]> = {
    [targetCategory]: categoryLiftData,
  };
  
  if (competitorLiftData.length > 0) {
    result['competitors'] = competitorLiftData;
  }
  
  return result;
}
