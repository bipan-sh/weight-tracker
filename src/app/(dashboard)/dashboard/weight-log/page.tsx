'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import { formatDate, formatDateForInput } from '@/lib/utils';

interface WeightEntry {
  id: string;
  date: string;
  value: number;
}

const weightEntrySchema = z.object({
  date: z.string().min(1, 'Date is required'),
  weight: z.number().positive('Weight must be positive'),
});

type WeightEntryFormData = z.infer<typeof weightEntrySchema>;

export default function WeightLog() {
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingEntry, setEditingEntry] = useState<WeightEntry | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<WeightEntryFormData>({
    resolver: zodResolver(weightEntrySchema),
  });

  const fetchWeights = async () => {
    try {
      const response = await fetch('/api/weight');
      if (!response.ok) throw new Error('Failed to fetch weight data');
      const data = await response.json();
      setWeights(data);
    } catch (error) {
      console.error('Error fetching weights:', error);
      toast.error('Failed to fetch weight data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWeights();
  }, []);

  const onSubmit = async (data: WeightEntryFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/weight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          value: data.weight,
          date: new Date(data.date).toISOString(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save weight');
      }

      toast.success('Weight recorded successfully!');
      reset();
      fetchWeights(); // Refresh the weight list
    } catch (error) {
      console.error('Error saving weight:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save weight');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (entry: WeightEntry) => {
    setEditingEntry(entry);
    setValue('weight', entry.value);
    setValue('date', new Date(entry.date).toISOString().split('T')[0]);
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (data: WeightEntryFormData) => {
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
      reset();
      fetchWeights(); // Refresh the weight list
    } catch (error) {
      console.error('Error updating weight:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update weight');
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
          <h1 className="text-xl font-semibold text-gray-900">Weight Log</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all your recorded weights, showing the date and weight for each entry.
          </p>
        </div>
      </div>

      {/* Past Weight Entry Form */}
      <div className="bg-white p-4 rounded-md shadow">
        <h2 className="text-lg font-semibold mb-4 text-gray-900">Add Past Weight Entry</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-900">
                Date
              </label>
              <div className="mt-1">
                <input
                  type="date"
                  id="date"
                  max={formatDateForInput(new Date())}
                  {...register('date')}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900"
                />
                {errors.date && (
                  <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
                )}
              </div>
            </div>
            <div>
              <label htmlFor="weight" className="block text-sm font-medium text-gray-900">
                Weight (kg)
              </label>
              <div className="mt-1">
                <input
                  type="number"
                  id="weight"
                  step="0.1"
                  min="0"
                  {...register('weight', { valueAsNumber: true })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900"
                />
                {errors.weight && (
                  <p className="mt-1 text-sm text-red-600">{errors.weight.message}</p>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Weight'}
            </button>
          </div>
        </form>
      </div>

      {/* Weight Log Table */}
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Date
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Weight (kg)
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {weights.map((entry) => (
                    <tr key={entry.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900 sm:pl-0">
                        {formatDate(entry.date)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                        {entry.value}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 text-right">
                        <button
                          onClick={() => handleEdit(entry)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {weights.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No weight entries found
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Weight Entry</h3>
            <form onSubmit={handleSubmit(handleUpdate)} className="space-y-4">
              <div>
                <label htmlFor="edit-date" className="block text-sm font-medium text-gray-900">
                  Date
                </label>
                <div className="mt-1">
                  <input
                    type="date"
                    id="edit-date"
                    max={formatDateForInput(new Date())}
                    {...register('date')}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  {errors.date && (
                    <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
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
                    {...register('weight', { valueAsNumber: true })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  {errors.weight && (
                    <p className="mt-1 text-sm text-red-600">{errors.weight.message}</p>
                  )}
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingEntry(null);
                    reset();
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