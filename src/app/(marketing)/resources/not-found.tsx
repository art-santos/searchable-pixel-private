import Link from 'next/link'
import { LPTopBar } from '@/components/layout/lp-topbar'

export default function ResourcesNotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <LPTopBar />
      
      <main className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        <h1 className="mb-4 text-4xl font-bold text-[#191919] md:text-5xl">Resource Not Found</h1>
        <p className="mb-8 max-w-md text-lg text-gray-600">
          We couldn't find the resource you're looking for. It may have been moved or deleted.
        </p>
        <Link
          href="/resources"
          className="inline-flex items-center justify-center bg-[#191919] px-6 py-2.5 font-medium text-white transition-colors hover:bg-[#333333] border border-[#191919]"
        >
          Browse All Resources
        </Link>
      </main>
    </div>
  )
} 