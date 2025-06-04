'use client'

import { SignupForm } from '@/components/auth/signup-form'
import Link from 'next/link'
import Image from 'next/image'

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-[#0c0c0c] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="inline-block opacity-80 hover:opacity-100 transition-opacity">
            <Image 
              src="/images/split-full-text.svg" 
              alt="Split" 
              width={80} 
              height={28}
            />
          </Link>
        </div>

        {/* Signup Form */}
        <SignupForm />

        {/* Footer Links */}
        <div className="mt-8 text-center text-sm text-[#666]">
          <p>
            By signing up, you agree to our{' '}
            <Link href="/terms" className="text-white hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-white hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
} 