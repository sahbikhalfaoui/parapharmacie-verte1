"use client"
import React, { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"
import Navbar from "@/components/Navbar"
import { 
  Star, 
  ShoppingCart, 
  Plus, 
  Minus, 
  ArrowLeft,
  Calendar,
  User as UserIcon,
  Heart
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

  useEffect(() => {
    loadProduct()
    loadUserData()
    updateCartCount()
    loadCategories()
  }, [productId])

  useEffect(() => {
    if (product) {
      loadReviews()
      loadSimilarProducts()
    }
  }, [product])

  const loadUserData = () => {
    const userData = localStorage.getItem('userData')
    if (userData) {
      try {
        setUser(JSON.parse(userData))
      } catch (error) {
        console.error('Error parsing user data:', error)
      }
    }
  }

  const updateCartCount = () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    setCartCount(cart.length)
  }

  const loadCategories = async () => {
    try {
      const response = await fetch('https://biopharma-backend.onrender.com/api/categories')
      const data = await response.json()
      console.log('Categories loaded:', data)
      // Handle both response formats
      const categoriesData = data.categories || data
      setCategories(Array.isArray(categoriesData) ? categoriesData : [])
      console.log('Categories set:', Array.isArray(categoriesData) ? categoriesData.length : 0)
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const loadProduct = async () => {
    try {
      const response = await fetch(`https://biopharma-backend.onrender.com/api/products/${productId}`)
      const data = await response.json()
      console.log('Product data:', data)
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
  }

  const loadReviews = async () => {
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
  }

  const loadSimilarProducts = async () => {
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
  }

  const handleAddToCart = () => {
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
    
    setTimeout(() => {
      setIsAddingToCart(false)
      alert(`${product.name} ajouté au panier`)
    }, 500)
  }

  const renderStars = (rating: number = 0) => {
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
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
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
        onCartOpen={() => router.push('/?cart=true')}
        categories={categories}
        onCategorySelect={(categoryName, subcategoryName) => {
          const query = subcategoryName 
            ? `?category=${encodeURIComponent(categoryName)}&subcategory=${encodeURIComponent(subcategoryName)}`
            : `?category=${encodeURIComponent(categoryName)}`
          router.push('/' + query)
        }}
        onSearchChange={(searchTerm) => {
          router.push('/?search=' + encodeURIComponent(searchTerm))
        }}
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
                    {product.averageRating?.toFixed(1)} ({product.totalReviews || 0} avis)
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
                        <span className="text-gray-600">({product.totalReviews || 0} avis)</span>
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
            onClick={() => {
              const currentCart = JSON.parse(localStorage.getItem('cart') || '[]')
              console.log('Cart:', currentCart)
              window.location.href = '/'
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('openCart'))
              }, 500)
            }}
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
    </div>
  )
}
