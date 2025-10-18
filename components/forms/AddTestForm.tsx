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
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

const SUBTESTS = [
  { value: 'calcul', label: 'Calcul' },
  { value: 'logique', label: 'Logique' },
  { value: 'expression', label: 'Expression' },
  { value: 'comprehension', label: 'Compréhension' },
  { value: 'conditions', label: 'Conditions' },
]

interface AddTestFormProps {
  onSuccess?: () => void
}

export function AddTestForm({ onSuccess }: AddTestFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'TD' as 'TD' | 'blanc',
    subtest: '',
    score: '',
    duration_minutes: '',
    notes: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        toast.error('Vous devez être connecté')
        return
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from('tests').insert({
        user_id: user.id,
        date: new Date(formData.date).toISOString(),
        type: formData.type,
        subtest: formData.subtest,
        score: parseInt(formData.score),
        duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
        notes: formData.notes || null,
      })

      if (error) throw error

      toast.success('Test enregistré avec succès!')
      
      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        type: 'TD',
        subtest: formData.subtest, // Keep last subtest selected
        score: '',
        duration_minutes: '',
        notes: '',
      })

      router.refresh()
      onSuccess?.()
    } catch (error) {
      console.error('Error adding test:', error)
      toast.error('Erreur lors de l\'enregistrement')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
            variant={formData.type === 'blanc' ? 'default' : 'outline'}
            onClick={() => setFormData({ ...formData, type: 'blanc' })}
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
          onValueChange={(value) => setFormData({ ...formData, subtest: value })}
          required
        >
          <SelectTrigger id="subtest">
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
        <Label htmlFor="score">Score (/15)</Label>
        <Input
          id="score"
          type="number"
          min="0"
          max="15"
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
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Commentaires sur ce test..."
          rows={3}
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Enregistrer
      </Button>
    </form>
  )
}


