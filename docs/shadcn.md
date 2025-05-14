# Shadcn UI Master Documentation

This document aggregates usage details for various Shadcn UI components. It focuses on how to install, import, and integrate each component, as well as common usage scenarios and best practices for composing them together in React/Next.js applications.

Below, you'll find a comprehensive reference for each core component. For each component, we include:
- **Installation** steps
- **Usage** imports
- Example usage patterns (indented code blocks)
- Key props, special considerations, and relationships to other components

Use this as a single reference to empower an AI coding assistant to compose complex UIs.  

---

## Alert Dialog

A **modal dialog** that interrupts the user with important content and expects a response.

### Installation

    ```bash
    pnpm dlx shadcn@latest add alert-dialog
    ```

### Usage

    ```typescript
    import {
      AlertDialog,
      AlertDialogAction,
      AlertDialogCancel,
      AlertDialogContent,
      AlertDialogDescription,
      AlertDialogFooter,
      AlertDialogHeader,
      AlertDialogTitle,
      AlertDialogTrigger
    } from "@/components/ui/alert-dialog"
    ```

    ```tsx
    <AlertDialog>
      <AlertDialogTrigger>Open</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your account.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    ```

**Key Points**:
- The **Trigger** opens the modal.
- **AlertDialogContent** wraps all dialog-specific content.
- **Header**, **Title**, and **Description** give structure to the dialog message.
- **Footer** groups the dialog’s actions.
- Commonly used for confirmation flows (e.g., “Delete item?”).

---

## Alert

Displays a **callout** for user attention.

### Installation

    ```bash
    pnpm dlx shadcn@latest add alert
    ```

### Usage

    ```typescript
    import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
    ```

    ```tsx
    <Alert>
      <AlertTitle>Heads up!</AlertTitle>
      <AlertDescription>
        You can add components and dependencies to your app using the CLI.
      </AlertDescription>
    </Alert>
    ```

**Key Points**:
- Use **AlertTitle** and **AlertDescription** for structure.
- Often employed to display success messages, error states, or warnings.

---

## Aspect Ratio

Displays content within a **desired ratio** (e.g., 16:9).

### Installation

    ```bash
    pnpm dlx shadcn@latest add aspect-ratio
    ```

### Usage

    ```typescript
    import Image from "next/image"
    import { AspectRatio } from "@/components/ui/aspect-ratio"
    ```

    ```tsx
    <div className="w-[450px]">
      <AspectRatio ratio={16 / 9}>
        <Image src="..." alt="Image" className="rounded-md object-cover" />
      </AspectRatio>
    </div>
    ```

**Key Points**:
- **ratio** prop sets the aspect ratio (e.g., `16/9`, `1/1`, etc.).
- Ensures consistent sizing for embedded images/videos.

---

## Avatar

An **image element** with a fallback, typically for user representation.

### Installation

    ```bash
    pnpm dlx shadcn@latest add avatar
    ```

### Usage

    ```typescript
    import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
    ```

    ```tsx
    <Avatar>
      <AvatarImage src="https://github.com/shadcn.png" />
      <AvatarFallback>CN</AvatarFallback>
    </Avatar>
    ```

**Key Points**:
- **AvatarImage** attempts to render an image; if it fails, **AvatarFallback** is displayed.
- Commonly used for user profiles, team members, etc.

---

## Badge

Displays a **badge** or label-like element.

### Installation

    ```bash
    pnpm dlx shadcn@latest add badge
    ```

### Usage

    ```typescript
    import { Badge } from "@/components/ui/badge"
    ```

    ```tsx
    <Badge variant="outline">Badge</Badge>
    ```

**Link-like usage**:

    ```tsx
    import { badgeVariants } from "@/components/ui/badge"
    
    <Link className={badgeVariants({ variant: "outline" })}>Badge</Link>
    ```

**Key Points**:
- Variants like `outline`, `secondary`, `destructive` exist.
- Use for labeling or highlighting states (e.g., “New”, “Beta”).

---

## Breadcrumb

Displays a **path** to the current resource, using hierarchical links.

### Installation

    ```bash
    pnpm dlx shadcn@latest add breadcrumb
    ```

### Usage

    ```typescript
    import {
      Breadcrumb,
      BreadcrumbItem,
      BreadcrumbLink,
      BreadcrumbList,
      BreadcrumbPage,
      BreadcrumbSeparator
    } from "@/components/ui/breadcrumb"
    ```

    ```tsx
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/">Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="/components">Components</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
    ```

**Key Points**:
- **BreadcrumbItem** for each part of the path.
- **BreadcrumbSeparator** can be customized or replaced (e.g., a slash or arrow).

---

## Button

A reusable **button** that supports multiple variants.

### Installation

    ```bash
    pnpm dlx shadcn@latest add button
    ```

### Usage

    ```typescript
    import { Button, buttonVariants } from "@/components/ui/button"
    ```

    ```tsx
    <Button variant="outline">Button</Button>
    
    // Or as a link that looks like a button:
    <Link className={buttonVariants({ variant: "outline" })}>Click here</Link>
    ```

**Examples**:
- **Primary**, **Secondary**, **Destructive**, **Outline**, **Ghost**, **Link** style, **With Icon**, **Loading** states, etc.

---

## Calendar

A **date field** built on [React DayPicker](https://react-day-picker.js.org).

### Installation

    ```bash
    pnpm dlx shadcn@latest add calendar
    ```

### Usage

    ```typescript
    import { Calendar } from "@/components/ui/calendar"
    ```

    ```tsx
    const [date, setDate] = React.useState<Date | undefined>(new Date())

    <Calendar
      mode="single"
      selected={date}
      onSelect={setDate}
      className="rounded-md border"
    />
    ```

**Key Points**:
- Use the **selected** and **onSelect** props to track and update the chosen date.
- Composes well with popovers for date-pickers.

---

## Card

Displays a **card** with header, content, and footer sections.

### Installation

    ```bash
    pnpm dlx shadcn@latest add card
    ```

### Usage

    ```typescript
    import {
      Card,
      CardContent,
      CardDescription,
      CardFooter,
      CardHeader,
      CardTitle
    } from "@/components/ui/card"
    ```

    ```tsx
    <Card>
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card Description</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Card Content</p>
      </CardContent>
      <CardFooter>
        <p>Card Footer</p>
      </CardFooter>
    </Card>
    ```

**Key Points**:
- **Title** and **Description** give structure to headings.
- Commonly used as a container for data items, user profiles, or dashboards.

---

## Carousel

A **carousel** with motion and swipe, built using Embla.

### Installation

    ```bash
    pnpm dlx shadcn@latest add carousel
    ```

### Usage

    ```typescript
    import {
      Carousel,
      CarouselContent,
      CarouselItem,
      CarouselNext,
      CarouselPrevious
    } from "@/components/ui/carousel"
    ```

    ```tsx
    <Carousel>
      <CarouselContent>
        <CarouselItem>1</CarouselItem>
        <CarouselItem>2</CarouselItem>
        <CarouselItem>3</CarouselItem>
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
    ```

**Key Points**:
- **CarouselItem** can have sizing classes like `basis-1/3`.
- Supports vertical/horizontal orientation via `orientation` prop.
- **plugins** prop for advanced features (e.g., autoplay).

---

## Chart

A **charting** setup built on Recharts for flexible data visualization.

### Installation

    ```bash
    pnpm dlx shadcn@latest add chart
    ```

### Usage

    ```typescript
    import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
    import { Bar, BarChart } from "recharts"
    ```

    ```tsx
    <ChartContainer config={myConfig} className="min-h-[200px] w-full">
      <BarChart data={data}>
        <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
        <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
        <ChartTooltip content={<ChartTooltipContent />} />
      </BarChart>
    </ChartContainer>
    ```

**Key Points**:
- **ChartContainer** handles theming and sizing.
- Combine Recharts components (like `BarChart`) with optional custom pieces (`ChartTooltip`, `ChartLegend`).
- Use your own `zod`-style config or direct color variables for theming.

---

## Checkbox

A **toggle** control that can be checked or unchecked.

### Installation

    ```bash
    pnpm dlx shadcn@latest add checkbox
    ```

### Usage

    ```typescript
    import { Checkbox } from "@/components/ui/checkbox"
    ```

    ```tsx
    <Checkbox />
    
    // With text:
    <div className="flex items-center space-x-2">
      <Checkbox id="terms" />
      <label htmlFor="terms">Accept terms and conditions</label>
    </div>
    ```

**Key Points**:
- Often used in forms.
- Combine with a label to ensure accessibility.

---

## Collapsible

An **expand/collapse** container for content.

### Installation

    ```bash
    pnpm dlx shadcn@latest add collapsible
    ```

### Usage

    ```typescript
    import {
      Collapsible,
      CollapsibleContent,
      CollapsibleTrigger
    } from "@/components/ui/collapsible"
    ```

    ```tsx
    <Collapsible>
      <CollapsibleTrigger>Toggle</CollapsibleTrigger>
      <CollapsibleContent>
        Hidden content goes here.
      </CollapsibleContent>
    </Collapsible>
    ```

**Key Points**:
- Often used for advanced sections, FAQs, or collapsible sidebars.

---

## Combobox

An **autocomplete** input and command palette using Popover + Command.

### Installation

- Install [Popover](/docs/components/popover#installation) and [Command](/docs/components/command#installation).

### Usage

    ```tsx
    import * as React from "react"
    import { Button } from "@/components/ui/button"
    import { Command, CommandGroup, CommandItem } from "@/components/ui/command"
    import {
      Popover,
      PopoverContent,
      PopoverTrigger
    } from "@/components/ui/popover"
    
    // Example combobox
    <Popover>
      <PopoverTrigger asChild>
        <Button>Select framework...</Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandGroup>
            <CommandItem>Next.js</CommandItem>
            <CommandItem>SvelteKit</CommandItem>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
    ```

**Key Points**:
- Composes with the **Command** component for advanced filtering and item listing.
- Often used for search fields, multi-select combos, or dropdown searches.

---

## Command

A **fast, composable command menu** for React, powered by `cmdk`.

### Installation

    ```bash
    pnpm dlx shadcn@latest add command
    ```

### Usage

    ```typescript
    import {
      Command,
      CommandDialog,
      CommandEmpty,
      CommandGroup,
      CommandInput,
      CommandItem,
      CommandList,
      CommandSeparator,
      CommandShortcut
    } from "@/components/ui/command"
    ```

    ```tsx
    <Command>
      <CommandInput placeholder="Type a command..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Suggestions">
          <CommandItem>Calendar</CommandItem>
          <CommandItem>Search Emoji</CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
    ```

**Key Points**:
- Build your own “Ctrl + K” command palette or search.
- Combine with a **Dialog** or **Combobox** pattern for advanced usage.

---

## Context Menu

Displays a **menu** triggered by right-click (or a designated action).

### Installation

    ```bash
    pnpm dlx shadcn@latest add context-menu
    ```

### Usage

    ```typescript
    import {
      ContextMenu,
      ContextMenuContent,
      ContextMenuItem,
      ContextMenuTrigger
    } from "@/components/ui/context-menu"
    ```

    ```tsx
    <ContextMenu>
      <ContextMenuTrigger>Right click here</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem>Profile</ContextMenuItem>
        <ContextMenuItem>Billing</ContextMenuItem>
        <ContextMenuItem>Team</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
    ```

**Key Points**:
- Great for providing extra “options” to an element on right-click.
- Works similarly to **Dropdown Menu**, but triggered via `ContextMenuTrigger`.

---

## Data Table

Powerful **table** using [TanStack Table](https://tanstack.com/table).

### Installation

    ```bash
    pnpm dlx shadcn@latest add table
    pnpm add @tanstack/react-table
    ```

### Usage Overview

1. Define **columns** (`ColumnDef<T>`).
2. Render a custom `<DataTable>` that uses `useReactTable`.

    ```typescript
    // columns.tsx
    export const columns: ColumnDef<Payment>[] = [
      { accessorKey: "status", header: "Status" },
      // ...
    ]
    ```
    
    ```tsx
    // data-table.tsx
    import { useReactTable } from "@tanstack/react-table"

    <Table>
      <TableHeader>...</TableHeader>
      <TableBody>...</TableBody>
    </Table>
    ```

**Key Points**:
- Combine features like sorting, filtering, pagination, row selection, etc.
- Composes with the base `<Table />` from `@/components/ui/table`.

---

## Date Picker

A **date picker** using Calendar + Popover.

### Installation

- See [Calendar](/docs/components/calendar#installation) and [Popover](/docs/components/popover#installation).

### Usage

    ```tsx
    import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
    import { Calendar } from "@/components/ui/calendar"

    const [date, setDate] = React.useState<Date>()
    
    <Popover>
      <PopoverTrigger>Pick a date</PopoverTrigger>
      <PopoverContent>
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          initialFocus
        />
      </PopoverContent>
    </Popover>
    ```

**Key Points**:
- Common pattern for date selection in forms.
- Also can handle ranges if you pass the right props to `<Calendar>`.

---

## Dialog

A **window** overlaid on top of other content.

### Installation

    ```bash
    pnpm dlx shadcn@latest add dialog
    ```

### Usage

    ```typescript
    import {
      Dialog,
      DialogContent,
      DialogDescription,
      DialogFooter,
      DialogHeader,
      DialogTitle,
      DialogTrigger
    } from "@/components/ui/dialog"
    ```

    ```tsx
    <Dialog>
      <DialogTrigger>Open</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you sure?</DialogTitle>
          <DialogDescription>
            This action can’t be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>{/* actions */}</DialogFooter>
      </DialogContent>
    </Dialog>
    ```

**Key Points**:
- For multi-step or specialized confirmations, consider using **AlertDialog** instead.
- Can wrap `ContextMenu` or `DropdownMenu` triggers if needed.

---

## Drawer

A **drawer** component based on Vaul, typically slides from edges.

### Installation

    ```bash
    pnpm dlx shadcn@latest add drawer
    ```

### Usage

    ```typescript
    import {
      Drawer,
      DrawerClose,
      DrawerContent,
      DrawerDescription,
      DrawerFooter,
      DrawerHeader,
      DrawerTitle,
      DrawerTrigger
    } from "@/components/ui/drawer"
    ```

    ```tsx
    <Drawer>
      <DrawerTrigger>Open</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Are you sure?</DrawerTitle>
          <DrawerDescription>Cannot be undone.</DrawerDescription>
        </DrawerHeader>
        <DrawerFooter>
          <Button>Submit</Button>
          <DrawerClose>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
    ```

**Key Points**:
- Useful for mobile navigation or side panels.
- Can combine with a **Dialog** for a responsive approach.

---

## Dropdown Menu

A **menu** triggered by a button, typically used for actions or navigation.

### Installation

    ```bash
    pnpm dlx shadcn@latest add dropdown-menu
    ```

### Usage

    ```typescript
    import {
      DropdownMenu,
      DropdownMenuContent,
      DropdownMenuItem,
      DropdownMenuTrigger
    } from "@/components/ui/dropdown-menu"
    ```

    ```tsx
    <DropdownMenu>
      <DropdownMenuTrigger>Open</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>Profile</DropdownMenuItem>
        <DropdownMenuItem>Billing</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    ```

**Key Points**:
- Often used in toolbars or to group related actions under one button.
- Similar to **ContextMenu** but triggered on click vs. right-click.

---

## Form (React Hook Form integration)

A **form** wrapper around react-hook-form and zod, for accessible, validated forms.

### Installation

    ```bash
    pnpm dlx shadcn@latest add form
    ```

### Usage

    ```typescript
    import { useForm } from "react-hook-form"
    import { Form, FormField, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
    import { z } from "zod"
    import { zodResolver } from "@hookform/resolvers/zod"
    ```

    ```tsx
    const formSchema = z.object({
      username: z.string().min(2)
    })

    const form = useForm<z.infer<typeof formSchema>>({
      resolver: zodResolver(formSchema)
    })

    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
    ```

**Key Points**:
- Access to `FormItem`, `FormLabel`, `FormDescription`, `FormMessage` for structure.
- Minimizes boilerplate for hooking form fields into React Hook Form.

---

## Hover Card

A **hover-based** card to preview more information.

### Installation

    ```bash
    pnpm dlx shadcn@latest add hover-card
    ```

### Usage

    ```typescript
    import {
      HoverCard,
      HoverCardContent,
      HoverCardTrigger
    } from "@/components/ui/hover-card"
    ```

    ```tsx
    <HoverCard>
      <HoverCardTrigger>@nextjs</HoverCardTrigger>
      <HoverCardContent>
        The React Framework — created and maintained by @vercel.
      </HoverCardContent>
    </HoverCard>
    ```

---

## Input OTP

**One-time password** input with copy/paste functionality, built on `input-otp`.

### Installation

    ```bash
    pnpm dlx shadcn@latest add input-otp
    ```

### Usage

    ```typescript
    import {
      InputOTP,
      InputOTPGroup,
      InputOTPSeparator,
      InputOTPSlot
    } from "@/components/ui/input-otp"
    ```

    ```tsx
    <InputOTP maxLength={6}>
      <InputOTPGroup>
        <InputOTPSlot index={0} />
        <InputOTPSlot index={1} />
        <InputOTPSlot index={2} />
      </InputOTPGroup>
      <InputOTPSeparator />
      <InputOTPGroup>
        <InputOTPSlot index={3} />
        <InputOTPSlot index={4} />
        <InputOTPSlot index={5} />
      </InputOTPGroup>
    </InputOTP>
    ```

**Key Points**:
- `maxLength` determines total slots.  
- Each `InputOTPSlot` is mapped by an **index**.

---

## Input

A **text input** (or file input) for forms.

### Installation

    ```bash
    pnpm dlx shadcn@latest add input
    ```

### Usage

    ```typescript
    import { Input } from "@/components/ui/input"
    ```

    ```tsx
    <Input placeholder="Email address" />
    ```

---

## Label

An **accessible label** associated with form controls.

### Installation

    ```bash
    pnpm dlx shadcn@latest add label
    ```

### Usage

    ```typescript
    import { Label } from "@/components/ui/label"
    ```

    ```tsx
    <Label htmlFor="email">Your email address</Label>
    <Input id="email" />
    ```

---

## Menubar

A **persistent menu** commonly used in desktop-like UIs.

### Installation

    ```bash
    pnpm dlx shadcn@latest add menubar
    ```

### Usage

    ```typescript
    import {
      Menubar,
      MenubarContent,
      MenubarItem,
      MenubarMenu,
      MenubarSeparator,
      MenubarTrigger
    } from "@/components/ui/menubar"
    ```

    ```tsx
    <Menubar>
      <MenubarMenu>
        <MenubarTrigger>File</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>New Tab</MenubarItem>
          <MenubarSeparator />
          <MenubarItem>Print</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
    ```

---

## Navigation Menu

A **collection of links** for site or app navigation.

### Installation

    ```bash
    pnpm dlx shadcn@latest add navigation-menu
    ```

### Usage

    ```typescript
    import {
      NavigationMenu,
      NavigationMenuContent,
      NavigationMenuItem,
      NavigationMenuLink,
      NavigationMenuList,
      NavigationMenuTrigger
    } from "@/components/ui/navigation-menu"
    ```

    ```tsx
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Item One</NavigationMenuTrigger>
          <NavigationMenuContent>
            <NavigationMenuLink>Link</NavigationMenuLink>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
    ```

**Key Points**:
- Offers more advanced design than a simple navbar.  
- Supports triggers with sub-navigation content.

---

## Pagination

**Pagination** controls with next/previous, page links, etc.

### Installation

    ```bash
    pnpm dlx shadcn@latest add pagination
    ```

### Usage

    ```typescript
    import {
      Pagination,
      PaginationContent,
      PaginationLink,
      PaginationNext,
      PaginationPrevious
    } from "@/components/ui/pagination"
    ```

    ```tsx
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href="#" />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#">1</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href="#" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
    ```

---

## Popover

Displays **rich content** in a small overlay, triggered by a button.

### Installation

    ```bash
    pnpm dlx shadcn@latest add popover
    ```

### Usage

    ```typescript
    import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
    ```

    ```tsx
    <Popover>
      <PopoverTrigger>Open</PopoverTrigger>
      <PopoverContent>Some popover content</PopoverContent>
    </Popover>
    ```

---

## Progress

A **progress bar** showing completion of a task.

### Installation

    ```bash
    pnpm dlx shadcn@latest add progress
    ```

### Usage

    ```typescript
    import { Progress } from "@/components/ui/progress"
    ```

    ```tsx
    <Progress value={33} />
    ```

---

## Radio Group

A **set of checkable buttons** where only one can be selected at a time.

### Installation

    ```bash
    pnpm dlx shadcn@latest add radio-group
    ```

### Usage

    ```typescript
    import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
    import { Label } from "@/components/ui/label"
    ```

    ```tsx
    <RadioGroup defaultValue="option-one">
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option-one" id="option-one" />
        <Label htmlFor="option-one">Option One</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option-two" id="option-two" />
        <Label htmlFor="option-two">Option Two</Label>
      </div>
    </RadioGroup>
    ```

---

## Resizable

**Resizable panel groups** and layouts with keyboard support.

### Installation

    ```bash
    pnpm dlx shadcn@latest add resizable
    ```

### Usage

    ```typescript
    import {
      ResizablePanel,
      ResizablePanelGroup,
      ResizableHandle
    } from "@/components/ui/resizable"
    ```

    ```tsx
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel>One</ResizablePanel>
      <ResizableHandle />
      <ResizablePanel>Two</ResizablePanel>
    </ResizablePanelGroup>
    ```

**Key Points**:
- Great for IDE-like layouts or split views.

---

## Scroll Area

**Custom scroll styling** that augments native scroll.

### Installation

    ```bash
    pnpm dlx shadcn@latest add scroll-area
    ```

### Usage

    ```typescript
    import { ScrollArea } from "@/components/ui/scroll-area"
    ```

    ```tsx
    <ScrollArea className="h-[200px] w-[350px] rounded-md border p-4">
      Content goes here...
    </ScrollArea>
    ```

---

## Select

A **select** component that displays a list of options in a pop-up.

### Installation

    ```bash
    pnpm dlx shadcn@latest add select
    ```

### Usage

    ```typescript
    import {
      Select,
      SelectContent,
      SelectItem,
      SelectTrigger,
      SelectValue
    } from "@/components/ui/select"
    ```

    ```tsx
    <Select>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Theme" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="light">Light</SelectItem>
        <SelectItem value="dark">Dark</SelectItem>
        <SelectItem value="system">System</SelectItem>
      </SelectContent>
    </Select>
    ```

---

## Separator

Visually or semantically **separates** sections of content (e.g., lines).

### Installation

    ```bash
    pnpm dlx shadcn@latest add separator
    ```

### Usage

    ```typescript
    import { Separator } from "@/components/ui/separator"
    ```

    ```tsx
    <Separator />
    ```

---

## Sheet

An extended **Dialog** that appears along screen edges.

### Installation

    ```bash
    pnpm dlx shadcn@latest add sheet
    ```

### Usage

    ```typescript
    import {
      Sheet,
      SheetContent,
      SheetDescription,
      SheetHeader,
      SheetTitle,
      SheetTrigger
    } from "@/components/ui/sheet"
    ```

    ```tsx
    <Sheet>
      <SheetTrigger>Open</SheetTrigger>
      <SheetContent side="right" className="w-[400px]">
        <SheetHeader>
          <SheetTitle>Are you sure?</SheetTitle>
          <SheetDescription>This action cannot be undone.</SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
    ```

**Key Points**:
- Use `side="top" | "bottom" | "left" | "right"` to define the opening edge.
- Combine with custom widths or classes to create flexible side-drawers.

---

## Sidebar

A **composable** and **collapsible** sidebar solution.

### Installation

    ```bash
    pnpm dlx shadcn@latest add sidebar
    ```

### Usage Outline
- Wrap your app with `<SidebarProvider>` to manage state (and optionally persist it via cookies).
- Place a `<Sidebar>` which has `<SidebarHeader>`, `<SidebarContent>`, `<SidebarFooter>`.
- Compose **Sidebar Groups**, **Sidebar Menus**, and **SidebarMenuItems** within `<SidebarContent>`.

    ```tsx
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>...</SidebarHeader>
        <SidebarContent>...</SidebarContent>
        <SidebarFooter>...</SidebarFooter>
      </Sidebar>
      <main>
        <SidebarTrigger />
        {children}
      </main>
    </SidebarProvider>
    ```

**Key Points**:
- Supports “icon only” collapse or “offcanvas” mobile states.
- Extensively composable with submenus, collapsible groups, or advanced data fetching.

---

## Skeleton

A **placeholder** used to show while content is loading.

### Installation

    ```bash
    pnpm dlx shadcn@latest add skeleton
    ```

### Usage

    ```typescript
    import { Skeleton } from "@/components/ui/skeleton"
    ```

    ```tsx
    <Skeleton className="w-[100px] h-[20px] rounded-full" />
    ```

---

## Slider

A **range slider** input.

### Installation

    ```bash
    pnpm dlx shadcn@latest add slider
    ```

### Usage

    ```typescript
    import { Slider } from "@/components/ui/slider"
    ```

    ```tsx
    <Slider defaultValue={[33]} max={100} step={1} />
    ```

---

## Sonner (Toast notifications)

**Sonner** is an opinionated toast library.

### Installation

    ```bash
    pnpm dlx shadcn@latest add sonner
    ```

### Usage

1. In your layout:  
      
        ```tsx
        import { Toaster } from "@/components/ui/sonner"
        
        export default function RootLayout({ children }) {
          return (
            <html>
              <body>
                <main>{children}</main>
                <Toaster />
              </body>
            </html>
          )
        }
        ```
2. Show a toast:  
      
        ```tsx
        import { toast } from "sonner"
        
        toast("Event has been created.")
        ```

---

## Switch

A **switch** control (on/off).

### Installation

    ```bash
    pnpm dlx shadcn@latest add switch
    ```

### Usage

    ```typescript
    import { Switch } from "@/components/ui/switch"
    ```

    ```tsx
    <Switch />
    ```

---

## Table

A responsive **table** component for displaying tabular data.

### Installation

    ```bash
    pnpm dlx shadcn@latest add table
    ```

### Usage

    ```typescript
    import {
      Table,
      TableBody,
      TableCell,
      TableHead,
      TableHeader,
      TableRow,
      TableCaption
    } from "@/components/ui/table"
    ```

    ```tsx
    <Table>
      <TableCaption>A list of your recent invoices.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Invoice</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Method</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>INV001</TableCell>
          <TableCell>Paid</TableCell>
          <TableCell>Credit Card</TableCell>
          <TableCell className="text-right">$250.00</TableCell>
        </TableRow>
      </TableBody>
    </Table>
    ```

---

## Tabs

A set of **tabbed** sections displayed one at a time.

### Installation

    ```bash
    pnpm dlx shadcn@latest add tabs
    ```

### Usage

    ```typescript
    import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
    ```

    ```tsx
    <Tabs defaultValue="account" className="w-[400px]">
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
      </TabsList>
      <TabsContent value="account">Account info here.</TabsContent>
      <TabsContent value="password">Password update here.</TabsContent>
    </Tabs>
    ```

---

## Textarea

A **multiline text** input.

### Installation

    ```bash
    pnpm dlx shadcn@latest add textarea
    ```

### Usage

    ```typescript
    import { Textarea } from "@/components/ui/textarea"
    ```

    ```tsx
    <Textarea placeholder="Type your message here" />
    ```

---

## Toast

A succinct, **temporary message** for alerts.

### Installation

    ```bash
    pnpm dlx shadcn@latest add toast
    ```

### Usage

Similar to Sonner, but uses Shadcn’s own toast approach with `<Toaster>`:

    ```tsx
    import { Toaster } from "@/components/ui/toaster"
    import { useToast } from "@/hooks/use-toast"

    function Example() {
      const { toast } = useToast()
      return (
        <Button onClick={() => toast({ title: "Scheduled", description: "Friday" })}>
          Show Toast
        </Button>
      )
    }
    ```

---

## Toggle Group

A set of two-state buttons that can be toggled on/off, **single** or **multiple** type.

### Installation

    ```bash
    pnpm dlx shadcn@latest add toggle-group
    ```

### Usage

    ```typescript
    import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
    ```

    ```tsx
    <ToggleGroup type="single">
      <ToggleGroupItem value="a">A</ToggleGroupItem>
      <ToggleGroupItem value="b">B</ToggleGroupItem>
      <ToggleGroupItem value="c">C</ToggleGroupItem>
    </ToggleGroup>
    ```

---

## Toggle

A **two-state button** (on/off).

### Installation

    ```bash
    pnpm dlx shadcn@latest add toggle
    ```

### Usage

    ```typescript
    import { Toggle } from "@/components/ui/toggle"
    ```

    ```tsx
    <Toggle>Toggle</Toggle>
    ```

---

## Tooltip

A **hover/focus** popup containing info or hints.

### Installation

    ```bash
    pnpm dlx shadcn@latest add tooltip
    ```

### Usage

    ```typescript
    import {
      Tooltip,
      TooltipContent,
      TooltipProvider,
      TooltipTrigger
    } from "@/components/ui/tooltip"
    ```

    ```tsx
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>Hover me</TooltipTrigger>
        <TooltipContent>Tooltip text</TooltipContent>
      </Tooltip>
    </TooltipProvider>
    ```

---

## Typography

Base **typography** styles for headings, paragraphs, lists, blockquotes, etc.

### Note
- Typically includes classes like `.lead`, `.muted`, `.large`, etc.
- Structures content into headings (`h1, h2, h3, h4`), paragraphs (`p`), lists, and so on.

---

**End of Master Document.**  

Use this reference to guide your code generation AI in composing Shadcn UI components into rich interfaces. Feel free to mix and match elements (e.g., a `Button` inside a `CardFooter` or a `Select` inside a `FormField`) to build complex, elegant user experiences.
