"use client"
import React, { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ProfileDropdown } from "@/components/Modals"
import { 
  Menu, 
  X, 
  Search, 
  ShoppingCart, 
  Heart,
  TrendingUp,
  Package,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Sparkles,
  Clock,
  Star,
  Tag,
  ArrowRight,
  Phone,
  MapPin,
  Clock3,
  Plus,
  Minus,
  User,
  Calendar,
  Grid3X3,
  List
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Textarea } from "@/components/ui/textarea"

// Define the Product type for the navbar
interface NavbarProduct {
  _id: string
  name: string
  price: string | number
  image?: string
  categoryName?: string
  subcategoryName?: string
  rating?: number
  badge?: string
}

// Define the full Product type for the modal
interface FullProduct {
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

interface User {
  id?: string
  name: string
  email: string
  role?: string
}

interface Category {
  _id: string
  name: string
  description?: string
  subcategories?: Subcategory[]
}

interface Subcategory {
  _id: string
  name: string
  category: string
}

interface NavbarProps {
  user: User | null
  cartCount: number
  onAuthModalOpen: (mode: "login" | "register") => void
  onLogout: () => void
  onAdminRedirect: () => void
  onCartOpen: () => void
  categories?: Category[]
  onCategorySelect?: (categoryName: string, subcategoryName?: string) => void
  onProductClick?: (product: NavbarProduct) => void
  onSearchChange?: (searchTerm: string) => void
  onAddToCart?: (product: FullProduct) => void
  minimal?: boolean
}

// Product Detail Modal Component for Navbar
const NavbarProductDetailModal: React.FC<{
  product: FullProduct | null
  isOpen: boolean
  onClose: () => void
  onAddToCart: (product: FullProduct) => void
  user: User | null
}> = ({ product, isOpen, onClose, onAddToCart, user }) => {
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState('description')
  const [isAddingToCart, setIsAddingToCart] = useState(false)

  const handleAddToCart = async () => {
    if (!product) return
    
    setIsAddingToCart(true)
    try {
      onAddToCart(product)
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
          className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
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
                      { id: 'details', label: 'Détails' }
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
                      <p className="text-gray-700 leading-relaxed">
                        {product.description || `Produit ${product.name} de haute qualité.`}
                      </p>
                    )}
                    
                    {activeTab === 'details' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-500">Catégorie</p>
                            <p className="font-medium">{product.categoryName}</p>
                          </div>
                          {product.subcategoryName && product.subcategoryName !== 'Aucune' && (
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-gray-500">Sous-catégorie</p>
                              <p className="font-medium">{product.subcategoryName}</p>
                            </div>
                          )}
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-500">Disponibilité</p>
                            <Badge className={product.inStock ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                              {product.inStock ? "En stock" : "Rupture de stock"}
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-500">Note moyenne</p>
                            <div className="flex items-center space-x-2">
                              {renderStars(product.averageRating || 0)}
                              <span className="font-medium">{product.averageRating?.toFixed(1)}/5</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                          <h4 className="font-semibold mb-2">Options de livraison</h4>
                          <ul className="space-y-2 text-sm text-gray-600">
                            <li className="flex items-center space-x-2">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span>Livraison standard: 2-3 jours ouvrables</span>
                            </li>
                            <li className="flex items-center space-x-2">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span>Livraison express disponible</span>
                            </li>
                            <li className="flex items-center space-x-2">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span>Retour gratuit sous 30 jours</span>
                            </li>
                          </ul>
                        </div>
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

// CheckCircle icon component
const CheckCircle = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
)

const Navbar: React.FC<NavbarProps> = ({
  user,
  cartCount,
  onAuthModalOpen,
  onLogout,
  onAdminRedirect,
  onCartOpen,
  categories = [],
  onCategorySelect,
  onProductClick,
  onSearchChange,
  onAddToCart,
  minimal = false
}) => {
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [localSearchTerm, setLocalSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<{
    products: NavbarProduct[]
    categories: Category[]
  }>({ products: [], categories: [] })
  const [popularProducts, setPopularProducts] = useState<NavbarProduct[]>([])
  const [popularCategories, setPopularCategories] = useState<Category[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [scrolled, setScrolled] = useState(false)
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)
  const [isMobileCategoriesOpen, setIsMobileCategoriesOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<FullProduct | null>(null)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    loadPopularItems()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false)
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node) && isMenuOpen) {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMenuOpen])

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (localSearchTerm.trim().length >= 2) {
        performSearch(localSearchTerm)
        setIsInitialLoad(false)
      } else if (localSearchTerm.trim().length === 0) {
        setSearchResults({ products: [], categories: [] })
        setIsInitialLoad(true)
      }
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [localSearchTerm])

  const loadPopularItems = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        fetch('https://biopharma-backend.onrender.com/api/products?limit=8&sortBy=rating&sortOrder=desc'),
        fetch('https://biopharma-backend.onrender.com/api/categories')
      ])

      if (productsRes.ok && categoriesRes.ok) {
        const productsData = await productsRes.json()
        const categoriesData = await categoriesRes.json()

        const products = (productsData.products || []).slice(0, 8).map((p: any) => ({
          _id: p._id,
          name: p.name,
          price: p.price,
          image: p.image,
          categoryName: p.category?.name || 'Non catégorisé',
          subcategoryName: p.subcategory?.name,
          rating: p.averageRating || 0,
          badge: p.badge
        }))

        const categories = (Array.isArray(categoriesData) ? categoriesData : []).slice(0, 8)

        setPopularProducts(products)
        setPopularCategories(categories)
      }
    } catch (error) {
      console.error('Error loading popular items:', error)
    }
  }

  const performSearch = async (query: string) => {
    setIsSearching(true)
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        fetch(`https://biopharma-backend.onrender.com/api/products?search=${encodeURIComponent(query)}&limit=8`),
        fetch('https://biopharma-backend.onrender.com/api/categories')
      ])

      if (!productsRes.ok || !categoriesRes.ok) {
        throw new Error('Search request failed')
      }

      const productsData = await productsRes.json()
      const categoriesData = await categoriesRes.json()

      const productsArray = productsData.products || []
      
      const products = productsArray
        .slice(0, 8)
        .map((p: any) => ({
          _id: p._id,
          name: p.name,
          price: p.price,
          image: p.image,
          categoryName: p.category?.name || 'Non catégorisé',
          subcategoryName: p.subcategory?.name,
          rating: p.averageRating || 0,
          badge: p.badge
        }))

      const categories = (Array.isArray(categoriesData) ? categoriesData : [])
        .filter((c: any) => c.name.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 8)

      setSearchResults({ products, categories })
      setShowSearchResults(true)
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults({ products: [], categories: [] })
    } finally {
      setIsSearching(false)
    }
  }

  const handleProductClick = async (product: NavbarProduct) => {
    console.log('Product clicked from navbar:', product)
    console.log('Navigating to:', `/product/${product._id}`)
    
    // Close search results first
    setShowSearchResults(false)
    setLocalSearchTerm("")
    
    // Navigate to product page
    try {
      await router.push(`/product/${product._id}`)
      console.log('Navigation complete')
    } catch (error) {
      console.error('Navigation error:', error)
    }
    
    // Also notify parent if needed
    if (onProductClick) {
      onProductClick(product)
    }
  }

  const handleAddToCart = (product: FullProduct) => {
    if (onAddToCart) {
      onAddToCart(product)
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (onSearchChange && localSearchTerm.trim()) {
      onSearchChange(localSearchTerm)
      setShowSearchResults(false)
      setIsMenuOpen(false)
    }
  }

  const handleCategoryClick = (categoryName: string, subcategoryName?: string) => {
    setShowSearchResults(false)
    setLocalSearchTerm("")
    setHoveredCategory(null)
    setIsMenuOpen(false)
    setIsMobileCategoriesOpen(false)
    
    if (onCategorySelect) {
      onCategorySelect(categoryName, subcategoryName)
    }
  }

  const formatPrice = (price: string | number): string => {
    if (typeof price === 'number') {
      return price.toFixed(2)
    }
    const numPrice = parseFloat(price)
    return isNaN(numPrice) ? price : numPrice.toFixed(2)
  }

  const displayProducts = isInitialLoad ? popularProducts : searchResults.products
  const displayCategories = isInitialLoad ? popularCategories : searchResults.categories

  // Minimal navbar for product pages
  if (minimal) {
    return (
      <nav className={`sticky top-0 z-50 transition-all duration-500 ${
        scrolled 
          ? 'bg-white shadow-xl border-b border-green-200' 
          : 'bg-white/95 backdrop-blur-md border-b border-green-100 shadow-lg'
      }`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            {/* Home Button */}
            <Button
              variant="ghost"
              onClick={() => router.push('/')}
              className="flex items-center space-x-2 hover:bg-green-50 hover:text-green-600 rounded-xl transition-all duration-300"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center">
                <img 
                  src="/logo-icon_vff.png" 
                  alt="BioPharma Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="hidden sm:block text-lg font-bold bg-gradient-to-r from-green-700 via-emerald-600 to-green-600 bg-clip-text text-transparent">
                BioPharma
              </span>
            </Button>

            {/* Right Actions: Cart & Profile */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Cart Button */}
              <Button 
                variant="ghost" 
                size="sm" 
                className="relative hover:bg-green-50 hover:text-green-600 rounded-xl transition-all duration-300 hover:scale-105" 
                onClick={onCartOpen}
              >
                <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 bg-gradient-to-r from-red-600 to-red-500 text-white text-xs rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center font-bold shadow-lg animate-bounce">
                    {cartCount}
                  </span>
                )}
              </Button>
              
              {/* Profile/Auth */}
              {user ? (
                <ProfileDropdown 
                  user={user} 
                  onLogout={onLogout}
                  onAdminClick={onAdminRedirect}
                />
              ) : (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onAuthModalOpen("login")}
                  className="hover:bg-green-50 hover:text-green-600 rounded-xl transition-all duration-300 hover:scale-105"
                >
                  <User className="h-5 w-5 sm:h-6 sm:w-6" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <>
      {/* Top Info Bar - Mobile Optimized */}
      <div className="bg-green-50 border-b border-green-100">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-10 text-xs sm:text-sm">
            <div className="flex items-center space-x-3 sm:space-x-4 md:space-x-6 text-gray-700 overflow-x-auto scrollbar-hide">
              <div className="flex items-center space-x-1 sm:space-x-2 hover:text-green-600 transition-colors cursor-pointer flex-shrink-0">
                <Phone className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm">+216 26 744 525</span>
              </div>
              <a 
                href="https://maps.app.goo.gl/66ZSb1mcWrwerZqm6" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hidden xs:flex items-center space-x-1 sm:space-x-2 hover:text-green-600 transition-colors cursor-pointer flex-shrink-0"
              >
                <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm">Grombalia, Tunisia</span>
              </a>
              <div className="hidden sm:flex items-center space-x-1 sm:space-x-2 hover:text-green-600 transition-colors cursor-pointer flex-shrink-0">
                <Clock3 className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm">Lun-Sam: 8h-20h</span>
              </div>
            </div>
            <div className="text-green-700 font-medium hidden xs:flex items-center space-x-1 sm:space-x-2 animate-pulse flex-shrink-0">
              <span>✅</span>
              <span className="text-xs sm:text-sm">Livraison gratuite</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <nav className={`sticky top-0 z-50 transition-all duration-500 ${
        scrolled 
          ? 'bg-white shadow-xl border-b border-green-200' 
          : 'bg-white/95 backdrop-blur-md border-b border-green-100 shadow-lg'
      }`} ref={mobileMenuRef}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            {/* Logo Section */}
            <div className="flex items-center">
              <div 
                className="flex items-center space-x-2 sm:space-x-3 cursor-pointer group" 
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-all duration-300">
                  <img 
                    src="/logo-icon_vff.png" 
                    alt="BioPharma Logo" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="hidden sm:block">
                  <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-700 via-emerald-600 to-green-600 bg-clip-text text-transparent">
                    BioPharma 
                  </span>
                  <p className="text-xs text-gray-500 -mt-1 group-hover:text-green-600 transition-colors">Votre santé, notre priorité</p>
                </div>
              </div>
            </div>

            {/* Desktop Navigation Links - Hidden on Mobile */}
            <div className="hidden lg:flex items-center space-x-1">
              {[
                { name: "Accueil", href: "/" },
                { name: "Produits", href: "/#produits" },
                { name: "À Propos", href: "/#about" },
                { name: "Contact", href: "/#contact" }
              ].map((item) => (
                <a 
                  key={item.name} 
                  href={item.href} 
                  className="px-3 py-2 text-sm text-gray-700 hover:text-green-600 transition-all duration-300 font-medium relative group rounded-lg hover:bg-green-50"
                >
                  {item.name}
                  <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-green-600 to-emerald-600 group-hover:w-3/4 transition-all duration-300"></span>
                </a>
              ))}
            </div>

            {/* Search Bar - Hidden on Mobile */}
            <div className="hidden md:block flex-1 max-w-2xl mx-4 lg:mx-8">
              <div className="relative" ref={searchRef}>
                <form onSubmit={handleSearchSubmit}>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400 transition-colors duration-200 peer-focus:text-green-600" />
                    <Input
                      type="text"
                      placeholder="Rechercher produits..."
                      value={localSearchTerm}
                      onChange={(e) => setLocalSearchTerm(e.target.value)}
                      onFocus={() => setShowSearchResults(true)}
                      className="peer pl-10 pr-4 h-10 sm:h-12 text-sm sm:text-base border-2 border-green-100 focus:border-green-400 focus:ring-2 sm:focus:ring-4 focus:ring-green-100 rounded-xl bg-gray-50 focus:bg-white transition-all duration-300 shadow-sm hover:shadow-md focus:shadow-lg"
                    />
                    {isSearching && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-green-600 border-t-transparent"></div>
                      </div>
                    )}
                  </div>
                </form>

                {/* Search Results Dropdown */}
                {showSearchResults && (
                  <div 
                    className="fixed left-2 right-2 sm:left-4 sm:right-4 lg:left-1/2 lg:right-auto lg:-translate-x-1/2 bg-white rounded-2xl shadow-2xl border border-green-100 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-300"
                    style={{ 
                      width: 'calc(100% - 1rem)',
                      maxWidth: '1280px',
                      maxHeight: '80vh',
                      top: 'calc(100% + 8px)',
                    }}
                  >
                    <div className="overflow-y-auto max-h-[80vh]">
                      <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-green-700 p-4 sm:p-6 text-white">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 sm:space-x-3">
                            {isInitialLoad ? (
                              <div>
                                <h3 className="text-base sm:text-lg font-bold">Découvrez nos produits</h3>
                                <p className="text-xs sm:text-sm text-green-50 mt-0.5">Explorez notre sélection populaire</p>
                              </div>
                            ) : (
                              <>
                                <Search className="w-5 h-5 sm:w-6 sm:h-6" />
                                <div>
                                  <h3 className="text-base sm:text-lg font-bold">Résultats de recherche</h3>
                                  <p className="text-xs sm:text-sm text-green-50 mt-0.5">
                                    {displayProducts.length + displayCategories.length} résultats pour "{localSearchTerm}"
                                  </p>
                                </div>
                              </>
                            )}
                          </div>
                          <button
                            onClick={() => setShowSearchResults(false)}
                            className="p-1 sm:p-2 hover:bg-white/20 rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                        </div>
                      </div>

                      <div className="p-4 sm:p-6">
                        {displayProducts.length > 0 && (
                          <div>
                            <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                              {isInitialLoad ? (
                                <>
                                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                                  <h4 className="text-xs sm:text-sm font-bold text-gray-900 uppercase tracking-wide">Produits Populaires</h4>
                                </>
                              ) : (
                                <>
                                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                                  <h4 className="text-xs sm:text-sm font-bold text-gray-900 uppercase tracking-wide">Produits Trouvés</h4>
                                </>
                              )}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {displayProducts.map((product) => (
                                <motion.div
                                  key={product._id}
                                  onClick={() => {
                                    window.location.href = `/product/${product._id}`
                                  }}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 rounded-xl transition-all duration-200 group border border-gray-100 hover:border-green-200 hover:shadow-md cursor-pointer"
                                >
                                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden flex-shrink-0 border-2 border-gray-200 group-hover:border-green-300 transition-colors">
                                    <img 
                                      src={product.image || "/placeholder-product.jpg"} 
                                      alt={product.name}
                                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                      onError={(e) => {
                                        e.currentTarget.src = "/placeholder-product.jpg"
                                      }}
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs sm:text-sm font-semibold text-gray-900 group-hover:text-green-600 line-clamp-2 mb-2 transition-colors">
                                      {product.name}
                                    </p>
                                    <div className="flex items-center space-x-2 mb-2">
                                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 font-medium">
                                        {product.categoryName}
                                      </Badge>
                                      {product.rating && product.rating > 0 && (
                                        <div className="flex items-center space-x-1">
                                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                          <span className="text-xs font-medium text-gray-600">{product.rating.toFixed(1)}</span>
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm sm:text-base font-bold text-green-600">
                                        {formatPrice(product.price)} TND
                                      </span>
                                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-green-600 transform group-hover:translate-x-1 transition-all" />
                                    </div>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {!isInitialLoad && localSearchTerm.length >= 2 && displayProducts.length === 0 && !isSearching && (
                        <div className="p-6 sm:p-12 text-center">
                          <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                            <Search className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400" />
                          </div>
                          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Aucun résultat trouvé</h3>
                          <p className="text-gray-500 text-sm sm:text-base mb-4 sm:mb-6">Essayez d'autres mots-clés ou parcourez nos catégories populaires</p>
                          <Button
                            onClick={() => setLocalSearchTerm("")}
                            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 text-sm sm:text-base"
                          >
                            Réinitialiser la recherche
                          </Button>
                        </div>
                      )}

                      <div className="bg-gradient-to-r from-gray-50 to-green-50 px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200">
                        <p className="text-xs text-gray-600 text-center font-medium">
                          Tapez au moins 2 caractères pour lancer une recherche
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Desktop User Actions */}
            <div className="hidden md:flex items-center space-x-2 sm:space-x-3">
              <Button 
                variant="ghost" 
                size="sm" 
                className="relative hover:bg-green-50 hover:text-green-600 rounded-xl transition-all duration-300 hover:scale-105" 
                onClick={onCartOpen}
              >
                <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 bg-gradient-to-r from-red-600 to-red-500 text-white text-xs rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center font-bold shadow-lg animate-bounce">
                    {cartCount}
                  </span>
                )}
              </Button>
              
              {user ? (
                <ProfileDropdown 
                  user={user} 
                  onLogout={onLogout}
                  onAdminClick={onAdminRedirect}
                />
              ) : (
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onAuthModalOpen("login")}
                    className="border-2 border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 rounded-xl font-medium transition-all duration-300 hover:scale-105 text-xs sm:text-sm"
                  >
                    Connexion
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => onAuthModalOpen("register")}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-xs sm:text-sm"
                  >
                    Inscription
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button & Cart */}
            <div className="md:hidden flex items-center space-x-2">
              {/* Mobile Search Button */}
              <Button 
                variant="ghost" 
                size="sm" 
                className="relative"
                onClick={() => {
                  const searchInput = document.getElementById('mobile-search-input')
                  if (searchInput) {
                    searchInput.focus()
                  }
                }}
              >
                <Search className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="relative" 
                onClick={onCartOpen}
              >
                <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    {cartCount}
                  </span>
                )}
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="transition-transform duration-300 hover:scale-110"
              >
                {isMenuOpen ? <X className="h-5 w-5 sm:h-6 sm:w-6" /> : <Menu className="h-5 w-5 sm:h-6 sm:w-6" />}
              </Button>
            </div>
          </div>

          {/* Mobile Search Bar - Always visible on mobile */}
          <div className="md:hidden mb-3">
            <div className="relative" ref={searchRef}>
              <form onSubmit={handleSearchSubmit}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 transition-colors duration-200 peer-focus:text-green-600" />
                  <Input
                    id="mobile-search-input"
                    type="text"
                    placeholder="Rechercher produits..."
                    value={localSearchTerm}
                    onChange={(e) => setLocalSearchTerm(e.target.value)}
                    onFocus={() => setShowSearchResults(true)}
                    className="peer pl-10 pr-4 h-10 text-sm border-2 border-green-100 focus:border-green-400 focus:ring-2 focus:ring-green-100 rounded-xl bg-gray-50 focus:bg-white transition-all duration-300 shadow-sm hover:shadow-md focus:shadow-lg"
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-600 border-t-transparent"></div>
                    </div>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden bg-white rounded-xl shadow-2xl border border-green-100 mb-4 animate-in slide-in-from-top-4 duration-300 max-h-[calc(100vh-200px)] overflow-y-auto">
              <div className="p-4 space-y-4">
                {/* Mobile Navigation Links */}
                <div className="space-y-2">
                  {[
                    { name: "Accueil", href: "/" },
                    { name: "Produits", href: "/#produits" },
                    { name: "À Propos", href: "/#about" },
                    { name: "Contact", href: "/#contact" }
                  ].map((item) => (
                    <a 
                      key={item.name} 
                      href={item.href} 
                      className="flex items-center justify-between py-3 px-4 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-xl font-medium transition-all duration-200 group" 
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span>{item.name}</span>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all" />
                    </a>
                  ))}
                </div>

                {/* Mobile Categories Accordion */}
                {categories.length > 0 && (
                  <div className="border-t border-green-100 pt-4">
                    <button
                      onClick={() => setIsMobileCategoriesOpen(!isMobileCategoriesOpen)}
                      className="flex items-center justify-between w-full py-3 px-4 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-xl font-medium transition-all duration-200"
                    >
                      <div className="flex items-center space-x-2">
                        <Package className="w-4 h-4" />
                        <span>Catégories</span>
                      </div>
                      <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isMobileCategoriesOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {isMobileCategoriesOpen && (
                      <div className="mt-2 space-y-1 ml-4">
                        <button
                          onClick={() => handleCategoryClick('Tous')}
                          className="w-full text-left py-2 px-3 text-sm text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        >
                          Toutes les catégories
                        </button>
                        {categories.map((category) => (
                          <div key={category._id} className="space-y-1">
                            <button
                              onClick={() => {
                                if (category.subcategories && category.subcategories.length > 0) {
                                  // Toggle subcategories
                                } else {
                                  handleCategoryClick(category.name)
                                }
                              }}
                              className="w-full text-left py-2 px-3 text-sm text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors flex items-center justify-between"
                            >
                              <span>{category.name}</span>
                              {category.subcategories && category.subcategories.length > 0 && (
                                <ChevronDown className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* User Section */}
                <div className="pt-4 border-t border-green-100">
                  {user ? (
                    <div className="space-y-3">
                      <div className="px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                        <p className="text-sm font-medium text-gray-900">Bonjour, {user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                      {user.role === 'admin' && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => { onAdminRedirect(); setIsMenuOpen(false); }} 
                          className="w-full border-green-200 rounded-xl hover:bg-green-50 transition-all duration-200 text-sm"
                        >
                          Panneau Admin
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => { onLogout(); setIsMenuOpen(false); }} 
                        className="w-full border-green-200 rounded-xl hover:bg-green-50 transition-all duration-200 text-sm"
                      >
                        Déconnexion
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => { onAuthModalOpen("login"); setIsMenuOpen(false); }} 
                        className="w-full border-2 border-green-200 rounded-xl hover:bg-green-50 transition-all duration-200 text-sm"
                      >
                        Connexion
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => { onAuthModalOpen("register"); setIsMenuOpen(false); }} 
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-xl shadow-lg transition-all duration-200 text-sm"
                      >
                        Inscription
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Categories Bar with Mega Menu - Desktop Only */}
      <div 
        className={`hidden lg:block bg-gradient-to-r from-green-700 via-green-600 to-green-700 shadow-lg transition-all duration-500 sticky z-40 ${
          scrolled 
            ? 'top-[64px] sm:top-[80px] opacity-0 -translate-y-full pointer-events-none' 
            : 'top-[64px] sm:top-[80px] opacity-100 translate-y-0'
        }`}
        style={{ backgroundSize: '200% 200%', animation: 'gradientShift 15s ease infinite' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          {/* Main Categories Bar */}
          <div className="flex items-center space-x-2 py-3">
            {/* All Categories Button */}
            <button
              onClick={() => handleCategoryClick('Tous')}
              className="group px-4 py-2 text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl transition-all duration-300 whitespace-nowrap font-semibold text-sm flex items-center space-x-2 border border-white/20 hover:border-white/40 hover:scale-105 shadow-lg hover:shadow-xl flex-shrink-0"
            >
              <div className="p-1.5 bg-white/20 rounded-lg group-hover:bg-white/30 transition-all duration-300 group-hover:rotate-12">
                <Package className="w-4 h-4" />
              </div>
              <span className="group-hover:translate-x-0.5 transition-transform duration-300">
                Toutes les catégories
              </span>
            </button>

            <div className="h-6 w-px bg-white/20 flex-shrink-0"></div>

            {/* Scroll Left Button */}
            <button
              onClick={() => {
                const container = document.getElementById('categories-scroll')
                if (container) {
                  container.scrollBy({ left: -200, behavior: 'smooth' })
                }
              }}
              className="flex-shrink-0 p-2 text-white hover:bg-white/10 rounded-lg transition-all duration-200 hover:scale-110"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Scrollable Categories */}
            <div className="flex-1 relative overflow-hidden">
              <div 
                id="categories-scroll"
                className="flex items-center space-x-2 overflow-x-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent hover:scrollbar-thumb-white/40 pb-2"
                style={{ scrollBehavior: 'smooth' }}
              >
                {categories.map((category, index) => {
                  const hasSubcategories = category.subcategories && category.subcategories.length > 0
                  
                  return (
                    <div 
                      key={category._id}
                      className="relative flex-shrink-0"
                      onMouseEnter={() => setHoveredCategory(category._id)}
                    >
                      <button
                        onClick={() => handleCategoryClick(category.name)}
                        className="group relative px-4 py-2 text-white hover:bg-white/10 rounded-xl transition-all duration-300 whitespace-nowrap font-medium text-sm flex items-center space-x-2 hover:scale-105 hover:shadow-lg"
                        style={{
                          animation: `slideInFromRight 0.5s ease-out ${index * 0.1}s both`
                        }}
                      >
                        <div className="p-1.5 bg-white/10 rounded-lg group-hover:bg-white/20 transition-all duration-300 group-hover:rotate-12 group-hover:scale-110">
                          <Tag className="w-4 h-4" />
                        </div>
                        
                        <span className="relative group-hover:translate-x-0.5 transition-transform duration-300">
                          {category.name}
                          <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300 rounded-full"></span>
                        </span>

                        {hasSubcategories && (
                          <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${hoveredCategory === category._id ? 'rotate-180' : ''}`} />
                        )}

                        <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                        </div>
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Scroll Right Button */}
            <button
              onClick={() => {
                const container = document.getElementById('categories-scroll')
                if (container) {
                  container.scrollBy({ left: 200, behavior: 'smooth' })
                }
              }}
              className="flex-shrink-0 p-2 text-white hover:bg-white/10 rounded-lg transition-all duration-200 hover:scale-110"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Mega Menu Dropdown */}
          {hoveredCategory && categories.find(c => c._id === hoveredCategory) && (
            <div
              className="absolute left-0 right-0 bg-white shadow-2xl border-t-4 border-green-500 z-[100]"
              style={{
                top: 'calc(100% + 8px)',
                animation: 'slideDown 0.3s ease-out'
              }}
              onMouseEnter={() => setHoveredCategory(hoveredCategory)}
              onMouseLeave={() => setHoveredCategory(null)}
            >
              {/* Invisible bridge to prevent gap issues */}
              <div 
                className="absolute bottom-full left-0 right-0 h-3 bg-transparent"
                onMouseEnter={() => setHoveredCategory(hoveredCategory)}
              />

              <div className="max-w-7xl mx-auto px-6 py-6">
                {categories
                  .filter(cat => cat._id === hoveredCategory)
                  .map(category => {
                    const subcategories = category.subcategories || []
                    
                    if (subcategories.length === 0) {
                      return (
                        <div key={category._id} className="text-center py-6">
                          <p className="text-gray-500">Aucune sous-catégorie disponible</p>
                        </div>
                      )
                    }

                    return (
                      <div key={category._id}>
                        {/* Category Header */}
                        <div className="mb-4 pb-4 border-b-2 border-green-100">
                          <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center">
                            <Tag className="w-5 h-5 text-green-600 mr-2" />
                            {category.name}
                          </h3>
                          {category.description && (
                            <p className="text-gray-600 text-sm">{category.description}</p>     
                          )}
                          <div className="mt-2 flex items-center space-x-2">
                            <span className="text-xs font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full">
                              {subcategories.length} sous-catégories
                            </span>
                          </div>
                        </div>

                        {/* Subcategories Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          {subcategories.map((subcategory, idx) => (
                            <button
                              key={subcategory._id}
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                setHoveredCategory(null)
                                handleCategoryClick(category.name, subcategory.name)
                              }}
                              onMouseDown={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                              }}
                              className="group p-3 rounded-xl border-2 border-gray-100 hover:border-green-300 hover:bg-gradient-to-br hover:from-green-50 hover:to-emerald-50 transition-all duration-300 text-left hover:shadow-lg hover:scale-105 cursor-pointer"
                              style={{
                                animation: `fadeInUp 0.3s ease-out ${idx * 0.05}s both`
                              }}
                            >
                              <div className="flex items-start space-x-2">
                                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-green-200 group-hover:scale-110 transition-all duration-300">
                                  <ChevronRight className="w-4 h-4 text-green-600 group-hover:translate-x-1 transition-transform" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors line-clamp-2 text-sm">
                                    {subcategory.name}
                                  </h4>
                                  {subcategory.description && (
                                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                      {subcategory.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>

                        {/* View All Button */}
                        <div className="mt-6 text-center">
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              setHoveredCategory(null)
                              handleCategoryClick(category.name)
                            }}
                            onMouseDown={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                            }}
                            className="inline-flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer text-sm"
                          >
                            <span>Voir tous les produits de {category.name}</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-green-400 to-transparent opacity-50"></div>
      </div>

      {/* Mobile Search Results Overlay */}
      {showSearchResults && (displayProducts.length > 0 || displayCategories.length > 0) && (
        <div className="md:hidden fixed inset-0 bg-white z-[100] top-0 pt-20 animate-in slide-in-from-top duration-300">
          <div className="h-full overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-green-100 p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Search className="w-5 h-5 text-green-600" />
                <div>
                  <h3 className="font-bold text-gray-900">
                    {isInitialLoad ? 'Produits populaires' : `Résultats pour "${localSearchTerm}"`}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {displayProducts.length + displayCategories.length} résultats
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSearchResults(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4">
              {displayProducts.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span>Produits</span>
                  </h4>
                  <div className="space-y-3">
                    {displayProducts.map((product) => (
                      <motion.div
                        key={product._id}
                        onClick={() => {
                          window.location.href = `/product/${product._id}`
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full flex items-center space-x-3 p-3 bg-gray-50 hover:bg-green-50 rounded-xl transition-colors border border-gray-100 cursor-pointer"
                      >
                        <div className="relative w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                          <img 
                            src={product.image || "/placeholder-product.jpg"} 
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 line-clamp-2 text-sm mb-1">{product.name}</p>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-green-600">
                              {formatPrice(product.price)} TND
                            </span>
                            {product.rating && product.rating > 0 && (
                              <div className="flex items-center space-x-1">
                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                <span className="text-xs font-medium text-gray-600">{product.rating.toFixed(1)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Product Detail Modal for Navbar */}
      <NavbarProductDetailModal 
        product={selectedProduct}
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false)
          setSelectedProduct(null)
        }}
        onAddToCart={handleAddToCart}
        user={user}
      />

      <style jsx global>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        .scrollbar-thin {
          scrollbar-width: thin;
        }
        
        .scrollbar-thin::-webkit-scrollbar {
          height: 4px;
        }
        
        .scrollbar-thumb-white\/20::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }
        
        .scrollbar-thumb-white\/40::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.4);
        }
        
        .scrollbar-track-transparent::-webkit-scrollbar-track {
          background-color: transparent;
        }

        @keyframes slideInFromRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes gradientShift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Responsive breakpoints */
        @media (max-width: 640px) {
          .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
        }
      `}</style>
    </>
  )
}

export default Navbar