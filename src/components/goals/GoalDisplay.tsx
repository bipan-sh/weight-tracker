'use client';

import { useState, useEffect } from 'react';
import { format, differenceInDays } from 'date-fns';
import { formatDate } from '@/lib/utils';

interface Goal {
  id: string;
  targetWeight: number;
  startWeight: number;
  targetDate: string;
  achieved: boolean;
}

export default function GoalDisplay() {
  const [goal, setGoal] = useState<Goal | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchGoal = async () => {
      try {
        const response = await fetch('/api/goals');
        if (!response.ok) throw new Error('Failed to fetch goal');
        const goals = await response.json();
        const activeGoal = goals.find((g: Goal) => !g.achieved);
        setGoal(activeGoal || null);
      } catch (error) {
        console.error('Error fetching goal:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGoal();
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white p-4 rounded-md shadow">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3 mt-4">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!goal) {
    return null;
  }

  const daysLeft = differenceInDays(new Date(goal.targetDate), new Date());
  const weightDifference = goal.targetWeight - goal.startWeight;
  const isWeightLoss = weightDifference < 0;
  
  return (
    <div className="bg-white p-4 rounded-md shadow">
      <h2 className="text-lg font-semibold mb-4 text-gray-900">Your Weight Goal</h2>
      <div className="space-y-4">
        <div>
          <div className="text-sm text-gray-500">Target Weight</div>
          <div className="text-lg font-medium text-gray-900">{goal.targetWeight} kg</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Starting Weight</div>
          <div className="text-lg font-medium text-gray-900">{goal.startWeight} kg</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Goal</div>
          <div className="text-lg font-medium text-gray-900">
            {isWeightLoss ? 'Lose' : 'Gain'} {Math.abs(weightDifference).toFixed(1)} kg
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Target Date</div>
          <div className="text-lg font-medium text-gray-900">
            {formatDate(goal.targetDate)}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Days Remaining</div>
          <div className="text-lg font-medium text-gray-900">
            {daysLeft > 0 ? `${daysLeft} days` : 'Goal date reached'}
          </div>
        </div>
      </div>
    </div>
  );
} 