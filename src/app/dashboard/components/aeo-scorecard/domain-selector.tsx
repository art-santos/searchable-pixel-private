import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"
import Image from "next/image"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function DomainSelector() {
  return (
    <div className="flex items-start">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="w-fit border border-[#333333] bg-transparent hover:bg-[#1a1a1a] px-4 rounded-none"
          >
            <div className="flex items-center gap-2">
              <Image 
                src="/origami-favicon.svg" 
                alt="Origami Agents" 
                width={16} 
                height={16} 
              />
              <span className="font-geist-semi text-white">origamiagents.com</span>
              <ChevronDown className="h-4 w-4 text-[#666666]" />
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          className="bg-[#1a1a1a] border border-[#333333] text-white rounded-none mt-1"
          align="start"
          alignOffset={-1}
        >
          <DropdownMenuItem className="hover:bg-[#222222] cursor-not-allowed opacity-50 rounded-none">
            <div className="flex items-center gap-2">
              <span className="text-sm">Upgrade to Pro to connect more domains</span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
} 