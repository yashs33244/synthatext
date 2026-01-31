'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { setTokens } from '@/lib/api';
import { getLandingUrl, getAppUrl } from '@/lib/config';

function CallbackContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');

    if (accessToken && refreshToken) {
      // Store tokens in cookies
      setTokens(accessToken, refreshToken);
      
      // Use full page redirect to ensure AuthContext reinitializes with new tokens
      // This is necessary because router.push() doesn't reload the page
      window.location.href = `${getAppUrl()}/dashboard`;
    } else {
      // No tokens, redirect to landing login
      window.location.href = `${getLandingUrl()}/login`;
    }
  }, [searchParams]);

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
