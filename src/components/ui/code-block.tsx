"use client"

import { Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

interface CodeBlockProps extends React.HTMLAttributes<HTMLPreElement> {
  code: string
  showCopy?: boolean
}

export function CodeBlock({ code, showCopy = true, className, ...props }: CodeBlockProps) {
  const { toast } = useToast()

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    toast({ description: "Copied to clipboard" })
  }

  return (
    <pre
      className={cn(
        "relative rounded-md border border-[#333] bg-[#0c0c0c] p-4 font-mono text-sm text-white",
        className
      )}
      {...props}
    >
      {showCopy && (
        <Button
          size="sm"
          variant="ghost"
          className="absolute right-2 top-2 h-6 px-2 text-xs text-gray-400 hover:bg-[#222] hover:text-white"
          onClick={handleCopy}
        >
          <Copy className="mr-1 h-3 w-3" />
          Copy
        </Button>
      )}
      <code className="whitespace-pre">{code}</code>
    </pre>
  )
}
