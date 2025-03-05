'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import { formatDateForInput } from '@/lib/utils';

const goalSchema = z.object({
  targetWeight: z.number().positive('Target weight must be positive'),
  targetDate: z.string().min(1, 'Target date is required'),
});

type GoalFormData = z.infer<typeof goalSchema>;

export default function WeightGoalForm({ currentWeight }: { currentWeight: number }) {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<GoalFormData>({
    resolver: zodResolver(goalSchema),
  });

  const onSubmit = async (data: GoalFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetWeight: data.targetWeight,
          startWeight: currentWeight,
          targetDate: new Date(data.targetDate).toISOString(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to set goal');
      }

      toast.success('Weight goal set successfully!');
      reset();
    } catch (error) {
      console.error('Error setting goal:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to set goal');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded-md shadow">
      <h2 className="text-lg font-semibold mb-4 text-gray-900">Set Weight Goal</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="targetWeight" className="block text-sm font-medium text-gray-900">
            Target Weight (kg)
          </label>
          <div className="mt-1">
            <input
              type="number"
              id="targetWeight"
              step="0.1"
              min="0"
              {...register('targetWeight', { valueAsNumber: true })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900"
              disabled={isLoading}
            />
            {errors.targetWeight && (
              <p className="mt-1 text-sm text-red-600">{errors.targetWeight.message}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="targetDate" className="block text-sm font-medium text-gray-900">
            Target Date
          </label>
          <div className="mt-1">
            <input
              type="date"
              id="targetDate"
              {...register('targetDate')}
              min={formatDateForInput(new Date())}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900"
              disabled={isLoading}
            />
            {errors.targetDate && (
              <p className="mt-1 text-sm text-red-600">{errors.targetDate.message}</p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isLoading ? 'Setting Goal...' : 'Set Goal'}
        </button>
      </form>
    </div>
  );
} 