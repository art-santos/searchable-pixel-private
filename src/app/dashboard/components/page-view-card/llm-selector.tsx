import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"
import Image from "next/image"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function LLMSelector() {
  return (
    <div className="flex items-start relative">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="w-fit min-w-[140px] border border-[#333333] bg-transparent hover:bg-[#1a1a1a] px-4 rounded-none"
          >
            <div className="flex items-center gap-2">
              <Image 
                src="/perplexity.svg" 
                alt="Perplexity" 
                width={16} 
                height={16} 
              />
              <span className="font-geist-semi text-white">Perplexity</span>
              <ChevronDown className="h-4 w-4 text-[#666666]" />
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          className="bg-[#1a1a1a] border border-[#333333] text-white rounded-none mt-1"
          align="start"
          alignOffset={-1}
          sideOffset={4}
        >
          <DropdownMenuItem className="hover:bg-[#222222] cursor-not-allowed opacity-50 rounded-none">
            <div className="flex items-center gap-2">
              <Image 
                src="/chatgpt.svg" 
                alt="ChatGPT" 
                width={16} 
                height={16} 
              />
              <span className="text-sm">ChatGPT (Coming Soon)</span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem className="hover:bg-[#222222] cursor-not-allowed opacity-50 rounded-none">
            <div className="flex items-center gap-2">
              <Image 
                src="/gemini.svg" 
                alt="Gemini" 
                width={16} 
                height={16} 
              />
              <span className="text-sm">Gemini (Coming Soon)</span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem className="hover:bg-[#222222] cursor-not-allowed opacity-50 rounded-none">
            <div className="flex items-center gap-2">
              <Image 
                src="/claude.svg" 
                alt="Claude" 
                width={16} 
                height={16} 
              />
              <span className="text-sm">Claude (Coming Soon)</span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
} 