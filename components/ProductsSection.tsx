"use client"
import React, { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { 
  Search, Star, Filter, Grid3X3, List, Heart, ShoppingCart, 
  X, Plus, Minus, User, Calendar, ChevronRight, ChevronLeft, ChevronDown, Tag
} from "lucide-react"

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
  itemsPerPage: number
  minRating: number
  onCategoryChange: (category: string) => void
  onSubcategoryChange: (subcategory: string) => void
  onSortChange: (sortBy: string) => void
  onClearFilters: () => void
  onAddToCart: (product: Product) => void
  onPriceRangeChange: (range: [number, number]) => void
  onMinRatingChange: (rating: number) => void
  onCurrentPageChange: (page: number) => void
  user: User | null
}

// Review Form Component
const ReviewForm = ({ productId, user, onReviewSubmit, onCancel }: {
  productId: string
  user: User | null
  onReviewSubmit: () => void
  onCancel: () => void
}) => {
  const [rating, setRating] = useState(0)
  const [title, setTitle] = useState("")
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !rating || !title || !comment) return

    setIsSubmitting(true)
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`http://localhost:5000/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rating, title, comment })
      })

      if (response.ok) {
        onReviewSubmit()
        setRating(0)
        setTitle("")
        setComment("")
      } else {
        const errorData = await response.json()
        alert('Erreur: ' + (errorData.error || 'Erreur inconnue'))
      }
    } catch (error) {
      alert('Erreur lors de l\'envoi de l\'avis')
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
        <Button type="submit" disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
          {isSubmitting ? "Envoi..." : "Soumettre"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
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
const ProductDetailModal = ({ product, isOpen, onClose, onAddToCart, user }: {
  product: Product | null
  isOpen: boolean
  onClose: () => void
  onAddToCart: (product: Product) => void
  user: User | null
}) => {
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState('description')
  const [reviews, setReviews] = useState<Review[]>([])
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewsLoading, setReviewsLoading] = useState(false)

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
      const response = await fetch(`http://localhost:5000/api/products/${product._id}/reviews`)
      const data = await response.json()
      setReviews(data.reviews || [])
    } catch (error) {
      console.error('Error loading reviews:', error)
    } finally {
      setReviewsLoading(false)
    }
  }

  if (!isOpen || !product) return null

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      onAddToCart(product)
    }
    onClose()
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

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold">Détails du Produit</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-gray-100">
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        <div className="flex flex-col lg:flex-row max-h-[calc(90vh-80px)] overflow-y-auto">
          {/* Image */}
          <div className="lg:w-2/5 p-6">
            <div className="relative aspect-square bg-gray-50 rounded-2xl overflow-hidden group">
              {product.badge && (
                <Badge className="absolute top-4 left-4 z-10 bg-red-500 text-white">
                  {product.badge}
                </Badge>
              )}
              <img 
                src={product.image ? `http://localhost:5000${product.image}` : "/placeholder.jpg"} 
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          </div>
          
          {/* Details */}
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
            
            {/* Price & Cart */}
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
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="h-10 w-10"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="px-4 py-2 font-medium min-w-[3rem] text-center">{quantity}</span>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setQuantity(quantity + 1)}
                    className="h-10 w-10"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                
                <Button 
                  onClick={handleAddToCart}
                  disabled={!product.inStock}
                  className="flex-1 bg-green-600 hover:bg-green-700 h-10"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Ajouter au Panier
                </Button>
              </div>
            </div>
            
            {/* Tabs */}
            <div>
              <div className="flex border-b border-gray-200">
                {[
                  { id: 'description', label: 'Description' },
                  { id: 'reviews', label: 'Avis' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-6 py-3 border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-green-500 text-green-600 font-medium'
                        : 'border-transparent text-gray-600 hover:text-green-600'
                    }`}
                  >
                    {tab.label}
                  </button>
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
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowReviewForm(!showReviewForm)}
                      >
                        Écrire un avis
                      </Button>
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
      </div>
    </div>
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
  itemsPerPage,
  minRating,
  onCategoryChange,
  onSubcategoryChange,
  onSortChange,
  onClearFilters,
  onAddToCart,
  onPriceRangeChange,
  onMinRatingChange,
  onCurrentPageChange,
  user
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [scrollY, setScrollY] = useState(0)
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Get subcategories for a specific category from allCategories (not from products)
  const getSubcategoriesForCategory = (categoryName: string) => {
    if (categoryName === "Tous") return []
    
    // Find the category in allCategories
    const category = allCategories.find(cat => cat.name === categoryName)
    
    if (category && category.subcategories) {
      return category.subcategories.map(sub => sub.name)
    }
    
    // Fallback: get from products if not in allCategories
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

  const toggleFavorite = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const newFavorites = new Set(favorites)
    if (newFavorites.has(productId)) {
      newFavorites.delete(productId)
    } else {
      newFavorites.add(productId)
    }
    setFavorites(newFavorites)
  }

  // FIXED: Handle subcategory selection properly
  const handleSubcategorySelect = (category: string, subcategory: string) => {
    console.log('🟢 Selecting subcategory:', { category, subcategory })
    
    // Use setTimeout to ensure the state updates happen in the correct order
    setTimeout(() => {
      onCategoryChange(category)
      onSubcategoryChange(subcategory)
    }, 0)
    
    setHoveredCategory(null)
  }

  // FIXED: Handle category click - reset subcategory to "Tous"
  const handleCategoryClick = (category: string) => {
    console.log('🔵 Selecting category:', category)
    onCategoryChange(category)
    onSubcategoryChange("Tous")
  }

  // FIXED: Handle subcategory click from expanded section
  const handleExpandedSubcategoryClick = (subcategory: string) => {
    console.log('🟡 Selecting expanded subcategory:', subcategory)
    onSubcategoryChange(subcategory)
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
      <section 
        id="produits" 
        className="py-20 bg-gradient-to-br from-green-50 to-emerald-50 relative overflow-hidden"
        style={{ transform: `translateY(${scrollY * 0.1}px)` }}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, rgb(34 197 94) 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-green-700 to-emerald-600 bg-clip-text text-transparent">
              Nos Produits
            </h2>
            <p className="text-lg text-gray-600">
              Découvrez notre sélection de produits de santé et bien-être
            </p>
          </div>

          {/* Category Navigation with Hover Subcategories */}
          <div className="mb-12">
            <div className="flex items-center justify-center gap-4 mb-8 flex-wrap">
              {categories.map((category) => {
                const categorySubcategories = getSubcategoriesForCategory(category)
                const hasSubcategories = categorySubcategories.length > 0
                
                return (
                  <div 
                    key={category} 
                    className="relative"
                    onMouseEnter={() => setHoveredCategory(category)}
                    onMouseLeave={() => setHoveredCategory(null)}
                  >
                    <button
                      onClick={() => handleCategoryClick(category)}
                      className={`px-8 py-3 rounded-2xl font-semibold transition-all duration-300 relative overflow-hidden ${
                        activeCategory === category
                          ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-xl scale-105'
                          : 'bg-white text-gray-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 hover:scale-105 shadow-md hover:shadow-lg'
                      }`}
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        {category}
                        {hasSubcategories && (
                          <ChevronDown className={`w-4 h-4 transition-transform ${hoveredCategory === category ? 'rotate-180' : ''}`} />
                        )}
                      </span>
                      {activeCategory === category && (
                        <div className="absolute inset-0 bg-white/20 animate-pulse" />
                      )}
                    </button>

                    {/* Subcategories Dropdown on Hover */}
                    {hasSubcategories && hoveredCategory === category && (
                      <div 
                        className="absolute top-full left-1/2 transform -translate-x-1/2 pt-2 z-50"
                        onMouseEnter={() => setHoveredCategory(category)}
                        onMouseLeave={() => setHoveredCategory(null)}
                      >
                        {/* Arrow pointer */}
                        <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white border-t border-l border-green-100 rotate-45" />
                        
                        <div className="relative bg-white rounded-xl shadow-2xl border-2 border-green-200 overflow-hidden min-w-[220px] mt-2">
                          <div className="p-3">
                            <div className="text-xs font-bold text-green-600 px-3 py-2 border-b border-gray-100 bg-green-50">
                              Sous-catégories ({categorySubcategories.length})
                            </div>
                            <div className="py-2 space-y-1 max-h-[300px] overflow-y-auto">
                              {categorySubcategories.map((subcategory, idx) => (
                                <button
                                  key={`${subcategory}-${idx}`}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    e.preventDefault()
                                    handleSubcategorySelect(category, subcategory)
                                  }}
                                  className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                                    activeSubcategory === subcategory && activeCategory === category
                                      ? 'bg-green-600 text-white shadow-md'
                                      : 'text-gray-700 hover:bg-green-50 hover:text-green-600'
                                  }`}
                                >
                                  {subcategory}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            
            {/* Expanded Subcategories Section - Shows when category is active */}
            {activeCategory !== "Tous" && getSubcategoriesForCategory(activeCategory).length > 0 && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300 mb-6">
                <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 rounded-2xl p-6 shadow-inner border-2 border-green-100">
                  <div className="flex items-center justify-center mb-4">
                    <div className="flex items-center space-x-2 text-green-700">
                      <Tag className="w-5 h-5" />
                      <h3 className="font-bold text-lg">Sous-catégories de {activeCategory}</h3>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center gap-3 flex-wrap">
                    <button
                      onClick={() => onSubcategoryChange("Tous")}
                      className={`px-6 py-2.5 rounded-xl font-medium transition-all duration-300 ${
                        activeSubcategory === "Tous"
                          ? 'bg-green-600 text-white shadow-lg scale-105'
                          : 'bg-white text-gray-700 hover:bg-green-100 hover:text-green-700 shadow-sm hover:shadow-md'
                      }`}
                    >
                      Toutes
                    </button>
                    
                    {getSubcategoriesForCategory(activeCategory).map((subcategory, idx) => (
                      <button
                        key={`${subcategory}-${idx}`}
                        onClick={() => handleExpandedSubcategoryClick(subcategory)}
                        className={`px-6 py-2.5 rounded-xl font-medium transition-all duration-300 ${
                          activeSubcategory === subcategory
                            ? 'bg-green-600 text-white shadow-lg scale-105'
                            : 'bg-white text-gray-700 hover:bg-green-100 hover:text-green-700 shadow-sm hover:shadow-md'
                        }`}
                      >
                        {subcategory}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* Active Filters Display */}
            {(activeCategory !== "Tous" || activeSubcategory !== "Tous") && (
              <div className="flex items-center justify-center gap-3 animate-in fade-in slide-in-from-top-2">
                <span className="text-sm text-gray-600 font-medium">Filtres actifs:</span>
                {activeCategory !== "Tous" && (
                  <Badge className="bg-green-100 text-green-800 px-4 py-1.5 flex items-center gap-2">
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
                  <Badge className="bg-emerald-100 text-emerald-800 px-4 py-1.5 flex items-center gap-2">
                    {activeSubcategory}
                    <button
                      onClick={() => onSubcategoryChange("Tous")}
                      className="hover:bg-emerald-200 rounded-full p-0.5 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Filters Bar */}
          <Card className="mb-8 border-green-100">
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row items-center gap-4">
                {/* Search */}
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Rechercher un produit..."
                    className="pl-10"
                  />
                </div>

                {/* Price Range */}
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

                {/* Rating Filter */}
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => onMinRatingChange(rating === minRating ? 0 : rating)}
                      className={`p-1 transition-colors ${
                        rating <= minRating ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                    >
                      <Star className="w-5 h-5 fill-current" />
                    </button>
                  ))}
                </div>

                {/* Sort */}
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

                {/* View Toggle */}
                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className={viewMode === 'grid' ? 'bg-white shadow-sm' : ''}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className={viewMode === 'list' ? 'bg-white shadow-sm' : ''}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results Count */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-gray-600">
              {sortedProducts.length} produit{sortedProducts.length !== 1 ? 's' : ''} trouvé{sortedProducts.length !== 1 ? 's' : ''}
            </p>
            {(activeCategory !== "Tous" || activeSubcategory !== "Tous" || minRating > 0) && (
              <Button variant="outline" size="sm" onClick={onClearFilters}>
                Réinitialiser les filtres
              </Button>
            )}
          </div>

          {/* Products Grid/List */}
          {isLoading ? (
            <div className="flex justify-center items-center py-32">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
          ) : paginatedProducts.length === 0 ? (
            <div className="text-center py-32 bg-white rounded-lg">
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Aucun produit trouvé</h3>
              <p className="text-gray-600 mb-6">Essayez d'ajuster vos filtres</p>
              <Button onClick={onClearFilters} className="bg-green-600 hover:bg-green-700">
                Effacer les filtres
              </Button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedProducts.map((product, index) => (
                <Card 
                  key={product._id} 
                  className="group hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border-green-100"
                  onClick={() => {
                    setSelectedProduct(product)
                    setIsModalOpen(true)
                  }}
                  style={{
                    animation: `fadeInUp 0.5s ease-out ${index * 0.1}s backwards`
                  }}
                >
                  <div className="relative aspect-square overflow-hidden bg-gray-50">
                    {product.badge && (
                      <Badge className="absolute top-3 left-3 z-10 bg-red-500 text-white shadow-lg">
                        {product.badge}
                      </Badge>
                    )}
                    
                    <button
                      onClick={(e) => toggleFavorite(product._id, e)}
                      className={`absolute top-3 right-3 z-10 p-2 rounded-full backdrop-blur-sm transition-all ${
                        favorites.has(product._id)
                          ? 'bg-red-100 text-red-600'
                          : 'bg-white/80 text-gray-400 hover:text-red-500'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${favorites.has(product._id) ? 'fill-current' : ''}`} />
                    </button>
                    
                    <img 
                      src={product.image ? `http://localhost:5000${product.image}` : "/placeholder.jpg"} 
                      alt={product.name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                    />
                  </div>
                  
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className="bg-green-100 text-green-800 text-xs">
                        {product.categoryName}
                      </Badge>
                      {renderStars(product.averageRating || 0)}
                    </div>
                    
                    <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-green-600 transition-colors">
                      {product.name}
                    </h3>
                    
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {product.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-green-600">
                          {product.price.toFixed(2)} TND
                        </div>
                        {product.originalPrice && (
                          <span className="text-sm text-gray-400 line-through">
                            {product.originalPrice.toFixed(2)} TND
                          </span>
                        )}
                      </div>
                      
                      <Button 
                        onClick={(e) => {
                          e.stopPropagation()
                          onAddToCart(product)
                        }}
                        disabled={!product.inStock}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <ShoppingCart className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedProducts.map((product, index) => (
                <Card 
                  key={product._id} 
                  className="group hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border-green-100"
                  onClick={() => {
                    setSelectedProduct(product)
                    setIsModalOpen(true)
                  }}
                  style={{
                    animation: `fadeInUp 0.5s ease-out ${index * 0.1}s backwards`
                  }}
                >
                  <div className="flex">
                    <div className="relative w-40 h-40 flex-shrink-0 bg-gray-50">
                      {product.badge && (
                        <Badge className="absolute top-2 left-2 z-10 bg-red-500 text-white text-xs">
                          {product.badge}
                        </Badge>
                      )}
                      <img 
                        src={product.image ? `http://localhost:5000${product.image}` : "/placeholder.jpg"} 
                        alt={product.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                    </div>
                    
                    <CardContent className="flex-1 p-5 flex flex-col justify-between">
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
                        
                        <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-green-600 transition-colors">
                          {product.name}
                        </h3>
                        
                        <p className="text-gray-600 mb-3 line-clamp-2">
                          {product.description}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-2xl font-bold text-green-600">
                            {product.price.toFixed(2)} TND
                          </div>
                          {product.originalPrice && (
                            <span className="text-sm text-gray-400 line-through">
                              {product.originalPrice.toFixed(2)} TND
                            </span>
                          )}
                        </div>
                        
                        <Button 
                          onClick={(e) => {
                            e.stopPropagation()
                            onAddToCart(product)
                          }}
                          disabled={!product.inStock}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Ajouter au panier
                        </Button>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 mt-12">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCurrentPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="hover:bg-green-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <div className="flex space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => onCurrentPageChange(pageNum)}
                      className={pageNum === currentPage ? "bg-green-600 hover:bg-green-700" : "hover:bg-green-50"}
                    >
                      {pageNum}
                    </Button>
                  )
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCurrentPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="hover:bg-green-50"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Product Detail Modal */}
      <ProductDetailModal 
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedProduct(null)
        }}
        onAddToCart={onAddToCart}
        user={user}
      />

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  )
}

export default ProductsSection