"use client"
import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { XIcon, ImageIcon } from "./icons"
import { apiRequest } from "../lib/api"
import { Product, Category, SubCategory } from "../types"

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onSave: () => void;
  categories: Category[];
  subCategories: SubCategory[];
}

interface ProductFormData {
  name: string;
  description: string;
  price: string;
  originalPrice: string;
  category: string;
  subCategory: string;
  badge: string;
  stockQuantity: number;
  inStock: boolean;
}

export const ProductModal: React.FC<ProductModalProps> = ({ 
  isOpen, 
  onClose, 
  product, 
  onSave, 
  categories, 
  subCategories 
}) => {
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    category: '',
    subCategory: '',
    badge: '',
    stockQuantity: 100,
    inStock: true
  })
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [imagePreview, setImagePreview] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price || '',
        originalPrice: product.originalPrice || '',
        category: typeof product.category === 'string' ? product.category : product.category?._id || '',
        subCategory: typeof product.subCategory === 'string' ? product.subCategory : product.subCategory?._id || '',
        badge: product.badge || '',
        stockQuantity: product.stockQuantity || 100,
        inStock: product.inStock !== false
      })
      if (product.gallery && product.gallery.length > 0) {
        setImagePreview(product.gallery.map(img => `http://localhost:5000${img}`))
      } else if (product.image) {
        setImagePreview([`http://localhost:5000${product.image}`])
      }
    } else {
      setFormData({
        name: '',
        description: '',
        price: '',
        originalPrice: '',
        category: '',
        subCategory: '',
        badge: '',
        stockQuantity: 100,
        inStock: true
      })
      setImagePreview([])
    }
    setSelectedImages([])
  }, [product, isOpen])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setSelectedImages(files)
    
    const previewUrls = files.map(file => URL.createObjectURL(file))
    setImagePreview(previewUrls)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const formDataToSend = new FormData()
      
      Object.keys(formData).forEach(key => {
        const value = formData[key as keyof ProductFormData]
        if (value !== undefined && value !== '') {
          formDataToSend.append(key, value.toString())
        }
      })

      selectedImages.forEach((image) => {
        formDataToSend.append('images', image)
      })

      const endpoint = product ? `/products/${product._id}` : '/products'
      const method = product ? 'PUT' : 'POST'

      await apiRequest(endpoint, {
        method,
        body: formDataToSend
      })

      onSave()
      onClose()
    } catch (error) {
      console.error('Error saving product:', error)
      alert('Erreur lors de la sauvegarde du produit: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredSubCategories = subCategories.filter(sub => 
    (typeof sub.category === 'string' ? sub.category : sub.category?._id) === formData.category
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white border rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">{product ? 'Modifier le Produit' : 'Nouveau Produit'}</h3>
          <Button variant="ghost" onClick={onClose}>
            <XIcon className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Images Section */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <div className="text-center">
              <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4">
                <Label htmlFor="images" className="cursor-pointer">
                  <span className="mt-2 block text-sm font-medium text-gray-900">
                    Images du produit (max 5)
                  </span>
                  <Input
                    id="images"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    className="mt-2"
                  />
                </Label>
              </div>
            </div>
            
            {imagePreview.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-4">
                {imagePreview.map((preview, index) => (
                  <div key={index} className="relative">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="h-24 w-24 object-cover rounded-lg border"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nom du Produit *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="price">Prix (ex: 65,000 TND) *</Label>
              <Input
                id="price"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                placeholder="65,000 TND"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
              required
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="originalPrice">Prix Original (Optionnel)</Label>
              <Input
                id="originalPrice"
                value={formData.originalPrice}
                onChange={(e) => setFormData({...formData, originalPrice: e.target.value})}
                placeholder="78,000 TND"
              />
            </div>
            <div>
              <Label htmlFor="badge">Badge (Optionnel)</Label>
              <select
                id="badge"
                value={formData.badge}
                onChange={(e) => setFormData({...formData, badge: e.target.value})}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Aucun</option>
                <option value="Nouveau">Nouveau</option>
                <option value="Bestseller">Bestseller</option>
                <option value="Premium">Premium</option>
                <option value="Promo">Promo</option>
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Catégorie *</Label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value, subCategory: ''})}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              >
                <option value="">Sélectionner une catégorie</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="subCategory">Sous-catégorie</Label>
              <select
                id="subCategory"
                value={formData.subCategory}
                onChange={(e) => setFormData({...formData, subCategory: e.target.value})}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                disabled={!formData.category}
              >
                <option value="">Sélectionner une sous-catégorie</option>
                {filteredSubCategories.map(sub => (
                  <option key={sub._id} value={sub._id}>{sub.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="stockQuantity">Quantité en Stock</Label>
              <Input
                id="stockQuantity"
                type="number"
                value={formData.stockQuantity}
                onChange={(e) => setFormData({...formData, stockQuantity: parseInt(e.target.value)})}
                min="0"
              />
            </div>
            <div className="flex items-center space-x-2 pt-6">
              <input
                type="checkbox"
                id="inStock"
                checked={formData.inStock}
                onChange={(e) => setFormData({...formData, inStock: e.target.checked})}
                className="rounded"
              />
              <Label htmlFor="inStock">En stock</Label>
            </div>
          </div>

          <div className="flex space-x-2 pt-6">
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'Sauvegarde...' : (product ? 'Mettre à Jour' : 'Créer le Produit')}
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