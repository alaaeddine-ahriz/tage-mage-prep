'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { FloatingButtonsContainer, FloatingButton } from '@/components/ui/floating-buttons'
import { useIsMobile } from '@/lib/hooks/useIsMobile'

import { SUBTEST_OPTIONS as SUBTESTS, SUBTEST_LABELS } from '@/lib/constants/subtests'
import { useDashboardData } from '@/lib/state/dashboard-data'

interface AddTestFormProps {
  onSuccess?: () => void
}

export function AddTestForm({ onSuccess }: AddTestFormProps) {
  const isMobile = useIsMobile()
  const { refreshTests } = useDashboardData()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    date: new Date().toISOString().split('T')[0],
    type: 'TD' as 'TD' | 'Blanc',
    subtest: '',
    score: '',
    duration_minutes: '',
    notes: '',
  })

  const maxScore = formData.type === 'Blanc' ? 60 : 15
  const scoreLabel = formData.type === 'Blanc' ? 'Score (/60)' : 'Bonnes réponses (/15)'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedName = formData.name.trim()

    setLoading(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        toast.error('Vous devez être connecté')
        return
      }

      let finalName = trimmedName

      if (!finalName) {
        const { count, error: countError } = await supabase
          .from('tests')
          .select('id', { head: true, count: 'exact' })
          .eq('user_id', user.id)
          .eq('subtest', formData.subtest)

        if (countError) {
          throw countError
        }

        const baseName =
          SUBTEST_LABELS[formData.subtest] ||
          (formData.subtest ? formData.subtest.charAt(0).toUpperCase() + formData.subtest.slice(1) : 'Test')

        finalName = `${baseName} #${(count ?? 0) + 1}`
      }

      const scoreValue = parseInt(formData.score)
      const normalizedScore = formData.type === 'TD' ? scoreValue * 4 : scoreValue

      const { error } = await supabase.from('tests').insert({
        user_id: user.id,
        date: new Date(formData.date).toISOString(),
        type: formData.type,
        subtest: formData.subtest,
        name: finalName,
        score: normalizedScore,
        duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
        notes: formData.notes || null,
      })

      if (error) throw error

      toast.success('Test enregistré avec succès!')
      
      // Reset form
      setFormData({
        name: '',
        date: new Date().toISOString().split('T')[0],
        type: 'TD',
        subtest: formData.subtest, // Keep last subtest selected
        score: '',
        duration_minutes: '',
        notes: '',
      })

      await refreshTests()
      onSuccess?.()
    } catch (error) {
      console.error('Error adding test:', error)
      toast.error('Erreur lors de l\'enregistrement')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
    <form onSubmit={handleSubmit} className={`space-y-4 ${isMobile ? 'pb-32' : ''}`}>
      <div className="space-y-2">
        <Label htmlFor="name">Nom du test (optionnel)</Label>
        <Input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Laissez vide pour générer un nom"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="date">Date</Label>
        <Input
          id="date"
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Type</Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={formData.type === 'TD' ? 'default' : 'outline'}
            onClick={() => setFormData({ ...formData, type: 'TD' })}
            className="flex-1"
          >
            TD
          </Button>
          <Button
            type="button"
            variant={formData.type === 'Blanc' ? 'default' : 'outline'}
            onClick={() => setFormData({ ...formData, type: 'Blanc' })}
            className="flex-1"
          >
            Blanc
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="subtest">Sous-test</Label>
        <Select
          value={formData.subtest}
          onValueChange={(value) =>
            setFormData((prev) => ({
              ...prev,
              subtest: value,
              name: prev.name.trim()
                ? prev.name
                : (SUBTEST_LABELS[value] ||
                    (value ? value.charAt(0).toUpperCase() + value.slice(1) : '')),
            }))
          }
          required
        >
          <SelectTrigger id="subtest" className="w-full">
            <SelectValue placeholder="Sélectionner un sous-test" />
          </SelectTrigger>
          <SelectContent>
            {SUBTESTS.map((subtest) => (
              <SelectItem key={subtest.value} value={subtest.value}>
                {subtest.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="score">{scoreLabel}</Label>
        <Input
          id="score"
          type="number"
          min="0"
          max={maxScore}
          step="1"
          value={formData.score}
          onChange={(e) => setFormData({ ...formData, score: e.target.value })}
          placeholder="0"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="duration">Durée (minutes, optionnel)</Label>
        <Input
          id="duration"
          type="number"
          min="0"
          value={formData.duration_minutes}
          onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
          placeholder="20"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optionnel)</Label>
        <Input
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Commentaires sur ce test..."
        />
      </div>

      {!isMobile && (
        <div className="flex justify-end gap-3 pt-2">
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enregistrer
          </Button>
        </div>
      )}
    </form>
    
    {isMobile && (
      <FloatingButtonsContainer>
        <FloatingButton type="button" onClick={handleSubmit} disabled={loading}>
          {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
          Enregistrer
        </FloatingButton>
      </FloatingButtonsContainer>
    )}
    </>
  )
}
