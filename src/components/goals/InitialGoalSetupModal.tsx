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

interface InitialGoalSetupModalProps {
  currentWeight: number;
  onClose: () => void;
}

export default function InitialGoalSetupModal({ currentWeight, onClose }: InitialGoalSetupModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GoalFormData>({
    resolver: zodResolver(goalSchema),
  });

  const onSubmit = async (data: GoalFormData) => {
    console.log('InitialGoalSetupModal - Setting goal:', {
      targetWeight: data.targetWeight,
      startWeight: currentWeight,
      targetDate: new Date(data.targetDate).toISOString(),
    });

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

      console.log('InitialGoalSetupModal - Goal API response:', {
        status: response.status,
        ok: response.ok,
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('InitialGoalSetupModal - Goal API error:', error);
        throw new Error(error.message || 'Failed to set goal');
      }

      const result = await response.json();
      console.log('InitialGoalSetupModal - Goal API result:', result);

      toast.success('Weight goal set successfully!');
      onClose();
    } catch (error) {
      console.error('InitialGoalSetupModal - Error setting goal:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to set goal');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Welcome! Let's Set Your Weight Goal</h2>
        <p className="text-gray-600 mb-6">
          To help you track your progress, please set your target weight and the date you'd like to achieve it by.
        </p>
        
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
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                disabled={isLoading}
              />
              {errors.targetDate && (
                <p className="mt-1 text-sm text-red-600">{errors.targetDate.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Skip for Now
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading ? 'Setting Goal...' : 'Set Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 