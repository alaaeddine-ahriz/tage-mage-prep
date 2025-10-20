'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { compressImage, validateImageFile } from '@/lib/utils/image-compression'
import { toast } from 'sonner'
import { Image as ImageIcon, Loader2, X } from 'lucide-react'
import { FloatingButtonsContainer, FloatingButton } from '@/components/ui/floating-buttons'
import { useIsMobile } from '@/lib/hooks/useIsMobile'

import { SUBTEST_OPTIONS as SUBTESTS } from '@/lib/constants/subtests'
import { useDashboardData } from '@/lib/state/dashboard-data'

interface AddErrorFormProps {
  onSuccess?: () => void
}

export function AddErrorForm({ onSuccess }: AddErrorFormProps) {
  const isMobile = useIsMobile()
  const { refreshErrors } = useDashboardData()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    subtest: '',
    description: '',
  })

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      validateImageFile(file)
      const compressed = await compressImage(file)
      setImageFile(compressed)

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(compressed)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors du traitement de l\'image'
      toast.error(message)
    }
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation: au moins une photo OU une description
    if (!imageFile && !formData.description.trim()) {
      toast.error('Ajoutez une photo ou une description')
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

      let imageUrl = null

      // Upload image if present
      if (imageFile) {
        const fileName = `${user.id}/${Date.now()}-${imageFile.name}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('error-images')
          .upload(fileName, imageFile)

        if (uploadError) {
          console.error('Upload error:', uploadError)
          toast.error('Erreur lors de l\'upload de l\'image')
          return
        }

        const { data: { publicUrl } } = supabase.storage
          .from('error-images')
          .getPublicUrl(uploadData.path)

        imageUrl = publicUrl
      }

      // Calculate initial next review (1 day for mastery_level 0)
      const nextReview = new Date()
      nextReview.setDate(nextReview.getDate() + 1)

      const descriptionValue = formData.description.trim()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from('errors').insert({
        user_id: user.id,
        subtest: formData.subtest,
        image_url: imageUrl,
        explanation: descriptionValue || null,
        mastery_level: 0,
        next_review_at: nextReview.toISOString(),
        review_count: 0,
      })

      if (error) throw error

      toast.success('Erreur enregistrée ! À réviser demain')
      
      // Reset form
      setFormData({
        subtest: formData.subtest, // Keep last subtest selected
        description: '',
      })
      removeImage()

      await refreshErrors()
      onSuccess?.()
    } catch (error) {
      console.error('Error adding error:', error)
      toast.error('Erreur lors de l\'enregistrement')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
    <form onSubmit={handleSubmit} className={`space-y-4 ${isMobile ? 'pb-32' : ''}`}>
      {/* Image Upload */}
      <div className="space-y-2">
        <Label>Photo (optionnel)</Label>
        {imagePreview ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imagePreview}
              alt="Preview"
              className="w-full rounded-lg border"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute right-2 top-2"
              onClick={removeImage}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            className="h-24 w-full"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex flex-col items-center gap-2">
              <ImageIcon className="h-8 w-8" />
              <span className="text-sm">Ajouter une photo</span>
            </div>
          </Button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageSelect}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="subtest">Sous-test *</Label>
        <Select
          value={formData.subtest}
          onValueChange={(value) => setFormData({ ...formData, subtest: value })}
          required
        >
          <SelectTrigger id="subtest" className="w-full">
            <SelectValue placeholder="Sélectionner..." />
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
        <Label htmlFor="description">Description (optionnel)</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Ex: Problème de calcul mental sur les fractions..."
        />
        <p className="text-xs text-muted-foreground">
          Photo ou description requise
        </p>
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
