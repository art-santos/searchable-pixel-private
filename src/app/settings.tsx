"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { CodeBlock } from "@/components/ui/code-block"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dropzone } from "@/components/ui/dropzone"
import { Separator } from "@/components/ui/separator"

export default function Settings() {
  const { toast } = useToast()
  const [appName, setAppName] = useState("Split App")
  const [logo, setLogo] = useState<File | null>(null)
  const [language, setLanguage] = useState("English")
  const [timeZone, setTimeZone] = useState("UTC")
  const [apiKey, setApiKey] = useState("sk_live_abc123")
  const [regenerateOpen, setRegenerateOpen] = useState(false)
  const [teamName, setTeamName] = useState("Acme Inc")
  const [billingEmail, setBillingEmail] = useState("billing@acme.com")
  const [inviteEmail, setInviteEmail] = useState("")
  const [members, setMembers] = useState([
    { id: 1, name: "Jane Doe", email: "jane@example.com", role: "Owner" },
    { id: 2, name: "John Smith", email: "john@example.com", role: "Member" },
  ])
  const [slackEnabled, setSlackEnabled] = useState(true)
  const [autoSync, setAutoSync] = useState(false)
  const [debugMode, setDebugMode] = useState(false)

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey)
    toast({ description: "API key copied" })
  }

  const handleRegenerate = () => {
    setApiKey(Math.random().toString(36).slice(2))
    setRegenerateOpen(false)
    toast({ description: "API key regenerated" })
  }

  const handleInvite = () => {
    if (!inviteEmail.trim()) return
    setMembers((prev) => [
      ...prev,
      { id: Date.now(), name: inviteEmail.split("@")[0], email: inviteEmail, role: "Member" },
    ])
    toast({ description: "Invitation sent" })
    setInviteEmail("")
  }

  const handleRemoveMember = (id: number) => {
    setMembers((prev) => prev.filter((m) => m.id !== id))
  }

  return (
    <main className="container max-w-5xl space-y-8 py-10">
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="danger">Danger</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="app-name">App Name</Label>
                <Input id="app-name" value={appName} onChange={(e) => setAppName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Logo</Label>
                {logo ? (
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={URL.createObjectURL(logo)} alt="logo" />
                    <AvatarFallback>Logo</AvatarFallback>
                  </Avatar>
                ) : null}
                <Dropzone onFileSelected={setLogo} className="mt-2">Upload Logo</Dropzone>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Default Language</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        {language}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {['English','Spanish','French'].map((lng) => (
                        <DropdownMenuItem key={lng} onSelect={() => setLanguage(lng)}>{lng}</DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="space-y-2">
                  <Label>Time Zone</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        {timeZone}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {['UTC','EST','PST'].map((tz) => (
                        <DropdownMenuItem key={tz} onSelect={() => setTimeZone(tz)}>{tz}</DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Input readOnly value={apiKey} className="font-mono" />
                <Button variant="outline" onClick={handleCopyKey}>Copy</Button>
                <Dialog open={regenerateOpen} onOpenChange={setRegenerateOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">Regenerate</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Regenerate API Key?</DialogTitle>
                    </DialogHeader>
                    <DialogFooter className="sm:justify-end">
                      <Button variant="outline" onClick={() => setRegenerateOpen(false)}>Cancel</Button>
                      <Button onClick={handleRegenerate}>Confirm</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              <div>
                <Label className="mb-2 block">Install Package</Label>
                <CodeBlock code="npm install split" />
              </div>
              <div className="space-y-2">
                <Label>Usage Example</Label>
                <ScrollArea className="max-h-60">
                  <CodeBlock
                    code={`import { SplitClient } from 'split'

const client = new SplitClient('${apiKey}')
client.init()
`}
                    showCopy={false}
                  />
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="team-name">Team Name</Label>
                  <Input id="team-name" value={teamName} onChange={(e) => setTeamName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="billing-email">Billing Email</Label>
                  <Input id="billing-email" value={billingEmail} onChange={(e) => setBillingEmail(e.target.value)} />
                </div>
              </div>
              <Separator />
              <div className="flex gap-2">
                <Input placeholder="Invite by email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
                <Button onClick={handleInvite}>Invite</Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>{m.name}</TableCell>
                      <TableCell>{m.email}</TableCell>
                      <TableCell>{m.role}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => handleRemoveMember(m.id)}>Remove</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Separator />
              <Tabs defaultValue="roles">
                <TabsList className="mt-2">
                  <TabsTrigger value="roles">Roles</TabsTrigger>
                  <TabsTrigger value="permissions">Permissions</TabsTrigger>
                </TabsList>
                <TabsContent value="roles" className="pt-4 text-sm text-muted-foreground">
                  Owners can manage billing and team. Members can contribute content.
                </TabsContent>
                <TabsContent value="permissions" className="pt-4 text-sm text-muted-foreground">
                  Configure granular permissions in your admin dashboard.
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="features" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Feature Toggles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Enable Slack Notifications</span>
                <Switch checked={slackEnabled} onCheckedChange={setSlackEnabled} />
              </div>
              <div className="flex items-center justify-between">
                <span>Enable Auto Sync</span>
                <Switch checked={autoSync} onCheckedChange={setAutoSync} />
              </div>
              <div className="flex items-center justify-between">
                <span>Enable Debug Mode</span>
                <Switch checked={debugMode} onCheckedChange={setDebugMode} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="danger" className="space-y-4">
          <Card className="border-red-800">
            <CardHeader>
              <CardTitle className="text-red-500">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Delete Team</p>
                  <p className="text-sm text-muted-foreground">Remove all team members and settings</p>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="destructive">Delete</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete team?</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
                    <DialogFooter>
                      <Button variant="outline">Cancel</Button>
                      <Button variant="destructive">Confirm</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Reset API Key</p>
                  <p className="text-sm text-muted-foreground">Generate a new key and revoke the old one</p>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="destructive">Reset</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Reset API key?</DialogTitle>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline">Cancel</Button>
                      <Button variant="destructive" onClick={handleRegenerate}>Confirm</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Wipe All Data</p>
                  <p className="text-sm text-muted-foreground">Delete all stored data permanently</p>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="destructive">Wipe</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Wipe all data?</DialogTitle>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline">Cancel</Button>
                      <Button variant="destructive">Confirm</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  )
}
