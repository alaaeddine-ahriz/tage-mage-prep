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
import { calculateNextReviewDate } from '@/lib/utils/spaced-repetition'
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

interface AddNotionFormProps {
  onSuccess?: () => void
}

export function AddNotionForm({ onSuccess }: AddNotionFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    subtest: '',
    title: '',
    description: '',
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

      const nextReview = calculateNextReviewDate(0)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from('notions').insert({
        user_id: user.id,
        subtest: formData.subtest,
        title: formData.title,
        description: formData.description || null,
        mastery_level: 0,
        next_review_at: nextReview.toISOString(),
        review_count: 0,
      })

      if (error) throw error

      toast.success('Notion créée avec succès!')
      
      // Reset form
      setFormData({
        subtest: formData.subtest, // Keep last subtest selected
        title: '',
        description: '',
      })

      router.refresh()
      onSuccess?.()
    } catch (error) {
      console.error('Error adding notion:', error)
      toast.error('Erreur lors de la création')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
        <Label htmlFor="title">Titre</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Ex: Table de multiplication de 13"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (optionnel)</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Détails de la notion..."
          rows={4}
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Créer
      </Button>
    </form>
  )
}


