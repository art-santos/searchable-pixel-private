import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'

export default function ComponentPreview() {
  return (
    <div className="flex flex-col gap-4 bg-[#111] p-6">
      <Button>Button</Button>
      <Input placeholder="Input" />
      <textarea
        className="rounded-none border border-[#333] bg-[#111] p-2 text-white"
        placeholder="Textarea"
      />
      <Checkbox defaultChecked />
      <Switch />
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">Open Popover</Button>
        </PopoverTrigger>
        <PopoverContent>
          <span className="text-sm">Popover Content</span>
        </PopoverContent>
      </Popover>
      <RadioGroup defaultValue="1" className="flex gap-2">
        <RadioGroupItem value="1" />
        <RadioGroupItem value="2" />
        <RadioGroupItem value="3" />
      </RadioGroup>
      <ScrollArea className="h-32 w-48 border border-[#333]">
        <div className="space-y-2 p-4">
          {Array.from({ length: 20 }).map((_, i) => (
            <p key={i} className="text-sm text-white">
              Item {i + 1}
            </p>
          ))}
        </div>
        <ScrollBar orientation="vertical" />
      </ScrollArea>
    </div>
  )
}
