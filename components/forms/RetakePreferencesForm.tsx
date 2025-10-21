'use client'

import { useEffect, useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { 
  DEFAULT_RETAKE_INTERVAL_DAYS, 
  DEFAULT_RETAKE_SCORE_THRESHOLD,
  getUserRetakeIntervalDays,
  getUserRetakeScoreThreshold 
} from '@/lib/utils/retakes'
import { FloatingButtonsContainer, FloatingButton } from '@/components/ui/floating-buttons'
import { useIsMobile } from '@/lib/hooks/useIsMobile'

interface RetakePreferencesFormProps {
  onSaved?: () => void
}

export function RetakePreferencesForm({ onSaved }: RetakePreferencesFormProps) {
  const isMobile = useIsMobile()
  const [intervalValue, setIntervalValue] = useState<string>(DEFAULT_RETAKE_INTERVAL_DAYS.toString())
  const [thresholdValue, setThresholdValue] = useState<string>(DEFAULT_RETAKE_SCORE_THRESHOLD.toString())
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadCurrentValue = async () => {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) return

        const [intervalDays, threshold] = await Promise.all([
          getUserRetakeIntervalDays(supabase, user.id),
          getUserRetakeScoreThreshold(supabase, user.id),
        ])
        setIntervalValue(intervalDays.toString())
        setThresholdValue(threshold.toString())
      } catch (error) {
        console.error('Error loading retake preferences:', error)
      } finally {
        setIsLoading(false)
      }
    }

    void loadCurrentValue()
  }, [])

  const handleSave = async () => {
    const parsedInterval = Number.parseInt(intervalValue, 10)
    const parsedThreshold = Number.parseInt(thresholdValue, 10)
    
    const sanitizedInterval = Number.isNaN(parsedInterval) || parsedInterval <= 0 
      ? DEFAULT_RETAKE_INTERVAL_DAYS 
      : Math.min(Math.max(parsedInterval, 1), 60)
    
    const sanitizedThreshold = Number.isNaN(parsedThreshold) || parsedThreshold <= 0 || parsedThreshold > 100
      ? DEFAULT_RETAKE_SCORE_THRESHOLD
      : Math.min(Math.max(parsedThreshold, 1), 100)

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
            default_retake_delay_days: sanitizedInterval,
            retake_score_threshold: sanitizedThreshold,
          },
          { onConflict: 'user_id' }
        )

      if (error) throw error

      toast.success('Préférences mises à jour')
      
      // Refresh global state if available (optional)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('retake-preferences-updated'))
      }
      
      onSaved?.()
    } catch (error) {
      console.error('Error saving retake preferences:', error)
      toast.error("Impossible d'enregistrer les préférences")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="retake-interval">Revoir mes tests après</Label>
          <div className="flex items-center gap-2 w-full">
            <Input
              id="retake-interval"
              type="number"
              min={1}
              max={60}
              value={intervalValue}
              onChange={(event) => setIntervalValue(event.target.value)}
              className="flex-1"
            />
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              jour{Number.parseInt(intervalValue || '0', 10) > 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Pour les tests faits une seule fois.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="retake-threshold">Seuil de score pour refaire un test</Label>
          <div className="flex items-center gap-2 w-full">
            <Input
              id="retake-threshold"
              type="number"
              min={1}
              max={100}
              value={thresholdValue}
              onChange={(event) => setThresholdValue(event.target.value)}
              className="flex-1"
            />
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              %
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Si le score de la dernière tentative est inférieur à ce seuil, le test apparaît comme à refaire.
          </p>
        </div>

        {!isMobile && (
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="w-full"
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
        )}
      </div>

      {isMobile && (
        <FloatingButtonsContainer>
          <FloatingButton type="button" onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
            Enregistrer
          </FloatingButton>
        </FloatingButtonsContainer>
      )}
    </>
  )
}
