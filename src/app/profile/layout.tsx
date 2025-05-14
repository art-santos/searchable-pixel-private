'use client'

import AuthenticatedLayout from '@/layouts/AuthenticatedLayout'

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthenticatedLayout>
      {children}
    </AuthenticatedLayout>
  )
} 