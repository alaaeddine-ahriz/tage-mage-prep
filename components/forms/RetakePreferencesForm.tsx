'use client'

import { useEffect, useMemo, useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useDashboardData } from '@/lib/state/dashboard-data'
import { DEFAULT_RETAKE_INTERVAL_DAYS } from '@/lib/utils/retakes'

interface RetakePreferencesFormProps {
  onSaved?: () => void
}

export function RetakePreferencesForm({ onSaved }: RetakePreferencesFormProps) {
  const {
    retakeIntervalDays,
    refreshRetakePreferences,
  } = useDashboardData()
  const [inputValue, setInputValue] = useState<string>(DEFAULT_RETAKE_INTERVAL_DAYS.toString())
  const [isSaving, setIsSaving] = useState(false)

  const currentValue = useMemo(() => {
    if (!retakeIntervalDays || retakeIntervalDays <= 0) {
      return DEFAULT_RETAKE_INTERVAL_DAYS
    }
    return retakeIntervalDays
  }, [retakeIntervalDays])

  useEffect(() => {
    setInputValue(currentValue.toString())
  }, [currentValue])

  const handleSave = async () => {
    const parsed = Number.parseInt(inputValue, 10)
    const sanitized = Number.isNaN(parsed) || parsed <= 0 ? DEFAULT_RETAKE_INTERVAL_DAYS : Math.min(Math.max(parsed, 1), 60)

    setIsSaving(true)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error('Vous devez être connecté')
        return
      }

      const { error } = await supabase
        .from('user_preferences')
        .upsert(
          {
            user_id: user.id,
            default_retake_delay_days: sanitized,
          },
          { onConflict: 'user_id' }
        )

      if (error) throw error

      await refreshRetakePreferences()
      toast.success('Préférences mises à jour')
      onSaved?.()
    } catch (error) {
      console.error('Error saving retake preferences:', error)
      toast.error('Impossible d’enregistrer les préférences')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="retake-interval">Revoir mes tests après</Label>
        <div className="flex items-center gap-2">
          <Input
            id="retake-interval"
            type="number"
            min={1}
            max={60}
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            className="w-28"
          />
          <span className="text-sm text-muted-foreground">
            jour{Number.parseInt(inputValue || '0', 10) > 1 ? 's' : ''}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          Ce délai s’applique aux TD Logique, Conditions, Calcul et aux tests complets.
        </p>
      </div>

      <Button
        type="button"
        onClick={handleSave}
        disabled={isSaving}
        className="w-full sm:w-auto"
      >
        {isSaving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Enregistrement...
          </>
        ) : (
          'Enregistrer'
        )}
      </Button>
    </div>
  )
}
