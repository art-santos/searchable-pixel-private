import Link from 'next/link';
import Image from 'next/image';

export default function NotFound() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0c0c0c] text-white">
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="mb-6 flex justify-center">
            <Image 
              src="/Origamisvg.svg" 
              alt="Origami" 
              width={200} 
              height={50} 
              className="opacity-60"
            />
          </div>
          <h1 className="text-3xl font-semibold mb-2">404</h1>
          <h2 className="text-xl font-medium mb-4">Page Not Found</h2>
          <p className="mb-8 text-white/70">The page you are looking for doesn't exist or has been moved.</p>
          <Link 
            href="/"
            className="px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors inline-block"
          >
            Return to home
          </Link>
        </div>
      </main>
    </div>
  );
} 