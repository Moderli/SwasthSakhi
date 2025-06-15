'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSupabase } from '@/app/supabase-provider';

export default function HeroButtons() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { supabase } = useSupabase();

  const handleAnonymousLogin = async () => {
    setIsSubmitting(true);
    const { error } = await supabase.auth.signInAnonymously();
    if (error) {
      console.error('Anonymous login failed:', error.message);
      alert('Anonymous login failed. Please try again.');
      setIsSubmitting(false);
    } else {
      router.push('/gender-check');
    }
  };

  return (
    <div className="mt-10 flex items-center gap-x-6">
      <Link
        href="/signup"
        className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
      >
        Get Started
      </Link>
      <button
        onClick={handleAnonymousLogin}
        disabled={isSubmitting}
        className="text-sm font-semibold leading-6 text-gray-900 disabled:opacity-50"
      >
        {isSubmitting ? 'Logging in...' : 'Login Anonymously →'}
      </button>
    </div>
  );
} 