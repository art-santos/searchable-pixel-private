'use client';

import { useEffect } from 'react';

export default function GlobalError({
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
    <html lang="en">
      <body>
        <div className="flex min-h-screen bg-[#0c0c0c] text-white items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            <h2 className="text-xl font-semibold mb-4">Something went wrong globally</h2>
            <p className="mb-6 text-white/70">We apologize for the inconvenience. The application encountered a critical error.</p>
            <button
              onClick={reset}
              className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
} 