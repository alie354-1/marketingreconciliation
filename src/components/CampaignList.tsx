import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ListFilter, ChevronRight, Target } from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  status: string;
  target_geographic_area: string;
  target_specialty: string;
  created_at: string;
}

export function CampaignList() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  async function fetchCampaigns() {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setCampaigns(data);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <ListFilter className="h-6 w-6 text-indigo-600 mr-2" />
          <h2 className="text-2xl font-bold text-gray-900">Your Campaigns</h2>
        </div>
        <Link
          to="/create"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <Target className="h-4 w-4 mr-2" />
          New Campaign
        </Link>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <ul className="divide-y divide-gray-200">
          {campaigns.map((campaign) => (
            <li key={campaign.id}>
              <Link
                to={`/results/${campaign.id}`}
                className="block hover:bg-gray-50 transition duration-150 ease-in-out"
              >
                <div className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-medium text-gray-900">{campaign.name}</p>
                      <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                        <span>{campaign.target_geographic_area}</span>
                        <span>•</span>
                        <span>{campaign.target_specialty}</span>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                        campaign.status === 'active' ? 'bg-green-100 text-green-800' :
                        campaign.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {campaign.status}
                      </span>
                      <ChevronRight className="h-5 w-5 text-gray-400 ml-4" />
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          ))}
          {campaigns.length === 0 && (
            <li className="px-6 py-12">
              <div className="text-center">
                <p className="text-gray-500">No campaigns yet</p>
                <Link
                  to="/create"
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-indigo-100 hover:bg-indigo-200"
                >
                  Create your first campaign
                </Link>
              </div>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}