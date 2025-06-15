'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSupabase } from '@/app/supabase-provider';

export default function Header() {
  const { session } = useSupabase();
  const user = session?.user;

  return (
    <header className="absolute inset-x-0 top-0 z-50">
      <nav className="flex items-center justify-between p-6 lg:px-8" aria-label="Global">
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5">
            <span className="sr-only">SwasthyaSakhi</span>
            <Image
              src="/logo.png"
              alt="SwasthyaSakhi Logo"
              width={120}
              height={40}
              className="h-10 w-auto"
            />
          </Link>
        </div>
        <div className="hidden lg:flex lg:gap-x-12">
          <Link href="/#features" className="text-sm font-semibold leading-6 text-gray-900">
            Features
          </Link>
          <Link href="/#impact" className="text-sm font-semibold leading-6 text-gray-900">
            Impact
          </Link>
          <Link href="/#about" className="text-sm font-semibold leading-6 text-gray-900">
            About
          </Link>
        </div>
        <div className="hidden lg:flex lg:flex-1 lg:justify-end">
          {user ? (
            <Link href="/dashboard" className="text-sm font-semibold leading-6 text-gray-900">
              Dashboard <span aria-hidden="true">&rarr;</span>
            </Link>
          ) : (
            <Link href="/login" className="text-sm font-semibold leading-6 text-gray-900">
              Log in <span aria-hidden="true">&rarr;</span>
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
} 