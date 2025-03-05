'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import PartnerSelect from '@/components/partners/PartnerSelect';

interface Partner {
  id: string;
  partnerId: string;
  name: string | null;
  email: string;
}

interface PendingRequest {
  id: string;
  user: {
    name: string | null;
    email: string;
  };
}

export default function PartnersPage() {
  const { data: session } = useSession();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'current' | 'choose'>('current');

  const fetchPartners = async () => {
    try {
      const response = await fetch('/api/partners');
      if (!response.ok) {
        throw new Error('Failed to fetch partners');
      }
      const data = await response.json();
      setPartners(data.partners);
      setPendingRequests(data.pendingRequests);
      setLoading(false);
    } catch (err) {
      setError('Failed to load partners');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      fetchPartners();
    }
  }, [session]);

  const handlePartnerSelect = async (partnerId: string) => {
    try {
      const response = await fetch('/api/partners', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ partnerId }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData);
      }

      setSuccessMessage('Partner request sent successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
      await fetchPartners(); // Refresh the partners list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send partner request');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleAcceptRequest = async (partnerId: string) => {
    try {
      const response = await fetch(`/api/partners/${partnerId}/accept`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to accept partner request');
      }

      setSuccessMessage('Partner request accepted!');
      setTimeout(() => setSuccessMessage(null), 3000);
      await fetchPartners(); // Refresh the partners list
    } catch (err) {
      setError('Failed to accept partner request');
      setTimeout(() => setError(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Partners
          </h2>
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {successMessage}
        </div>
      )}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('current')}
            className={`
              ${activeTab === 'current'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }
              whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium
            `}
          >
            Your Partners
          </button>
          <button
            onClick={() => setActiveTab('choose')}
            className={`
              ${activeTab === 'choose'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }
              whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium
            `}
          >
            Choose Partner
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'choose' ? (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Find a Partner</h3>
            <div className="max-w-xl">
              <PartnerSelect onPartnerSelect={handlePartnerSelect} />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Current Partners Section */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Partners</h2>
              {partners.length === 0 ? (
                <p className="text-gray-600">No partners yet.</p>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {partners.map((partner) => (
                    <li key={partner.id} className="py-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {partner.name || partner.email}
                          </p>
                          <p className="text-sm text-gray-500 truncate">{partner.email}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Pending Requests Section */}
            {pendingRequests.length > 0 && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Pending Requests</h2>
                <ul className="divide-y divide-gray-200">
                  {pendingRequests.map((request) => (
                    <li key={request.id} className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {request.user.name || request.user.email}
                          </p>
                          <p className="text-sm text-gray-500 truncate">{request.user.email}</p>
                        </div>
                        <button
                          onClick={() => handleAcceptRequest(request.id)}
                          className="ml-4 bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Accept
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 