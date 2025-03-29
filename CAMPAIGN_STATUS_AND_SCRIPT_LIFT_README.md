# Campaign Status Automation & Prescription Tracking

This document outlines the implementation of two key features:
1. Automatic campaign status updates based on date ranges (now required)
2. Comprehensive prescription tracking to measure prescribing behavior changes

## Campaign Status Automation

Campaign statuses now automatically update based on their configured start and end dates:

- **Draft** → Status remains draft until manually activated
- **Active** → Automatically set when current date is between start and end date
- **Completed** → Automatically set when current date is past the end date

This automation happens in three places:

### 1. Client-Side Automation (React/Redux)

The `updateCampaignStatus` and `updateCampaignStatuses` functions in `src/lib/campaignUtils.ts` are called when:
- Loading the campaign list
- Viewing an individual campaign 
- Refreshing campaign data

### 2. Server-Side Automation (PostgreSQL)

A database trigger (`campaign_auto_status_trigger`) automatically updates campaign status on:
- Campaign creation
- Campaign updates 
- Daily scheduled updates

### 3. Data Generation on Activation

When a campaign becomes "active", the system:
- Checks if prescription data already exists
- If not, generates realistic prescription data based on campaign targets
- Saves this data to the database

## Prescription Data Tracking System

The prescription tracking system measures the impact of marketing campaigns on provider prescribing behavior by working directly with the main prescriptions table:

### Date Requirements

- Campaign start and end dates are now **required fields**
- The system uses these dates to:
  - Determine the status of the campaign (active, completed)
  - Set the time period for baseline and current prescription metrics
  - Generate realistic prescription data within the appropriate date ranges

### Provider Tracking & File Export

When a campaign is saved (created or updated to active status):

1. The system identifies all providers matching the campaign's targeting criteria
2. These provider IDs are stored in the campaign's metadata for reference
3. A detailed JSON file is exported to the logs directory containing:
   - Campaign details (ID, name, targeting criteria)
   - Complete list of affected providers
   - Date range of the campaign
   - Timestamp of when the data was generated
   
The file naming follows the pattern: `campaign_{id}_providers_{date}.json`

### Direct Prescriptions Table Updates

Unlike previous implementations, this system now:
1. Updates the regular prescriptions table directly
2. Generates two sets of prescription records for each affected provider:
   - **Baseline records**: From 30 days before campaign start
   - **Campaign records**: During the active campaign period
3. Shows realistic shifts in prescribing behavior for targeted medications

### Visualization

The `ScriptLiftComparison` component visualizes this data in three ways:

1. **Before/After View**: Shows prescription volumes before and after the campaign
2. **By Specialty View**: Breaks down prescription changes by provider specialty
3. **Competitive View**: Compares target medication performance against competitors

## How to Use

### Viewing Script Lift Data

1. Navigate to a campaign's detail page
2. The Script Lift Comparison component will load automatically
3. Use the dropdown selectors to:
   - Choose which medication to analyze
   - Switch between different comparison views

### Testing Status Automation

Campaign statuses update automatically, but you can also:

1. Create a new campaign with dates in the past, present, or future
2. Observe how the status changes based on the date ranges
3. Use the Refresh button on the campaign list to force a status check

## Technical Implementation

The implementation follows a layered approach:

1. **Database Layer**: Tables, triggers, and functions in PostgreSQL/Supabase
2. **Data Access Layer**: Functions to interact with the database in `src/lib/prescriptionDataGenerator.ts`
3. **Business Logic Layer**: Status update and data processing in `src/lib/campaignUtils.ts`
4. **Presentation Layer**: React components that visualize the data

This separation ensures maintainability and scalability as the application grows.
