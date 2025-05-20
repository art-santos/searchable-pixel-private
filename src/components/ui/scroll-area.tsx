"use client"

import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"

import { cn } from "@/lib/utils"


const ScrollArea = ScrollAreaPrimitive.Root

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      "flex touch-none select-none bg-[#1a1a1a] transition-colors",
      orientation === "vertical"
        ? "h-full w-2 border-l border-[#333]"
        : "h-2 w-full flex-col border-t border-[#333]",
      className
    )}
    {...props}
  >

    <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 bg-[#444]" />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
))
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName

const ScrollAreaViewport = ScrollAreaPrimitive.Viewport
const ScrollAreaCorner = ScrollAreaPrimitive.Corner

export { ScrollArea, ScrollBar, ScrollAreaViewport, ScrollAreaCorner }
