'use client'

import { useEffect, useRef, useState } from 'react'
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
import { FloatingButton, FloatingButtonsContainer } from '@/components/ui/floating-buttons'
import { createClient } from '@/lib/supabase/client'
import { compressImage, validateImageFile } from '@/lib/utils/image-compression'
import { useIsMobile } from '@/lib/hooks/useIsMobile'
import { SUBTEST_OPTIONS as SUBTESTS } from '@/lib/constants/subtests'
import { useDashboardData } from '@/lib/state/dashboard-data'
import type { Notion } from '@/lib/types/database.types'
import { Loader2, Image as ImageIcon, X } from 'lucide-react'
import { toast } from 'sonner'

interface EditNotionFormProps {
  notion: Notion
  onSuccess?: () => void
}

export function EditNotionForm({ notion, onSuccess }: EditNotionFormProps) {
  const isMobile = useIsMobile()
  const { refreshNotions } = useDashboardData()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    subtest: notion.subtest,
    title: notion.title ?? '',
    description: notion.description ?? '',
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(notion.image_url)
  const [imageRemoved, setImageRemoved] = useState(false)

  useEffect(() => {
    setFormData({
      subtest: notion.subtest,
      title: notion.title ?? '',
      description: notion.description ?? '',
    })
    setImagePreview(notion.image_url)
    setImageFile(null)
    setImageRemoved(false)
  }, [notion])

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      validateImageFile(file)
      const compressed = await compressImage(file)
      setImageFile(compressed)
      setImageRemoved(false)

      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(compressed)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erreur lors du traitement de l’image'
      toast.error(message)
    }
  }

  const handleRemoveImage = () => {
    setImagePreview(null)
    setImageFile(null)
    setImageRemoved(true)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!formData.title.trim()) {
      toast.error('Ajoutez un titre')
      return
    }

    if (!formData.subtest) {
      toast.error('Sélectionnez un sous-test')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error('Vous devez être connecté')
        return
      }

      let imageUrl = notion.image_url

      if (imageRemoved) {
        imageUrl = null
      }

      if (imageFile) {
        const fileName = `${user.id}/${Date.now()}-${imageFile.name}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('error-images')
          .upload(fileName, imageFile, { upsert: true })

        if (uploadError) {
          console.error('Upload error:', uploadError)
          toast.error('Erreur lors de l’upload de l’image')
          return
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from('error-images').getPublicUrl(uploadData.path)

        imageUrl = publicUrl
      }

      const { error } = await supabase
        .from('notions')
        .update({
          subtest: formData.subtest,
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          image_url: imageUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', notion.id)

      if (error) throw error

      toast.success('Notion mise à jour')
      await refreshNotions()
      onSuccess?.()
    } catch (error) {
      console.error('Error updating notion:', error)
      toast.error('Erreur lors de la mise à jour')
    } finally {
      setLoading(false)
    }
  }

  const formContent = (
    <form onSubmit={handleSubmit} className={`space-y-4 ${isMobile ? 'pb-32' : ''}`}>
      <div className="space-y-2">
        <Label>Photo (optionnel)</Label>
        {imagePreview ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imagePreview} alt="Preview" className="w-full rounded-lg border" />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute right-2 top-2"
              onClick={handleRemoveImage}
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
        <Label htmlFor="subtest">Sous-test</Label>
        <Select
          value={formData.subtest}
          onValueChange={(value) => setFormData((prev) => ({ ...prev, subtest: value }))}
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
        <Label htmlFor="title">Titre</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(event) =>
            setFormData((prev) => ({ ...prev, title: event.target.value }))
          }
          placeholder="Ex: Table de multiplication de 13"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (optionnel)</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(event) =>
            setFormData((prev) => ({ ...prev, description: event.target.value }))
          }
          placeholder="Détails de la notion..."
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
  )

  if (!isMobile) {
    return formContent
  }

  return (
    <>
      {formContent}
      <FloatingButtonsContainer>
        <FloatingButton type="button" onClick={handleSubmit} disabled={loading}>
          {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
          Enregistrer
        </FloatingButton>
      </FloatingButtonsContainer>
    </>
  )
}
