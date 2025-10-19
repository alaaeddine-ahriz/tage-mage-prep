'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

const FULL_TEST_SUBTESTS = [
  { key: 'comprehension', label: 'CDT' },
  { key: 'calcul', label: 'Calcul' },
  { key: 'argumentation', label: 'R&A' },
  { key: 'conditions', label: 'Conditions minimales' },
  { key: 'expression', label: 'Expression' },
  { key: 'logique', label: 'Logique' },
] as const

interface SubtestScore {
  subtest: string
  correctAnswers: string
  score: number
}

interface AddFullTestFormProps {
  onSuccess?: () => void
  existingTest?: {
    name: string
    subtests: Array<{ subtest: string; correct_answers: number }>
  }
}

export function AddFullTestForm({ onSuccess, existingTest }: AddFullTestFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: existingTest?.name || '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  })

  const [subtestScores, setSubtestScores] = useState<SubtestScore[]>(
    FULL_TEST_SUBTESTS.map(st => {
      const existingSubtest = existingTest?.subtests.find(s => s.subtest === st.key)
      return {
        subtest: st.key,
        correctAnswers: existingSubtest ? String(existingSubtest.correct_answers) : '',
        score: existingSubtest ? existingSubtest.correct_answers * 4 : 0,
      }
    })
  )

  // Calculer le score pour un sous-test (4 pts par bonne réponse)
  const calculateScore = (correctAnswers: number): number => {
    return correctAnswers * 4
  }

  // Mettre à jour les bonnes réponses et calculer le score
  const handleCorrectAnswersChange = (index: number, value: string) => {
    const numValue = parseInt(value) || 0
    const clampedValue = Math.max(0, Math.min(15, numValue))
    
    const newScores = [...subtestScores]
    newScores[index] = {
      ...newScores[index],
      correctAnswers: value,
      score: calculateScore(clampedValue),
    }
    setSubtestScores(newScores)
  }

  // Calculer le score total sur 600
  const getTotalScore = (): number => {
    // Raw score (6 subtests × 15 questions × 4 points = 360 max)
    const rawScore = subtestScores.reduce((sum, st) => {
      const correct = parseInt(st.correctAnswers) || 0
      return sum + calculateScore(correct)
    }, 0)
    // Normalize to 600
    return Math.round((rawScore / 360) * 600)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    const allFilled = subtestScores.every(st => st.correctAnswers !== '')
    if (!allFilled) {
      toast.error('Veuillez remplir tous les sous-tests')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        toast.error('Vous devez être connecté')
        return
      }

      const totalScore = getTotalScore()

      // Insert full test
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: fullTest, error: fullTestError } = await (supabase as any)
        .from('full_tests')
        .insert({
          user_id: user.id,
          name: formData.name,
          date: new Date(formData.date).toISOString(),
          type: 'Blanc',
          total_score: totalScore,
          duration_minutes: null,
          notes: formData.notes || null,
        })
        .select()
        .single()

      if (fullTestError) throw fullTestError

      // Insert all subtests
      const subtestInserts = subtestScores.map(st => ({
        full_test_id: fullTest.id,
        subtest: st.subtest,
        correct_answers: parseInt(st.correctAnswers),
        score: st.score,
      }))

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: subtestsError } = await (supabase as any)
        .from('full_test_subtests')
        .insert(subtestInserts)

      if (subtestsError) throw subtestsError

      toast.success(`Test "${formData.name}" enregistré ! Score : ${totalScore}/600`)
      
      // Reset form
      setFormData({
        name: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
      })
      setSubtestScores(
        FULL_TEST_SUBTESTS.map(st => ({
          subtest: st.key,
          correctAnswers: '',
          score: 0,
        }))
      )

      router.refresh()
      onSuccess?.()
    } catch (error) {
      console.error('Error adding full test:', error)
      toast.error('Erreur lors de l\'enregistrement')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-foreground">Nom du test</h3>
        <Input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Ex: Annales 2023, Test blanc #1..."
          required
        />
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-foreground">Date</h3>
        <Input
          id="date"
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">Scores par sous-test</h3>
          <span className="text-sm font-semibold text-primary">
            Total : {getTotalScore()}/600
          </span>
        </div>
        <div className="space-y-2">
          {FULL_TEST_SUBTESTS.map((subtest, index) => (
            <div key={subtest.key} className="flex items-center gap-3">
              <Label className="flex-1 text-sm">
                {subtest.label}
              </Label>
              <Input
                type="number"
                min="0"
                max="15"
                value={subtestScores[index].correctAnswers}
                onChange={(e) => handleCorrectAnswersChange(index, e.target.value)}
                placeholder="0"
                required
                className="w-20 text-center"
              />
              <span className="text-sm font-semibold text-muted-foreground w-16 text-right">
                {subtestScores[index].score}/60
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-foreground">Notes (optionnel)</h3>
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

