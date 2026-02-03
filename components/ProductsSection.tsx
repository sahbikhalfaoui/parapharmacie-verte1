"use client"
import React, { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { 
  Search, Star, Grid3X3, List, Heart, ShoppingCart, 
  X, Plus, Minus, User, Calendar, ChevronRight, ChevronLeft, ChevronDown, Tag
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

// Types
interface User {
  id?: string
  name: string
  email: string
  role?: string
}

interface Product {
  _id: string
  name: string
  price: number
  image?: string
  categoryName?: string
  subcategoryName?: string
  description?: string
  inStock?: boolean
  badge?: string
  originalPrice?: number
  averageRating?: number
  totalReviews?: number
  subCategory?: { _id: string; name: string } | string
}

interface Review {
  _id: string
  user: { name: string }
  rating: number
  title: string
  comment: string
  createdAt: string
  helpfulVotes: number
  isVerifiedPurchase: boolean
}

interface Category {
  _id: string
  name: string
  subcategories?: Subcategory[]
}

interface Subcategory {
  _id: string
  name: string
  category: string
}

interface ProductsSectionProps {
  products: Product[]
  allCategories: Category[]
  categories: string[]
  subcategories: string[]
  isLoading: boolean
  searchTerm: string
  activeCategory: string
  activeSubcategory: string
  priceRange: [number, number]
  sortBy: string
  sortOrder: "asc" | "desc"
  currentPage: number
  itemsPerPage?: number
  minRating: number
  onCategoryChange: (category: string) => void
  onSubcategoryChange: (subcategory: string) => void
  onSortChange: (sortBy: string) => void
  onClearFilters: () => void
  onAddToCart: (product: Product) => void
  onPriceRangeChange: (range: [number, number]) => void
  onMinRatingChange: (rating: number) => void
  onCurrentPageChange: (page: number) => void
  onSearchChange: (searchTerm: string) => void
  user: User | null
  favorites: Set<string>
  onToggleFavorite: (productId: string) => void
  selectedProduct: Product | null
  isProductModalOpen: boolean
  setSelectedProduct: (product: Product | null) => void
  setIsProductModalOpen: (isOpen: boolean) => void
  showToast: (message: string, type: "success" | "error" | "warning" | "info", duration?: number) => string
}

// Review Form Component
const ReviewForm = ({ productId, user, onReviewSubmit, onCancel, showToast }: {
  productId: string
  user: User | null
  onReviewSubmit: () => void
  onCancel: () => void
  showToast: ProductsSectionProps['showToast']
}) => {
  const [rating, setRating] = useState(0)
  const [title, setTitle] = useState("")
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !rating || !title || !comment) {
      showToast("Veuillez remplir tous les champs", "warning")
      return
    }

    setIsSubmitting(true)
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`https://biopharma-backend.onrender.com/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rating, title, comment })
      })

      if (response.ok) {
        showToast("Votre avis a été soumis avec succès !", "success")
        onReviewSubmit()
        setRating(0)
        setTitle("")
        setComment("")
      } else {
        const errorData = await response.json()
        showToast(`Erreur: ${errorData.error || 'Erreur inconnue'}`, "error")
      }
    } catch (error) {
      showToast("Erreur lors de l'envoi de l'avis", "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user) {
    return (
      <div className="text-center p-6 bg-gray-50 rounded-lg">
        <p className="text-gray-600">Connectez-vous pour laisser un avis</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6 bg-gray-50 rounded-xl">
      <h3 className="font-semibold text-lg">Donnez votre avis</h3>
      
      <div>
        <div className="flex space-x-1 mt-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className="focus:outline-none transition-transform hover:scale-110"
            >
              <Star 
                className={`w-6 h-6 ${star <= rating ? "text-yellow-400 fill-current" : "text-gray-300"}`} 
              />
            </button>
          ))}
        </div>
      </div>

      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Titre de votre avis"
        required
      />

      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Partagez votre expérience..."
        rows={4}
        required
      />

      <div className="flex space-x-3">
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button type="submit" disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
            {isSubmitting ? "Envoi..." : "Soumettre"}
          </Button>
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
        </motion.div>
      </div>
    </form>
  )
}

// Review Item Component
const ReviewItem = ({ review }: { review: Review }) => {
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-0.5">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className={`w-4 h-4 ${i < rating ? "text-yellow-400 fill-current" : "text-gray-300"}`} />
        ))}
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="border-b border-gray-200 pb-6 last:border-b-0">
      <div className="flex items-start space-x-3 mb-3">
        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
          <User className="w-5 h-5 text-green-600" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <p className="font-medium text-gray-900">{review.user.name}</p>
            {review.isVerifiedPurchase && (
              <Badge className="bg-green-100 text-green-800 text-xs">
                Achat vérifié
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            {renderStars(review.rating)}
            <span>•</span>
            <Calendar className="w-3 h-3" />
            <span>{formatDate(review.createdAt)}</span>
          </div>
        </div>
      </div>
      
      <h4 className="font-semibold text-gray-900 mb-2">{review.title}</h4>
      <p className="text-gray-700">{review.comment}</p>
    </div>
  )
}

// Product Detail Modal
const ProductDetailModal: React.FC<{
  product: Product | null
  isOpen: boolean
  onClose: () => void
  onAddToCart: (product: Product) => void
  user: User | null
  showToast: ProductsSectionProps['showToast']
}> = ({ product, isOpen, onClose, onAddToCart, user, showToast }) => {
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState('description')
  const [reviews, setReviews] = useState<Review[]>([])
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [isAddingToCart, setIsAddingToCart] = useState(false)

  useEffect(() => {
    if (isOpen && product) {
      loadReviews()
      setQuantity(1)
    }
  }, [isOpen, product])

  const loadReviews = async () => {
    if (!product) return
    
    setReviewsLoading(true)
    try {
      const response = await fetch(`https://biopharma-backend.onrender.com/api/products/${product._id}/reviews`)
      const data = await response.json()
      setReviews(data.reviews || [])
    } catch (error) {
      console.error('Error loading reviews:', error)
      showToast("Erreur lors du chargement des avis", "error")
    } finally {
      setReviewsLoading(false)
    }
  }

  const handleAddToCart = async () => {
    if (!product) return
    
    setIsAddingToCart(true)
    try {
      for (let i = 0; i < quantity; i++) {
        onAddToCart(product)
      }
      showToast(`${product.name} ajouté au panier`, "success")
      
      // Animation success feedback
      await new Promise(resolve => setTimeout(resolve, 500))
      onClose()
    } finally {
      setIsAddingToCart(false)
    }
  }

  const renderStars = (rating: number = 0) => {
    return (
      <div className="flex items-center space-x-0.5">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className={`w-4 h-4 ${i < Math.floor(rating) ? "text-yellow-400 fill-current" : "text-gray-300"}`} />
        ))}
      </div>
    )
  }

  if (!isOpen || !product) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
          >
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-2xl font-bold">Détails du Produit</h2>
              <motion.div
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
              >
                <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-gray-100">
                  <X className="w-5 h-5" />
                </Button>
              </motion.div>
            </div>
            
            <div className="flex flex-col lg:flex-row max-h-[calc(90vh-80px)] overflow-y-auto">
              <div className="lg:w-2/5 p-6">
                <div className="relative aspect-square bg-gray-50 rounded-2xl overflow-hidden">
                  {product.badge && (
                    <Badge className="absolute top-4 left-4 z-10 bg-red-500 text-white">
                      {product.badge}
                    </Badge>
                  )}
                  <img 
                    src={product.image || "/placeholder.jpg"} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.jpg"
                    }}
                  />
                </div>
              </div>
              
              <div className="lg:w-3/5 p-6 space-y-6">
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <Badge className="bg-green-100 text-green-800">
                      {product.categoryName}
                    </Badge>
                    {product.subcategoryName && product.subcategoryName !== 'Aucune' && (
                      <Badge variant="outline" className="border-green-200 text-green-700">
                        {product.subcategoryName}
                      </Badge>
                    )}
                  </div>
                  
                  <h1 className="text-2xl font-bold text-gray-900 mb-3">{product.name}</h1>
                  
                  <div className="flex items-center space-x-4">
                    {renderStars(product.averageRating || 0)}
                    <span className="text-sm text-gray-600">
                      {product.averageRating?.toFixed(1)} ({product.totalReviews || 0} avis)
                    </span>
                    <Badge className={product.inStock ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                      {product.inStock ? "En stock" : "Rupture"}
                    </Badge>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-100">
                  <div className="flex items-baseline space-x-3 mb-4">
                    <div className="text-3xl font-bold text-green-600">{product.price.toFixed(2)} TND</div>
                    {product.originalPrice && (
                      <>
                        <span className="text-lg text-gray-400 line-through">{product.originalPrice.toFixed(2)} TND</span>
                        <Badge className="bg-red-100 text-red-800">
                          -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                        </Badge>
                      </>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center border border-gray-200 rounded-lg">
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="h-10 w-10"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                      </motion.div>
                      <motion.span 
                        key={quantity}
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className="px-4 py-2 font-medium min-w-[3rem] text-center"
                      >
                        {quantity}
                      </motion.span>
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => setQuantity(quantity + 1)}
                          className="h-10 w-10"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </motion.div>
                    </div>
                    
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex-1"
                    >
                      <Button 
                        onClick={handleAddToCart}
                        disabled={!product.inStock || isAddingToCart}
                        className="w-full bg-green-600 hover:bg-green-700 h-10"
                      >
                        {isAddingToCart ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Ajout...</span>
                          </div>
                        ) : (
                          <>
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            Ajouter au Panier
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </div>
                </div>
                
                <div>
                  <div className="flex border-b border-gray-200">
                    {[
                      { id: 'description', label: 'Description' },
                      { id: 'reviews', label: 'Avis' }
                    ].map((tab) => (
                      <motion.button
                        key={tab.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-6 py-3 border-b-2 transition-colors ${
                          activeTab === tab.id
                            ? 'border-green-500 text-green-600 font-medium'
                            : 'border-transparent text-gray-600 hover:text-green-600'
                        }`}
                      >
                        {tab.label}
                      </motion.button>
                    ))}
                  </div>
                  
                  <div className="pt-6 max-h-96 overflow-y-auto">
                    {activeTab === 'description' && (
                      <p className="text-gray-700 leading-relaxed">{product.description}</p>
                    )}
                    
                    {activeTab === 'reviews' && (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {renderStars(product.averageRating || 0)}
                            <span className="font-semibold">{product.averageRating?.toFixed(1)}/5</span>
                            <span className="text-gray-600">({product.totalReviews || 0} avis)</span>
                          </div>
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setShowReviewForm(!showReviewForm)}
                            >
                              Écrire un avis
                            </Button>
                          </motion.div>
                        </div>

                        {showReviewForm && (
                          <ReviewForm
                            productId={product._id}
                            user={user}
                            onReviewSubmit={() => {
                              setShowReviewForm(false)
                              loadReviews()
                            }}
                            onCancel={() => setShowReviewForm(false)}
                            showToast={showToast}
                          />
                        )}
                        
                        {reviewsLoading ? (
                          <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                          </div>
                        ) : reviews.length > 0 ? (
                          <div className="space-y-6">
                            {reviews.map((review) => (
                              <ReviewItem key={review._id} review={review} />
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <p>Aucun avis pour ce produit</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Main Component
const ProductsSection: React.FC<ProductsSectionProps> = ({
  products,
  allCategories,
  categories,
  subcategories,
  isLoading,
  searchTerm,
  activeCategory,
  activeSubcategory,
  priceRange,
  sortBy,
  sortOrder,
  currentPage,
  itemsPerPage = 15,
  minRating,
  onCategoryChange,
  onSubcategoryChange,
  onSortChange,
  onClearFilters,
  onAddToCart,
  onPriceRangeChange,
  onMinRatingChange,
  onCurrentPageChange,
  onSearchChange,
  user,
  favorites,
  onToggleFavorite,
  selectedProduct,
  isProductModalOpen,
  setSelectedProduct,
  setIsProductModalOpen,
  showToast
}) => {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)
  const [addingToCartId, setAddingToCartId] = useState<string | null>(null)

  const getSubcategoriesForCategory = (categoryName: string) => {
    if (categoryName === "Tous") return []
    
    const category = allCategories.find(cat => cat.name === categoryName)
    
    if (category && category.subcategories) {
      return category.subcategories.map(sub => sub.name)
    }
    
    const subs = products
      .filter(p => p.categoryName === categoryName)
      .map(p => {
        if (p.subCategory && typeof p.subCategory === 'object' && 'name' in p.subCategory) {
          return p.subCategory.name
        }
        return p.subcategoryName
      })
      .filter((v, i, a) => v && v !== 'Aucune' && v !== 'Tous' && v !== 'undefined' && a.indexOf(v) === i)
    
    return subs
  }

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesCategory = activeCategory === "Tous" || product.categoryName === activeCategory
      
      let matchesSubcategory = activeSubcategory === "Tous"
      if (!matchesSubcategory) {
        if (product.subcategoryName === activeSubcategory) {
          matchesSubcategory = true
        }
        if (product.subCategory && typeof product.subCategory === 'object' && 'name' in product.subCategory) {
          if (product.subCategory.name === activeSubcategory) {
            matchesSubcategory = true
          }
        }
      }
      
      const matchesSearch = searchTerm === "" || product.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1]
      const matchesRating = (product.averageRating || 0) >= minRating
      
      return matchesCategory && matchesSubcategory && matchesSearch && matchesPrice && matchesRating
    })
  }, [products, activeCategory, activeSubcategory, searchTerm, priceRange, minRating])

  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      let aValue, bValue
      
      switch (sortBy) {
        case 'price':
          aValue = a.price
          bValue = b.price
          break
        case 'rating':
          aValue = a.averageRating || 0
          bValue = b.averageRating || 0
          break
        default:
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
      }
      
      return sortOrder === 'asc' ? (aValue > bValue ? 1 : -1) : (aValue < bValue ? 1 : -1)
    })
  }, [filteredProducts, sortBy, sortOrder])

  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedProducts = sortedProducts.slice(startIndex, startIndex + itemsPerPage)

  const handleSubcategorySelect = (category: string, subcategory: string) => {
    setTimeout(() => {
      onCategoryChange(category)
      onSubcategoryChange(subcategory)
    }, 0)
    
    setHoveredCategory(null)
  }

  const handleCategoryClick = (category: string) => {
    onCategoryChange(category)
    onSubcategoryChange("Tous")
  }

  const handleExpandedSubcategoryClick = (subcategory: string) => {
    onSubcategoryChange(subcategory)
  }

  const handleAddToCartWithAnimation = async (product: Product) => {
    setAddingToCartId(product._id)
    await new Promise(resolve => setTimeout(resolve, 300)) // Animation delay
    onAddToCart(product)
    showToast(`${product.name} ajouté au panier`, "success")
    setAddingToCartId(null)
  }

  const renderStars = (rating: number = 0) => {
    return (
      <div className="flex items-center space-x-0.5">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className={`w-3 h-3 ${i < Math.floor(rating) ? "text-yellow-400 fill-current" : "text-gray-300"}`} />
        ))}
      </div>
    )
  }

  return (
    <>
      <section id="produits" className="py-16 bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-4xl font-bold mb-3 bg-gradient-to-r from-green-700 to-emerald-600 bg-clip-text text-transparent"
            >
              Nos Produits
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-lg text-gray-600"
            >
              Découvrez notre sélection de produits de santé et bien-être
            </motion.p>
          </div>

          <div className="mb-10">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex items-center justify-center gap-3 mb-6 flex-wrap"
            >
              {categories.map((category) => {
                const categorySubcategories = getSubcategoriesForCategory(category)
                const hasSubcategories = categorySubcategories.length > 0
                
                return (
                  <motion.div 
                    key={category} 
                    className="relative"
                    onMouseEnter={() => setHoveredCategory(category)}
                    onMouseLeave={() => setHoveredCategory(null)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <button
                      onClick={() => handleCategoryClick(category)}
                      className={`px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
                        activeCategory === category
                          ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg scale-105'
                          : 'bg-white text-gray-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 hover:scale-105 shadow-md hover:shadow-lg'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {category}
                        {hasSubcategories && (
                          <ChevronDown className={`w-4 h-4 transition-transform ${hoveredCategory === category ? 'rotate-180' : ''}`} />
                        )}
                      </span>
                    </button>

                    {hasSubcategories && hoveredCategory === category && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full left-1/2 transform -translate-x-1/2 pt-2 z-50"
                        onMouseEnter={() => setHoveredCategory(category)}
                        onMouseLeave={() => setHoveredCategory(null)}
                      >
                        <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white border-t border-l border-green-100 rotate-45" />
                        
                        <div className="relative bg-white rounded-xl shadow-2xl border-2 border-green-200 overflow-hidden min-w-[220px] mt-2">
                          <div className="p-3">
                            <div className="text-xs font-bold text-green-600 px-3 py-2 border-b border-gray-100 bg-green-50">
                              Sous-catégories
                            </div>
                            <div className="py-2 space-y-1 max-h-[300px] overflow-y-auto">
                              {categorySubcategories.map((subcategory, idx) => (
                                <motion.button
                                  key={`${subcategory}-${idx}`}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: idx * 0.05 }}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    e.preventDefault()
                                    handleSubcategorySelect(category, subcategory)
                                  }}
                                  className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                    activeSubcategory === subcategory && activeCategory === category
                                      ? 'bg-green-600 text-white shadow-md'
                                      : 'text-gray-700 hover:bg-green-50 hover:text-green-600'
                                  }`}
                                >
                                  {subcategory}
                                </motion.button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )
              })}
            </motion.div>
            
            {activeCategory !== "Tous" && getSubcategoriesForCategory(activeCategory).length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-6"
              >
                <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 rounded-xl p-5 shadow-inner border-2 border-green-100">
                  <div className="flex items-center justify-center mb-3">
                    <div className="flex items-center space-x-2 text-green-700">
                      <Tag className="w-4 h-4" />
                      <h3 className="font-bold">Sous-catégories de {activeCategory}</h3>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onSubcategoryChange("Tous")}
                      className={`px-5 py-2 rounded-lg font-medium transition-all duration-300 text-sm ${
                        activeSubcategory === "Tous"
                          ? 'bg-green-600 text-white shadow-lg scale-105'
                          : 'bg-white text-gray-700 hover:bg-green-100 hover:text-green-700 shadow-sm hover:shadow-md'
                      }`}
                    >
                      Toutes
                    </motion.button>
                    
                    {getSubcategoriesForCategory(activeCategory).map((subcategory, idx) => (
                      <motion.button
                        key={`${subcategory}-${idx}`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleExpandedSubcategoryClick(subcategory)}
                        className={`px-5 py-2 rounded-lg font-medium transition-all duration-300 text-sm ${
                          activeSubcategory === subcategory
                            ? 'bg-green-600 text-white shadow-lg scale-105'
                            : 'bg-white text-gray-700 hover:bg-green-100 hover:text-green-700 shadow-sm hover:shadow-md'
                        }`}
                      >
                        {subcategory}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
            
            {(activeCategory !== "Tous" || activeSubcategory !== "Tous") && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="flex items-center justify-center gap-3"
              >
                <span className="text-sm text-gray-600 font-medium">Filtres actifs:</span>
                {activeCategory !== "Tous" && (
                  <Badge className="bg-green-100 text-green-800 px-3 py-1 flex items-center gap-2">
                    {activeCategory}
                    <button
                      onClick={() => {
                        onCategoryChange("Tous")
                        onSubcategoryChange("Tous")
                      }}
                      className="hover:bg-green-200 rounded-full p-0.5 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {activeSubcategory !== "Tous" && (
                  <Badge className="bg-emerald-100 text-emerald-800 px-3 py-1 flex items-center gap-2">
                    {activeSubcategory}
                    <button
                      onClick={() => onSubcategoryChange("Tous")}
                      className="hover:bg-emerald-200 rounded-full p-0.5 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
              </motion.div>
            )}
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="mb-6 border-green-100">
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row items-center gap-4">
                  <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      placeholder="Rechercher un produit..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => onSearchChange(e.target.value)}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={priceRange[0]}
                      onChange={(e) => onPriceRangeChange([Number(e.target.value), priceRange[1]])}
                      className="w-24"
                    />
                    <span>-</span>
                    <Input
                      type="number"
                      placeholder="Max"
                      value={priceRange[1]}
                      onChange={(e) => onPriceRangeChange([priceRange[0], Number(e.target.value)])}
                      className="w-24"
                    />
                    <span className="text-sm text-gray-600">TND</span>
                  </div>

                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <motion.button
                        key={rating}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onMinRatingChange(rating === minRating ? 0 : rating)}
                        className={`p-1 transition-colors ${
                          rating <= minRating ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                      >
                        <Star className="w-5 h-5 fill-current" />
                      </motion.button>
                    ))}
                  </div>

                  <select
                    value={`${sortBy}-${sortOrder}`}
                    onChange={(e) => {
                      const [newSortBy] = e.target.value.split('-')
                      onSortChange(newSortBy)
                    }}
                    className="px-4 py-2 border rounded-lg bg-white"
                  >
                    <option value="name-asc">A-Z</option>
                    <option value="name-desc">Z-A</option>
                    <option value="price-asc">Prix ↑</option>
                    <option value="price-desc">Prix ↓</option>
                    <option value="rating-desc">Mieux notés</option>
                  </select>

                  <div className="flex items-center bg-gray-100 rounded-lg p-1">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Button
                        variant={viewMode === 'grid' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('grid')}
                        className={viewMode === 'grid' ? 'bg-white shadow-sm' : ''}
                      >
                        <Grid3X3 className="w-4 h-4" />
                      </Button>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Button
                        variant={viewMode === 'list' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('list')}
                        className={viewMode === 'list' ? 'bg-white shadow-sm' : ''}
                      >
                        <List className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <div className="flex items-center justify-between mb-6">
            <p className="text-gray-600">
              {sortedProducts.length} produit{sortedProducts.length !== 1 ? 's' : ''} trouvé{sortedProducts.length !== 1 ? 's' : ''}
            </p>
            {(activeCategory !== "Tous" || activeSubcategory !== "Tous" || minRating > 0) && (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button variant="outline" size="sm" onClick={onClearFilters}>
                  Réinitialiser les filtres
                </Button>
              </motion.div>
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
          ) : paginatedProducts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-lg">
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Aucun produit trouvé</h3>
              <p className="text-gray-600 mb-6">Essayez d'ajuster vos filtres</p>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button onClick={onClearFilters} className="bg-green-600 hover:bg-green-700">
                  Effacer les filtres
                </Button>
              </motion.div>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {paginatedProducts.map((product, index) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card 
                    className="group hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border-green-100"
                    onClick={() => router.push(`/product/${product._id}`)}
                  >
                    <div className="relative aspect-square overflow-hidden bg-gray-50">
                      {product.badge && (
                        <Badge className="absolute top-2 left-2 z-10 bg-red-500 text-white text-xs">
                          {product.badge}
                        </Badge>
                      )}
                      
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation()
                          onToggleFavorite(product._id)
                        }}
                        className={`absolute top-2 right-2 z-10 p-1.5 rounded-full backdrop-blur-sm transition-all ${
                          favorites.has(product._id)
                            ? 'bg-red-100 text-red-600'
                            : 'bg-white/80 text-gray-400 hover:text-red-500'
                        }`}
                      >
                        <Heart className={`w-3 h-3 ${favorites.has(product._id) ? 'fill-current' : ''}`} />
                      </motion.button>
                      
                      <img 
                        src={product.image || "/placeholder.jpg"} 
                        alt={product.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.jpg"
                        }}
                      />
                    </div>
                    
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-1">
                        <Badge className="bg-green-100 text-green-800 text-xs px-2 py-0.5">
                          {product.categoryName}
                        </Badge>
                        {renderStars(product.averageRating || 0)}
                      </div>
                      
                      <h3 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-2 group-hover:text-green-600 transition-colors">
                        {product.name}
                      </h3>
                      
                      <div className="flex items-center justify-between mt-2">
                        <div>
                          <div className="text-lg font-bold text-green-600">
                            {product.price.toFixed(2)} TND
                          </div>
                          {product.originalPrice && (
                            <span className="text-xs text-gray-400 line-through">
                              {product.originalPrice.toFixed(2)} TND
                            </span>
                          )}
                        </div>
                        
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Button 
                            onClick={(e) => {
                              e.stopPropagation()
                              handleAddToCartWithAnimation(product)
                            }}
                            disabled={!product.inStock || addingToCartId === product._id}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 h-8 w-8 p-0"
                          >
                            {addingToCartId === product._id ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                            ) : (
                              <ShoppingCart className="w-3 h-3" />
                            )}
                          </Button>
                        </motion.div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {paginatedProducts.map((product, index) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card 
                    className="group hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border-green-100"
                    onClick={() => router.push(`/product/${product._id}`)}
                  >
                    <div className="flex">
                      <div className="relative w-32 h-32 flex-shrink-0 bg-gray-50">
                        {product.badge && (
                          <Badge className="absolute top-2 left-2 z-10 bg-red-500 text-white text-xs">
                            {product.badge}
                          </Badge>
                        )}
                        <img 
                          src={product.image || "/placeholder.jpg"} 
                          alt={product.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder.jpg"
                          }}
                        />
                      </div>
                      
                      <CardContent className="flex-1 p-4 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Badge className="bg-green-100 text-green-800 text-xs">
                              {product.categoryName}
                            </Badge>
                            <div className="flex items-center space-x-2">
                              {renderStars(product.averageRating || 0)}
                              <span className="text-sm text-gray-600">
                                ({product.totalReviews || 0})
                              </span>
                            </div>
                          </div>
                          
                          <h3 className="font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">
                            {product.name}
                          </h3>
                          
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {product.description}
                          </p>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xl font-bold text-green-600">
                              {product.price.toFixed(2)} TND
                            </div>
                            {product.originalPrice && (
                              <span className="text-sm text-gray-400 line-through">
                                {product.originalPrice.toFixed(2)} TND
                              </span>
                            )}
                          </div>
                          
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Button 
                              onClick={(e) => {
                                e.stopPropagation()
                                handleAddToCartWithAnimation(product)
                              }}
                              disabled={!product.inStock || addingToCartId === product._id}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                            >
                              {addingToCartId === product._id ? (
                                <div className="flex items-center">
                                  <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent mr-2"></div>
                                  Ajout...
                                </div>
                              ) : (
                                <>
                                  <ShoppingCart className="w-4 h-4 mr-2" />
                                  Ajouter
                                </>
                              )}
                            </Button>
                          </motion.div>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center justify-center space-x-2 mt-8"
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onCurrentPageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="hover:bg-green-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </motion.div>
              
              <div className="flex space-x-1">
                {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 7) {
                    pageNum = i + 1
                  } else if (currentPage <= 4) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 3) {
                    pageNum = totalPages - 6 + i
                  } else {
                    pageNum = currentPage - 3 + i
                  }
                  
                  return (
                    <motion.div
                      key={pageNum}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Button
                        variant={pageNum === currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => onCurrentPageChange(pageNum)}
                        className={pageNum === currentPage ? "bg-green-600 hover:bg-green-700" : "hover:bg-green-50"}
                      >
                        {pageNum}
                      </Button>
                    </motion.div>
                  )
                })}
              </div>
              
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onCurrentPageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="hover:bg-green-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </motion.div>
            </motion.div>
          )}
        </div>
      </section>

      <ProductDetailModal 
        product={selectedProduct}
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false)
          setSelectedProduct(null)
        }}
        onAddToCart={onAddToCart}
        user={user}
        showToast={showToast}
      />
    </>
  )
}

export default ProductsSection