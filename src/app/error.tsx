'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col min-h-screen bg-[#0c0c0c] text-white items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <h2 className="text-xl font-semibold mb-4">Something went wrong</h2>
        <p className="mb-6 text-white/70">We apologize for the inconvenience. An error has occurred.</p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button
            onClick={reset}
            className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors"
          >
            Try again
          </button>
          <Link 
            href="/"
            className="px-4 py-2 border border-white/20 rounded-lg hover:bg-white/10 transition-colors"
          >
            Return home
          </Link>
        </div>
      </div>
    </div>
  );
} 