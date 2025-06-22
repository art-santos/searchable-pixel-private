'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'
import { featureFlags } from '@/lib/feature-flags'

export function FeaturesSettings() {
  const [features, setFeatures] = useState(featureFlags)
  const [showReloadBanner, setShowReloadBanner] = useState(false)

  const handleFeatureToggle = (feature: keyof typeof featureFlags) => {
    setFeatures(prev => ({
      ...prev,
      [feature]: !prev[feature]
    }))
    setShowReloadBanner(true)
  }

  return (
    <div className="space-y-6">


      {/* Reload Banner */}
      {showReloadBanner && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-black font-medium">Page reload required</p>
            <p className="text-xs text-gray-500 mt-1">
              Changes to feature flags require a page reload to take effect.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => window.location.reload()}
            className="bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 text-yellow-600"
          >
            Reload Page
          </Button>
        </div>
      )}

      {/* Feature Toggles */}
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-gray-900">Available Features</CardTitle>
          <CardDescription className="text-sm text-gray-600">
            Toggle experimental features on or off
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Light Mode Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="font-medium text-gray-900 text-sm">Light Mode</div>
              <div className="text-xs text-gray-600">
                Enable light mode theme option (currently disabled for stability)
              </div>
            </div>
            <Switch
              checked={features.lightModeEnabled}
              onCheckedChange={() => handleFeatureToggle('lightModeEnabled')}
              disabled={true}
              className="opacity-50"
            />
          </div>

          {/* Coming Soon Message */}
          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-600 italic">
              More feature flags coming soon. Light mode is currently disabled while we optimize the UI for dark mode.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 