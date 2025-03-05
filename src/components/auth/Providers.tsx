'use client';

import { SessionProvider, useSession } from 'next-auth/react';
import { ReactNode, useEffect } from 'react';

function SessionLogger({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();

  useEffect(() => {
    console.log('SessionLogger - Session status:', status);
    console.log('SessionLogger - Session data:', session);
  }, [status, session]);

  return <>{children}</>;
}

export default function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    console.log('Providers - Component mounted');
  }, []);

  return (
    <SessionProvider>
      <SessionLogger>{children}</SessionLogger>
    </SessionProvider>
  );
} 