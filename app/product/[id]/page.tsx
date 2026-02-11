"use client"
import React, { useState, useEffect, useCallback, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { motion } from "framer-motion"
import Navbar from "@/components/Navbar"
import { CartSheet } from "@/components/Modals"
import { 
  Star, 
  ShoppingCart, 
  Plus, 
  Minus, 
  ArrowLeft,
  Calendar,
  User as UserIcon,
  Heart,
  Send
} from "lucide-react"

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
}

interface Review {
  _id: string
  user: {
    name: string
  }
  rating: number
  comment: string
  createdAt: string
}

interface User {
  id?: string
  name: string
  email: string
  role?: string
}

interface Category {
  _id: string
  name: string
  subcategories?: Array<{ _id: string; name: string; category: string }>
}

interface CartItem {
  _id: string
  name: string
  price: number
  image?: string
  categoryName?: string
  quantity: number
}

export default function ProductPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params.id as string

  const [product, setProduct] = useState<Product | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [similarProducts, setSimilarProducts] = useState<Product[]>([])
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState('description')
  const [isLoading, setIsLoading] = useState(true)
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [cartCount, setCartCount] = useState(0)
  const [categories, setCategories] = useState<Category[]>([])
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [newReviewRating, setNewReviewRating] = useState(0)
  const [newReviewTitle, setNewReviewTitle] = useState("")
  const [newReviewComment, setNewReviewComment] = useState("")
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const [hoverRating, setHoverRating] = useState(0)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [cartItems, setCartItems] = useState<CartItem[]>([])

  // Load cart items from localStorage
  const loadCartItems = useCallback(() => {
    try {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]')
      // Group items by ID and sum quantities
      const grouped = cart.reduce((acc: Record<string, CartItem>, item: CartItem) => {
        if (acc[item._id]) {
          acc[item._id].quantity += item.quantity || 1
        } else {
          acc[item._id] = { ...item, quantity: item.quantity || 1 }
        }
        return acc
      }, {})
      setCartItems(Object.values(grouped))
    } catch (error) {
      console.error('Error loading cart:', error)
      setCartItems([])
    }
  }, [])

  useEffect(() => {
    loadProduct()
    loadUserData()
    updateCartCount()
    loadCategories()
    loadCartItems()
  }, [productId, loadCartItems, loadProduct, loadCategories, updateCartCount])

  useEffect(() => {
    if (product) {
      loadReviews()
      loadSimilarProducts()
    }
  }, [product, loadReviews, loadSimilarProducts])

  const loadUserData = () => {
    const userData = localStorage.getItem('userData')
    const token = localStorage.getItem('authToken')
    
    // Only set user if both userData and token exist
    if (userData && token) {
      try {
        setUser(JSON.parse(userData))
      } catch (error) {
        console.error('Error parsing user data:', error)
        // Clear invalid data
        localStorage.removeItem('userData')
        setUser(null)
      }
    } else {
      // Clear user if no token
      setUser(null)
    }
  }

  // Listen for storage changes (login/logout in other tabs)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'authToken' || e.key === 'userData') {
        loadUserData()
        updateCartCount()
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const updateCartCount = useCallback(() => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    setCartCount(cart.length)
    loadCartItems()
  }, [loadCartItems])

  // Cart management functions
  const updateCartQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id)
      return
    }
    setCartItems(prev => {
      const updated = prev.map(item => 
        item._id === id ? { ...item, quantity } : item
      )
      // Update localStorage
      const flatCart: CartItem[] = []
      updated.forEach(item => {
        for (let i = 0; i < item.quantity; i++) {
          flatCart.push({ ...item, quantity: 1 })
        }
      })
      localStorage.setItem('cart', JSON.stringify(flatCart))
      setCartCount(flatCart.length)
      window.dispatchEvent(new Event('storage'))
      return updated
    })
  }, [])

  const removeFromCart = useCallback((id: string) => {
    setCartItems(prev => {
      const updated = prev.filter(item => item._id !== id)
      // Update localStorage
      const flatCart: CartItem[] = []
      updated.forEach(item => {
        for (let i = 0; i < item.quantity; i++) {
          flatCart.push({ ...item, quantity: 1 })
        }
      })
      localStorage.setItem('cart', JSON.stringify(flatCart))
      setCartCount(flatCart.length)
      window.dispatchEvent(new Event('storage'))
      return updated
    })
  }, [])

  const clearCart = useCallback(() => {
    setCartItems([])
    localStorage.setItem('cart', JSON.stringify([]))
    setCartCount(0)
    window.dispatchEvent(new Event('storage'))
  }, [])

  const loadCategories = useCallback(async () => {
    try {
      const response = await fetch('https://biopharma-backend.onrender.com/api/categories')
      const data = await response.json()
      // Handle both response formats
      const categoriesData = data.categories || data
      setCategories(Array.isArray(categoriesData) ? categoriesData : [])
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }, [])

  const loadProduct = useCallback(async () => {
    try {
      const response = await fetch(`https://biopharma-backend.onrender.com/api/products/${productId}`)
      const data = await response.json()
      // Handle both response formats: { product: {...} } or direct product object
      const productData = data.product || data
      
      // Ensure price is a number
      if (productData) {
        productData.price = typeof productData.price === 'string' 
          ? parseFloat(productData.price) || 0 
          : productData.price
        
        if (productData.originalPrice) {
          productData.originalPrice = typeof productData.originalPrice === 'string' 
            ? parseFloat(productData.originalPrice) || 0 
            : productData.originalPrice
        }
      }
      
      setProduct(productData)
    } catch (error) {
      console.error('Error loading product:', error)
    } finally {
      setIsLoading(false)
    }
  }, [productId])

  const loadReviews = useCallback(async () => {
    setReviewsLoading(true)
    try {
      const response = await fetch(`https://biopharma-backend.onrender.com/api/products/${productId}/reviews`)
      const data = await response.json()
      setReviews(data.reviews || [])
    } catch (error) {
      console.error('Error loading reviews:', error)
    } finally {
      setReviewsLoading(false)
    }
  }, [productId])

  const loadSimilarProducts = useCallback(async () => {
    if (!product) return
    
    try {
      const response = await fetch(`https://biopharma-backend.onrender.com/api/products`)
      const data = await response.json()
      const allProducts = data.products || []
      
      // Filter products by same category or subcategory
      const similar = allProducts
        .filter((p: Product) => 
          p._id !== product._id && 
          (p.categoryName === product.categoryName || p.subcategoryName === product.subcategoryName)
        )
        .slice(0, 4)
        .map((p: Product) => ({
          ...p,
          price: typeof p.price === 'string' ? parseFloat(p.price) : p.price
        }))
      
      setSimilarProducts(similar)
    } catch (error) {
      console.error('Error loading similar products:', error)
    }
  }, [product])

  const handleAddToCart = useCallback(() => {
    if (!product) return
    
    setIsAddingToCart(true)
    
    // Get existing cart
    const existingCart = JSON.parse(localStorage.getItem('cart') || '[]')
    
    // Add items
    for (let i = 0; i < quantity; i++) {
      existingCart.push({
        ...product,
        quantity: 1
      })
    }
    
    localStorage.setItem('cart', JSON.stringify(existingCart))
    
    // Trigger storage event for cart update
    window.dispatchEvent(new Event('storage'))
    updateCartCount()
    loadCartItems()
    
    setTimeout(() => {
      setIsAddingToCart(false)
      // Open cart instead of showing alert
      setIsCartOpen(true)
    }, 300)
  }, [product, quantity, updateCartCount, loadCartItems])

  const renderStars = useCallback((rating: number = 0) => {
    return (
      <div className="flex items-center space-x-0.5">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            className={`w-4 h-4 ${i < Math.floor(rating) ? "text-yellow-400 fill-current" : "text-gray-300"}`} 
          />
        ))}
      </div>
    )
  }, [])

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }, [])

  const handleSubmitReview = async () => {
    if (!user) {
      alert('Veuillez vous connecter pour laisser un avis')
      router.push('/?auth=login')
      return
    }

    if (newReviewRating === 0) {
      alert('Veuillez sélectionner une note')
      return
    }

    if (!newReviewTitle.trim()) {
      alert('Veuillez ajouter un titre pour votre avis')
      return
    }

    if (!newReviewComment.trim()) {
      alert('Veuillez écrire un commentaire')
      return
    }

    setIsSubmittingReview(true)
    try {
      const token = localStorage.getItem('authToken')
      
      if (!token) {
        alert('Session expirée. Veuillez vous reconnecter.')
        router.push('/?auth=login')
        return
      }

      const reviewData = {
        rating: newReviewRating,
        title: newReviewTitle.trim(),
        comment: newReviewComment.trim()
      }
      
      console.log('Submitting review:', reviewData)
      console.log('Token (first 20 chars):', token.substring(0, 20) + '...')

      const response = await fetch(`https://biopharma-backend.onrender.com/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(reviewData)
      })

      const data = await response.json()

      if (response.ok) {
        // Reset form
        setNewReviewRating(0)
        setNewReviewTitle("")
        setNewReviewComment("")
        // Reload reviews and product to update average rating
        loadReviews()
        loadProduct()
        alert('Avis ajouté avec succès!')
      } else {
        console.error('Review submission error:', response.status, data)
        console.error('Full error data:', JSON.stringify(data, null, 2))
        
        const errorMessage = data.error || data.message || 'Erreur inconnue'
        
        if (response.status === 401) {
          alert('Session expirée. Veuillez vous reconnecter.')
          localStorage.removeItem('authToken')
          router.push('/?auth=login')
        } else if (response.status === 400) {
          alert(`Erreur: ${errorMessage}`)
        } else {
          alert(`Erreur serveur (${response.status}): ${errorMessage}`)
        }
      }
    } catch (error) {
      console.error('Error submitting review:', error)
      alert('Erreur de connexion. Veuillez vérifier votre connexion internet et réessayer.')
    } finally {
      setIsSubmittingReview(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Produit non trouvé</h2>
          <Button onClick={() => router.push('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à l'accueil
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Navbar */}
      <Navbar 
        user={user}
        cartCount={cartCount}
        onAuthModalOpen={(mode) => {
          router.push('/?auth=' + mode)
        }}
        onLogout={() => {
          localStorage.removeItem('userData')
          localStorage.removeItem('authToken')
          setUser(null)
          router.push('/')
        }}
        onAdminRedirect={() => router.push('/admin')}
        onCartOpen={() => setIsCartOpen(true)}
        minimal={true}
      />

      {/* Product Details */}
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Product Image */}
            <div className="lg:col-span-1">
              <div className="relative aspect-square bg-gray-50 rounded-2xl overflow-hidden sticky top-24">
                {product.badge && (
                  <Badge className="absolute top-4 left-4 z-10 bg-red-500 text-white">
                    {product.badge}
                  </Badge>
                )}
                <img 
                  src={product.image || "/placeholder.jpg"} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                  loading="eager"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.jpg"
                  }}
                />
              </div>
            </div>

            {/* Product Info and Tabs */}
            <div className="lg:col-span-2 space-y-6">
              {/* Product Info */}
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
                
                <h1 className="text-3xl font-bold text-gray-900 mb-3">{product.name}</h1>
                
                <div className="flex items-center space-x-4 mb-6">
                  {renderStars(product.averageRating || 0)}
                  <span className="text-sm text-gray-600">
                    {product.averageRating?.toFixed(1)} {product.totalReviews ? `(${product.totalReviews} avis)` : ''}
                  </span>
                  <Badge className={product.inStock ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                    {product.inStock ? "En stock" : "Rupture"}
                  </Badge>
                </div>
              </div>
              
              {/* Price and Add to Cart */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-100">
                <div className="flex items-baseline space-x-3 mb-4">
                  <div className="text-4xl font-bold text-green-600">{product.price.toFixed(2)} TND</div>
                  {product.originalPrice && (
                    <>
                      <span className="text-xl text-gray-400 line-through">{product.originalPrice.toFixed(2)} TND</span>
                      <Badge className="bg-red-100 text-red-800">
                        -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                      </Badge>
                    </>
                  )}
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="flex items-center border border-gray-200 rounded-lg">
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="h-12 w-12"
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                    </motion.div>
                    <motion.span 
                      key={quantity}
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className="px-6 py-2 font-medium min-w-[4rem] text-center text-lg"
                    >
                      {quantity}
                    </motion.span>
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => setQuantity(quantity + 1)}
                        className="h-12 w-12"
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
                      className="w-full bg-green-600 hover:bg-green-700 h-12 text-lg"
                    >
                      {isAddingToCart ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Ajout...</span>
                        </div>
                      ) : (
                        <>
                          <ShoppingCart className="w-5 h-5 mr-2" />
                          Ajouter au Panier
                        </>
                      )}
                    </Button>
                  </motion.div>
                </div>
              </div>

              {/* Tabs Section */}
              <div className="border-t pt-6">
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
                      className={`px-6 py-3 border-b-2 transition-colors text-lg ${
                        activeTab === tab.id
                          ? 'border-green-500 text-green-600 font-medium'
                          : 'border-transparent text-gray-600 hover:text-green-600'
                      }`}
                    >
                      {tab.label}
                    </motion.button>
                  ))}
                </div>
                
                <div className="pt-6">
                  {activeTab === 'description' && (
                    <div className="prose max-w-none">
                      <p className="text-gray-700 leading-relaxed text-lg">
                        {product.description || "Aucune description disponible."}
                      </p>
                    </div>
                  )}
                  
                  {activeTab === 'reviews' && (
                    <div className="space-y-6">
                      <div className="flex items-center space-x-4 pb-4 border-b">
                        {renderStars(product.averageRating || 0)}
                        <span className="font-semibold text-xl">{product.averageRating?.toFixed(1)}/5</span>
                        <span className="text-gray-600">{product.totalReviews ? `(${product.totalReviews} avis)` : '(Aucun avis)'}</span>
                      </div>

                      {reviewsLoading ? (
                        <div className="flex justify-center py-8">
                          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      ) : reviews.length > 0 ? (
                        <div className="space-y-4 max-h-96 overflow-y-auto">
                          {reviews.map((review) => (
                            <div key={review._id} className="bg-gray-50 rounded-lg p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                    <UserIcon className="w-5 h-5 text-green-600" />
                                  </div>
                                  <div>
                                    <div className="font-medium">{review.user.name}</div>
                                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                                      <Calendar className="w-3 h-3" />
                                      <span>{formatDate(review.createdAt)}</span>
                                    </div>
                                  </div>
                                </div>
                                {renderStars(review.rating)}
                              </div>
                              <p className="text-gray-700">{review.comment}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          Aucun avis pour le moment
                        </div>
                      )}

                      {/* Add Review Form */}
                      <div className="border-t pt-6 mt-6">
                        <h3 className="text-lg font-semibold mb-4">Laisser un avis</h3>
                        
                        {/* Star Rating Input */}
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Votre note</label>
                          <div className="flex items-center space-x-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <motion.button
                                key={star}
                                type="button"
                                whileHover={{ scale: 1.2 }}
                                whileTap={{ scale: 0.9 }}
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                onClick={() => setNewReviewRating(star)}
                                className="focus:outline-none"
                              >
                                <Star 
                                  className={`w-8 h-8 transition-colors ${
                                    star <= (hoverRating || newReviewRating) 
                                      ? "text-yellow-400 fill-current" 
                                      : "text-gray-300"
                                  }`} 
                                />
                              </motion.button>
                            ))}
                            <span className="ml-2 text-sm text-gray-600">
                              {newReviewRating > 0 ? `${newReviewRating}/5` : 'Sélectionnez une note'}
                            </span>
                          </div>
                        </div>

                        {/* Title Input */}
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Titre de votre avis</label>
                          <input
                            type="text"
                            value={newReviewTitle}
                            onChange={(e) => setNewReviewTitle(e.target.value)}
                            placeholder="Résumez votre avis en quelques mots..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            maxLength={100}
                          />
                        </div>

                        {/* Comment Input */}
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Votre commentaire</label>
                          <Textarea
                            value={newReviewComment}
                            onChange={(e) => setNewReviewComment(e.target.value)}
                            placeholder="Partagez votre expérience avec ce produit..."
                            className="min-h-[100px] border-gray-300 focus:border-green-500 focus:ring-green-500"
                          />
                        </div>

                        {/* Submit Button */}
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Button
                            onClick={handleSubmitReview}
                            disabled={isSubmittingReview || newReviewRating === 0 || !newReviewTitle.trim() || !newReviewComment.trim()}
                            className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
                          >
                            {isSubmittingReview ? (
                              <div className="flex items-center space-x-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Envoi...</span>
                              </div>
                            ) : (
                              <>
                                <Send className="w-4 h-4 mr-2" />
                                Envoyer l'avis
                              </>
                            )}
                          </Button>
                        </motion.div>

                        {!user && (
                          <p className="mt-3 text-sm text-gray-500">
                            <button 
                              onClick={() => router.push('/?auth=login')}
                              className="text-green-600 hover:underline font-medium"
                            >
                              Connectez-vous
                            </button>
                            {' '}pour laisser un avis
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Products */}
        {similarProducts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">Produits Similaires</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {similarProducts.map((similarProduct) => (
                <Card 
                  key={similarProduct._id}
                  className="group hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border-green-100"
                  onClick={() => router.push(`/product/${similarProduct._id}`)}
                >
                  <div className="relative aspect-square overflow-hidden bg-gray-50">
                    {similarProduct.badge && (
                      <Badge className="absolute top-2 left-2 z-10 bg-red-500 text-white text-xs">
                        {similarProduct.badge}
                      </Badge>
                    )}
                    <img 
                      src={similarProduct.image || "/placeholder.jpg"} 
                      alt={similarProduct.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.jpg"
                      }}
                    />
                  </div>
                  <CardContent className="p-4">
                    <Badge className="mb-2 bg-green-100 text-green-800 text-xs">
                      {similarProduct.categoryName}
                    </Badge>
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-green-600 transition-colors">
                      {similarProduct.name}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-green-600">
                        {similarProduct.price.toFixed(2)} TND
                      </span>
                      {similarProduct.averageRating && (
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-sm text-gray-600">{similarProduct.averageRating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-16 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 mb-12">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center">
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-bold">BioPharma</span>
              </div>
              <p className="text-gray-400 leading-relaxed mb-6">
                Votre partenaire santé de confiance pour une vie plus saine et équilibrée.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-6">Navigation</h3>
              <ul className="space-y-3">
                {["Accueil", "Produits", "À Propos", "Contact"].map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a href="/" className="text-gray-400 hover:text-green-400 transition-colors duration-200 flex items-center group">
                      <span className="w-0 h-0.5 bg-green-400 group-hover:w-4 mr-0 group-hover:mr-2 transition-all duration-200"></span>
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <p className="text-gray-400 text-sm">
                © 2024 BioPharma. Tous droits réservés.
              </p>
              <div className="flex items-center space-x-6 text-sm text-gray-400">
                <a href="#" className="hover:text-green-400 transition-colors">Mentions légales</a>
                <span>•</span>
                <a href="#" className="hover:text-green-400 transition-colors">Plan du site</a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="grid grid-cols-4 gap-1">
          <a
            href="/"
            className="flex flex-col items-center justify-center py-2 px-1 hover:bg-green-50 transition-colors"
          >
            <div className="w-6 h-6 mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-700">
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
            </div>
            <span className="text-xs font-medium text-gray-700">Accueil</span>
          </a>

          <a
            href="/#produits"
            className="flex flex-col items-center justify-center py-2 px-1 hover:bg-green-50 transition-colors"
          >
            <div className="w-6 h-6 mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-700">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <span className="text-xs font-medium text-gray-700">Produits</span>
          </a>

          <button
            onClick={() => setIsCartOpen(true)}
            className="flex flex-col items-center justify-center py-2 px-1 hover:bg-green-50 transition-colors relative"
          >
            <div className="w-6 h-6 mb-1 relative">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-700">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="text-xs font-medium text-gray-700">Panier</span>
          </button>

          <button
            onClick={() => {
              const userData = localStorage.getItem('user')
              if (userData) {
                const user = JSON.parse(userData)
                if (user.role === 'admin') {
                  window.location.href = '/admin'
                } else {
                  window.location.href = '/'
                }
              } else {
                window.location.href = '/'
              }
            }}
            className="flex flex-col items-center justify-center py-2 px-1 hover:bg-green-50 transition-colors"
          >
            <div className="w-6 h-6 mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-700">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <span className="text-xs font-medium text-gray-700">Compte</span>
          </button>
        </div>
      </div>

      {/* Spacer for mobile bottom nav */}
      <div className="lg:hidden h-16"></div>

      {/* Cart Sheet */}
      <CartSheet
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        updateQuantity={updateCartQuantity}
        removeFromCart={removeFromCart}
        clearCart={clearCart}
      />
    </div>
  )
}
