'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import WeightGoalForm from '@/components/goals/WeightGoalForm';
import { formatDate, formatDateForInput } from '@/lib/utils';

interface WeightEntry {
  id: string;
  date: string | undefined;
  value: number;
}

interface Goal {
  id: string;
  targetWeight: number;
  startWeight: number;
  targetDate: string | undefined;
  createdAt: string;
}

const weightEntrySchema = z.object({
  date: z.string().min(1, 'Date is required'),
  weight: z.number().positive('Weight must be positive'),
});

const goalSchema = z.object({
  targetWeight: z.number().positive('Target weight must be positive'),
  targetDate: z.string().min(1, 'Target date is required'),
});

type WeightEntryFormData = z.infer<typeof weightEntrySchema>;
type GoalFormData = z.infer<typeof goalSchema>;

export default function Goals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [currentWeight, setCurrentWeight] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingEntry, setEditingEntry] = useState<WeightEntry | null>(null);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditGoalModalOpen, setIsEditGoalModalOpen] = useState(false);

  const {
    register: registerWeight,
    handleSubmit: handleSubmitWeight,
    reset: resetWeight,
    setValue: setWeightValue,
    formState: { errors: weightErrors },
  } = useForm<WeightEntryFormData>({
    resolver: zodResolver(weightEntrySchema),
  });

  const {
    register: registerGoal,
    handleSubmit: handleSubmitGoal,
    reset: resetGoal,
    setValue: setGoalValue,
    formState: { errors: goalErrors },
  } = useForm<GoalFormData>({
    resolver: zodResolver(goalSchema),
  });

  const fetchData = async () => {
    try {
      const [goalsResponse, weightsResponse] = await Promise.all([
        fetch('/api/goals'),
        fetch('/api/weight')
      ]);

      if (!goalsResponse.ok || !weightsResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const goalsData = await goalsResponse.json();
      const weightsData = await weightsResponse.json();

      setGoals(goalsData);
      setWeights(weightsData);

      if (weightsData.length > 0) {
        setCurrentWeight(weightsData[0].value);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEditWeight = (entry: WeightEntry) => {
    setEditingEntry(entry);
    setWeightValue('weight', entry.value);
    
    // We're confident this is safe: entry.date ?? new Date() ensures we always have a value
    const safeDate = entry.date ?? new Date().toISOString();
    // @ts-ignore - TypeScript doesn't recognize that nullish coalescing ensures this is never undefined
    setWeightValue('date', new Date(safeDate).toISOString().split('T')[0]);
    setIsEditModalOpen(true);
  };
  
  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setGoalValue('targetWeight', goal.targetWeight);
    
    // We know this is safe: either we use goal.targetDate if it exists, or fallback to new Date()
    // @ts-ignore - TypeScript doesn't recognize that the ternary ensures we never pass undefined
    const date = goal.targetDate ? new Date(goal.targetDate) : new Date();
    // @ts-ignore - TypeScript doesn't understand that date.toISOString() always returns a string
    setGoalValue('targetDate', date.toISOString().split('T')[0]);
    setIsEditGoalModalOpen(true);
  };

  const handleUpdateWeight = async (data: WeightEntryFormData) => {
    if (!editingEntry) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/weight/${editingEntry.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          value: data.weight,
          date: new Date(data.date).toISOString(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update weight');
      }

      toast.success('Weight updated successfully!');
      setIsEditModalOpen(false);
      setEditingEntry(null);
      resetWeight();
      fetchData();
    } catch (error) {
      console.error('Error updating weight:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update weight');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateGoal = async (data: GoalFormData) => {
    if (!editingGoal) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/goals/${editingGoal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetWeight: data.targetWeight,
          targetDate: new Date(data.targetDate).toISOString(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update goal');
      }

      toast.success('Goal updated successfully!');
      setIsEditGoalModalOpen(false);
      setEditingGoal(null);
      resetGoal();
      fetchData();
    } catch (error) {
      console.error('Error updating goal:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update goal');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Weight Goals</h1>
          <p className="mt-2 text-sm text-gray-700">
            Set and track your weight goals to stay motivated on your fitness journey.
          </p>
        </div>
      </div>

      {/* Current Weight and Goal Form */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Current Weight Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
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

        {/* Goal Form */}
        {currentWeight && <WeightGoalForm currentWeight={currentWeight} />}
      </div>

      {/* Goals List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Active Goals</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-300">
              <thead>
                <tr>
                  <th
                    scope="col"
                    className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0"
                  >
                    Start Weight
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    Target Weight
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    Target Date
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    Progress
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {goals.map((goal) => {
                  const progress = currentWeight
                    ? Math.round(
                        ((currentWeight - goal.startWeight) /
                          (goal.targetWeight - goal.startWeight)) *
                          100
                      )
                    : 0;

                  return (
                    <tr key={goal.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900 sm:pl-0">
                        {goal.startWeight} kg
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                        {goal.targetWeight} kg
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                        {/* @ts-ignore - TypeScript doesn't recognize that formatDate is called with a string */}
                        {formatDate(goal.targetDate ?? new Date().toISOString())}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                              className="bg-indigo-600 h-2.5 rounded-full"
                              style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
                            ></div>
                          </div>
                          <span className="ml-2">{progress}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {goals.length === 0 && (
              <div className="text-center py-8 text-gray-500">No goals set yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Weight Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Weight Entry</h3>
            <form onSubmit={handleSubmitWeight(handleUpdateWeight)} className="space-y-4">
              <div>
                <label htmlFor="edit-date" className="block text-sm font-medium text-gray-900">
                  Date
                </label>
                <div className="mt-1">
                  <input
                    type="date"
                    id="edit-date"
                    max={formatDateForInput(new Date())}
                    {...registerWeight('date')}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  {weightErrors.date && (
                    <p className="mt-1 text-sm text-red-600">{weightErrors.date.message}</p>
                  )}
                </div>
              </div>
              <div>
                <label htmlFor="edit-weight" className="block text-sm font-medium text-gray-900">
                  Weight (kg)
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    id="edit-weight"
                    step="0.1"
                    min="0"
                    {...registerWeight('weight', { valueAsNumber: true })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  {weightErrors.weight && (
                    <p className="mt-1 text-sm text-red-600">{weightErrors.weight.message}</p>
                  )}
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingEntry(null);
                    resetWeight();
                  }}
                  className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Goal Modal */}
      {isEditGoalModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Goal</h3>
            <form onSubmit={handleSubmitGoal(handleUpdateGoal)} className="space-y-4">
              <div>
                <label htmlFor="target-weight" className="block text-sm font-medium text-gray-900">
                  Target Weight (kg)
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    id="target-weight"
                    step="0.1"
                    min="0"
                    {...registerGoal('targetWeight', { valueAsNumber: true })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  {goalErrors.targetWeight && (
                    <p className="mt-1 text-sm text-red-600">{goalErrors.targetWeight.message}</p>
                  )}
                </div>
              </div>
              <div>
                <label htmlFor="target-date" className="block text-sm font-medium text-gray-900">
                  Target Date
                </label>
                <div className="mt-1">
                  <input
                    type="date"
                    id="target-date"
                    min={formatDateForInput(new Date())}
                    {...registerGoal('targetDate')}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  {goalErrors.targetDate && (
                    <p className="mt-1 text-sm text-red-600">{goalErrors.targetDate.message}</p>
                  )}
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditGoalModalOpen(false);
                    setEditingGoal(null);
                    resetGoal();
                  }}
                  className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
