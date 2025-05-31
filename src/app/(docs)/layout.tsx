'use client'

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#0c0c0c]">
      {children}
    </div>
  )
} 