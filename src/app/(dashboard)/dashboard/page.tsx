'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import DailyWeightEntry from '@/components/weight/DailyWeightEntry';
import GoalDisplay from '@/components/goals/GoalDisplay';
import InitialGoalSetupModal from '@/components/goals/InitialGoalSetupModal';
import { format, parseISO } from 'date-fns';

interface WeightData {
  date: string;
  value: number;
}

interface PartnerWeightData {
  partnerId: string;
  partnerName: string;
  weights: WeightData[];
}

interface CombinedWeightData {
  date: string;
  userWeight?: number;
  [key: string]: number | string | undefined;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [weights, setWeights] = useState<WeightData[]>([]);
  const [partnerWeights, setPartnerWeights] = useState<PartnerWeightData[]>([]);
  const [combinedData, setCombinedData] = useState<CombinedWeightData[]>([]);
  const [currentWeight, setCurrentWeight] = useState<number | null>(null);
  const [showGoalSetup, setShowGoalSetup] = useState(false);
  const [hasCheckedGoals, setHasCheckedGoals] = useState(false);
  const [yAxisDomain, setYAxisDomain] = useState<[number, number]>([0, 100]);
  const [xAxisDomain, setXAxisDomain] = useState<[string, string]>(['dataMin', 'dataMax']);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('Dashboard - Session status:', status);
    console.log('Dashboard - Session data:', session);

    const fetchData = async () => {
      try {
        setIsLoading(true);
        console.log('Dashboard - Fetching data...');

        // First fetch user profile and weights
        const [userResponse, weightsResponse] = await Promise.all([
          fetch('/api/user/profile'),
          fetch('/api/weight')
        ]);

        console.log('Dashboard - Initial API responses:', {
          user: userResponse.status,
          weights: weightsResponse.status,
        });

        if (!weightsResponse.ok) {
          throw new Error('Failed to fetch weights');
        }

        const weightsData = await weightsResponse.json();
        const userData = userResponse.ok ? await userResponse.json() : null;

        console.log('Dashboard - Initial data:', {
          weights: weightsData.length,
          user: userData,
        });

        // Set current weight first
        if (weightsData.length > 0) {
          setCurrentWeight(weightsData[0].value);
        }

        // Then fetch goals and partner weights
        const [goalsResponse, partnerWeightsResponse] = await Promise.all([
          fetch('/api/goals'),
          fetch('/api/partners/weights')
        ]);

        console.log('Dashboard - Secondary API responses:', {
          goals: goalsResponse.status,
          partnerWeights: partnerWeightsResponse.status,
        });

        const goalsData = await goalsResponse.json();
        const partnerWeightsData = partnerWeightsResponse.ok ? await partnerWeightsResponse.json() : { partnerWeights: [] };

        // Helper function to normalize date to midnight UTC
        const normalizeDate = (dateStr: string) => {
          const date = new Date(dateStr);
          // Convert to user's local timezone midnight
          const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
          // Convert local midnight to UTC string and take the date part
          return localDate.toISOString().split('T')[0];
        };

        // Sort user weights by date
        const sortedUserWeights = weightsData
          .filter((w: WeightData): w is WeightData => typeof w.date === 'string') // Type guard to ensure date is string
          .sort((a: WeightData, b: WeightData) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .map((w: WeightData) => ({
            date: normalizeDate(w.date),
            userWeight: w.value
          }));

        // Create a map of all dates and their corresponding data
        const dateMap = new Map<string, CombinedWeightData>();
        
        // Add user weights to the map
        sortedUserWeights.forEach((entry: { date: string; userWeight: number }) => {
          dateMap.set(entry.date, { date: entry.date, userWeight: entry.userWeight });
        });

        // Add partner weights to the map, merging with existing dates
        partnerWeightsData.partnerWeights.forEach((partner: PartnerWeightData) => {
          partner.weights
            .filter((w: WeightData): w is WeightData => typeof w.date === 'string') // Type guard to ensure date is string
            .sort((a: WeightData, b: WeightData) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .forEach((w: WeightData) => {
              const normalizedDate = normalizeDate(w.date);
              const existingData = dateMap.get(normalizedDate);
              const updatedData: CombinedWeightData = {
                date: normalizedDate,
                userWeight: existingData?.userWeight,
                [partner.partnerId]: w.value
              };
              dateMap.set(normalizedDate, updatedData);
            });
        });

        // Convert map to array and sort by date
        const mergedData = Array.from(dateMap.values())
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // Calculate Y-axis domain based on all weights
        const allWeights = [
          ...weightsData.map((w: WeightData) => w.value),
          ...partnerWeightsData.partnerWeights.flatMap((p: PartnerWeightData) => 
            p.weights.map((w: WeightData) => w.value)
          )
        ];

        if (allWeights.length > 0) {
          const minWeight = Math.min(...allWeights);
          const maxWeight = Math.max(...allWeights);
          const padding = (maxWeight - minWeight) * 0.1;
          setYAxisDomain([
            Math.max(0, Math.floor(minWeight - padding)),
            Math.ceil(maxWeight + padding)
          ]);
        }

        setWeights(weightsData);
        setPartnerWeights(partnerWeightsData.partnerWeights);
        setCombinedData(mergedData);

        // Check if this is the user's first login
        const isFirstTime = userData?.isFirstLogin ?? true;
        setIsFirstLogin(isFirstTime);

        // Show goal setup modal if user has no goals or if it's their first login
        const shouldShowGoalSetup = goalsData.length === 0 || isFirstTime;
        console.log('Dashboard - Should show goal setup:', {
          goalsLength: goalsData.length,
          isFirstTime,
          shouldShowGoalSetup
        });
        
        setShowGoalSetup(shouldShowGoalSetup);
        setHasCheckedGoals(true);
      } catch (error) {
        console.error('Dashboard - Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user?.id) {
      console.log('Dashboard - User ID found, fetching data...');
      fetchData();
    } else {
      console.log('Dashboard - No user ID found in session');
      setIsLoading(false);
    }
  }, [session]);

  const handleCloseGoalSetup = async () => {
    // If it's the first login, update the user's profile
    if (isFirstLogin) {
      try {
        console.log('Dashboard - Updating user profile...');
        const response = await fetch('/api/user/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isFirstLogin: false }),
        });
        console.log('Dashboard - Profile update response:', response.status);
      } catch (error) {
        console.error('Dashboard - Error updating user profile:', error);
      }
    }
    setShowGoalSetup(false);
  };

  const formatXAxis = (dateStr: string) => {
    return format(parseISO(dateStr), 'dd/MM');
  };

  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Welcome back, {session?.user?.name}!
          </h2>
        </div>
      </div>

      {/* Daily Weight Entry and Current Weight */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <DailyWeightEntry />
        
        {/* Weight Progress Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-900 truncate">Current Weight</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {currentWeight || 'No data'} kg
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Goal Display */}
      <div className="grid grid-cols-1 gap-6">
        <GoalDisplay />
      </div>

      {/* Weight Chart */}
      {weights.length > 0 && (
        <div className="bg-white p-4 rounded-md shadow">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">Weight Progress</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={combinedData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatXAxis}
                  type="category"
                  interval="preserveStartEnd"
                  padding={{ left: 0, right: 0 }}
                  allowDuplicatedCategory={false}
                />
                <YAxis 
                  domain={yAxisDomain}
                  tickFormatter={(value) => value}
                />
                <Tooltip
                  labelFormatter={(date) => format(parseISO(date), 'dd/MM/yyyy')}
                  formatter={(value: number, name: string, props: any) => {
                    const weightValue = `${value} kg`;
                    if (name === 'userWeight') {
                      return [weightValue, 'Your Weight'];
                    }
                    const partner = partnerWeights.find(p => p.partnerId === name);
                    return [weightValue, partner ? `${partner.partnerName}'s Weight` : ''];
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="userWeight"
                  stroke="#4F46E5"
                  name="userWeight"
                  strokeWidth={2}
                  dot={{ fill: '#4F46E5', r: 4 }}
                  activeDot={{ r: 6 }}
                  connectNulls
                />
                {partnerWeights.map((partner) => (
                  <Line
                    key={partner.partnerId}
                    type="monotone"
                    dataKey={partner.partnerId}
                    stroke="#10B981"
                    name={partner.partnerId}
                    strokeWidth={2}
                    dot={{ fill: '#10B981', r: 4 }}
                    activeDot={{ r: 6 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex flex-wrap gap-4">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-indigo-600 mr-2"></div>
              <span className="text-sm text-gray-600">Your Weight</span>
            </div>
            {partnerWeights.map((partner) => (
              <div key={partner.partnerId} className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-emerald-500 mr-2"></div>
                <span className="text-sm text-gray-600">{partner.partnerName}'s Weight</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Initial Goal Setup Modal */}
      {hasCheckedGoals && showGoalSetup && currentWeight && (
        <InitialGoalSetupModal
          currentWeight={currentWeight}
          onClose={handleCloseGoalSetup}
        />
      )}
    </div>
  );
} 