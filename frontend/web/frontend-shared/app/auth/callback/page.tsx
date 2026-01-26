'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { setTokens } from '@/lib/api';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');

    if (accessToken && refreshToken) {
      // Store tokens in cookies
      setTokens(accessToken, refreshToken);
      
      // Redirect to dashboard
      router.push('/dashboard');
    } else {
      // No tokens, redirect to landing login
      window.location.href = 'http://localhost:3000/login';
    }
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F7F9FA]">
      <div className="text-center">
        <div className="h-12 w-12 mx-auto mb-4 animate-spin rounded-full border-4 border-[#F7DC6F] border-t-transparent" />
        <p className="text-[#6F959F] font-medium">Completing sign in...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#F7F9FA]">
        <div className="text-center">
          <div className="h-12 w-12 mx-auto mb-4 animate-spin rounded-full border-4 border-[#F7DC6F] border-t-transparent" />
          <p className="text-[#6F959F] font-medium">Loading...</p>
        </div>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}
