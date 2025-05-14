'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function Profile() {
  const { user, supabase, loading } = useAuth()
  const [isUpdating, setIsUpdating] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  const handleSignOut = async () => {
    if (!supabase) return
    
    await supabase.auth.signOut()
  }
  
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase || !user) return
    
    setIsUpdating(true)
    setMessage(null)
    
    // In a real app, you'd update the user's profile in Supabase or your database
    // This is a mock implementation
    try {
      // Simulate an API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setMessage({ type: 'success', text: 'Profile updated successfully!' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile' })
    } finally {
      setIsUpdating(false)
    }
  }
  
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent text-primary" />
      </div>
    )
  }

  return (
    <main className="container max-w-4xl py-10">
      <h1 className="text-3xl font-bold mb-6">Your Profile</h1>
      
      {message && (
        <Alert className={message.type === 'success' ? "bg-green-50 text-green-800 border-green-200 mb-6" : "bg-red-50 text-red-800 border-red-200 mb-6"}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}
      
      <div className="grid gap-6">
        {/* User Info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Review and update your account details</CardDescription>
          </CardHeader>
          <CardContent className="pt-0 pb-0">
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6 items-start sm:items-center mb-6">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.email || ''} />
                <AvatarFallback>{user?.email?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium">{user?.email?.split('@')[0] || 'User'}</h3>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <p className="text-xs text-muted-foreground mt-1">Joined on {new Date(user?.created_at || Date.now()).toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Settings Tabs */}
        <Tabs defaultValue="account">
          <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-2 md:grid-cols-3">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>
          
          <TabsContent value="account" className="p-0 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Account Details</CardTitle>
                <CardDescription>Update your account information</CardDescription>
              </CardHeader>
              <form onSubmit={handleProfileUpdate}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" defaultValue={user?.user_metadata?.name || user?.email?.split('@')[0] || ''} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" defaultValue={user?.email || ''} readOnly />
                    <p className="text-xs text-muted-foreground">Your email cannot be changed</p>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setMessage(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isUpdating}>
                    {isUpdating ? "Saving..." : "Save Changes"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications" className="p-0 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Configure how you receive notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Notification settings will be available soon.</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="security" className="p-0 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Security</CardTitle>
                <CardDescription>Manage your account security</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-medium">Password</h3>
                  <p className="text-sm text-muted-foreground">
                    You can reset your password by clicking the button below.
                  </p>
                  <Button variant="outline" size="sm">
                    Reset Password
                  </Button>
                </div>
                
                <div className="space-y-2 pt-4 border-t">
                  <h3 className="font-medium text-destructive">Danger Zone</h3>
                  <p className="text-sm text-muted-foreground">
                    Once you sign out, you'll need to login again to access your account.
                  </p>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={handleSignOut}
                  >
                    Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
} 