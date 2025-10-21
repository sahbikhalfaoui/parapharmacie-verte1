"use client"
import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { XIcon, ImageIcon } from "./icons"
import { apiRequest } from "../lib/api"
import { Category, SubCategory } from "../types"

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category | SubCategory | null;
  onSave: () => void;
  type: 'category' | 'subcategory';
  categories?: Category[];
}

interface CategoryFormData {
  name: string;
  description: string;
  category: string;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({ 
  isOpen, 
  onClose, 
  category, 
  onSave, 
  type = 'category', 
  categories = [] 
}) => {
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    category: ''
  })
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        description: category.description || '',
        category: type === 'subcategory' ? 
          (typeof (category as SubCategory).category === 'string' ? 
            (category as SubCategory).category : 
            (category as SubCategory).category?._id || '') : ''
      })
      if (category.image) {
        setImagePreview(`http://localhost:5000${category.image}`)
      }
    } else {
      setFormData({ name: '', description: '', category: '' })
      setImagePreview('')
    }
    setSelectedImage(null)
  }, [category, isOpen, type])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const formDataToSend = new FormData()
      
      Object.keys(formData).forEach(key => {
        const value = formData[key as keyof CategoryFormData]
        if (value !== undefined && value !== '') {
          formDataToSend.append(key, value)
        }
      })

      if (selectedImage) {
        formDataToSend.append('image', selectedImage)
      }

      const endpoint = type === 'subcategory' ? '/subcategories' : '/categories'
      const fullEndpoint = category ? `${endpoint}/${category._id}` : endpoint
      const method = category ? 'PUT' : 'POST'

      await apiRequest(fullEndpoint, {
        method,
        body: formDataToSend
      })

      onSave()
      onClose()
    } catch (error) {
      console.error('Error saving category:', error)
      alert('Erreur lors de la sauvegarde: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  const title = type === 'subcategory' ? 
    (category ? 'Modifier la Sous-catégorie' : 'Nouvelle Sous-catégorie') :
    (category ? 'Modifier la Catégorie' : 'Nouvelle Catégorie')

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white border rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">{title}</h3>
          <Button variant="ghost" onClick={onClose}>
            <XIcon className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="image">Image</Label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />
            {imagePreview && (
              <div className="mt-2">
                <img src={imagePreview} alt="Preview" className="h-20 w-20 object-cover rounded" />
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="name">Nom *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
            />
          </div>

          {type === 'subcategory' && (
            <div>
              <Label htmlFor="category">Catégorie Parente *</Label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              >
                <option value="">Sélectionner une catégorie</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex space-x-2 pt-4">
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'Sauvegarde...' : (category ? 'Mettre à Jour' : 'Créer')}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Annuler
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}