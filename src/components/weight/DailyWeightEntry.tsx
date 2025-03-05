'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function DailyWeightEntry() {
  const [weight, setWeight] = useState('');
  const [hasEnteredToday, setHasEnteredToday] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if user has already entered weight for today
  useEffect(() => {
    const checkTodayEntry = async () => {
      try {
        const response = await fetch('/api/weight');
        if (!response.ok) throw new Error('Failed to fetch weight data');
        
        const weights = await response.json();
        const today = new Date().toISOString().split('T')[0];
        const hasEntry = weights.some(
          (entry: any) => entry.date.split('T')[0] === today
        );
        
        setHasEnteredToday(hasEntry);
      } catch (error) {
        console.error('Error checking today\'s entry:', error);
        toast.error('Failed to check today\'s entry');
      }
    };

    checkTodayEntry();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!weight || isNaN(Number(weight)) || Number(weight) <= 0) {
      toast.error('Please enter a valid weight');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/weight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          value: Number(weight),
          date: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save weight');
      }

      toast.success('Weight recorded successfully!');
      setHasEnteredToday(true);
      setWeight('');
    } catch (error) {
      console.error('Error saving weight:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save weight');
    } finally {
      setIsLoading(false);
    }
  };

  if (hasEnteredToday) {
    return (
      <div className="bg-green-50 p-4 rounded-md">
        <p className="text-green-800">
          You've already recorded your weight for today. Come back tomorrow!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-md shadow">
      <h2 className="text-lg font-semibold mb-4 text-gray-900">Record Today's Weight</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="weight" className="block text-sm font-medium text-gray-900">
            Weight (kg)
          </label>
          <div className="mt-1">
            <input
              type="number"
              id="weight"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              step="0.1"
              min="0"
              placeholder="Enter your weight"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900"
              disabled={isLoading}
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : 'Save Weight'}
        </button>
      </form>
    </div>
  );
} 