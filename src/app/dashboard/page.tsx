'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase/client';
import type { User } from '@supabase/supabase-js';
import Chat from '@/components/Chat';
import { Phone, Video } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const checkUserStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      let isVerified = false;
      if (user.is_anonymous) {
        // For anonymous users, verification is stored in the session
        isVerified = sessionStorage.getItem('genderVerified') === 'true';
      } else {
        // For registered users, we check the database
        const { data: profile } = await supabase
          .from('users')
          .select('is_verified')
          .eq('id', user.id)
          .single();
        isVerified = profile?.is_verified || false;
      }

      if (!isVerified) {
        router.push('/gender-check');
      } else {
        setUser(user);
        setIsLoading(false);
      }
    };

    checkUserStatus();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    sessionStorage.removeItem('genderVerified');
    router.push('/');
  }

  if (isLoading) {
    return (
        <div className="flex min-h-screen items-center justify-center">
            <div>Loading...</div>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <header className="p-4 bg-white border-b border-gray-200 flex justify-between items-center">
        <div>
            <h1 className="text-xl font-bold text-gray-800">SwasthyaSakhi</h1>
            {user && <p className="text-sm text-gray-500">{user.email}</p>}
        </div>
        <button
          onClick={handleLogout}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          Logout
        </button>
      </header>

      <main className="flex-1 flex flex-col p-4 md:p-6 lg:p-8 overflow-hidden">
        <div className="flex-1 flex flex-col h-full">
            <Chat />
        </div>
        <div className="mt-4 space-y-2 max-w-lg mx-auto w-full">
            <button className="w-full flex items-center justify-center p-3 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50">
                <Phone className="w-5 h-5 mr-2 text-indigo-500" />
                <span className="font-semibold text-gray-700">Voice call a doc</span>
            </button>
            <button className="w-full flex items-center justify-center p-3 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50">
                <Video className="w-5 h-5 mr-2 text-indigo-500" />
                <span className="font-semibold text-gray-700">Video call a doc</span>
            </button>
        </div>
      </main>
    </div>
  );
} 