import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface User {
  id: string;
  name: string | null;
  email: string;
}

interface PartnerSelectProps {
  onPartnerSelect: (partnerId: string) => void;
}

export default function PartnerSelect({ onPartnerSelect }: PartnerSelectProps) {
  const { data: session } = useSession();
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAvailableUsers = async () => {
      try {
        const response = await fetch('/api/users');
        if (!response.ok) {
          throw new Error('Failed to fetch available users');
        }
        const users = await response.json();
        setAvailableUsers(users);
        setLoading(false);
      } catch (err) {
        setError('Failed to load available users');
        setLoading(false);
      }
    };

    if (session?.user?.id) {
      fetchAvailableUsers();
    }
  }, [session]);

  const handlePartnerSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onPartnerSelect(event.target.value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 p-4">
        {error}
      </div>
    );
  }

  if (availableUsers.length === 0) {
    return (
      <div className="text-gray-600 p-4">
        No available users to partner with at the moment.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label htmlFor="partner-select" className="block text-sm font-medium text-gray-700">
        Select a Partner
      </label>
      <select
        id="partner-select"
        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        onChange={handlePartnerSelect}
        defaultValue=""
      >
        <option value="" disabled>Choose a partner</option>
        {availableUsers.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name || user.email}
          </option>
        ))}
      </select>
    </div>
  );
} 