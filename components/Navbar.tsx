"use client"
import React, { useState, useEffect, useRef } from "react"
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
  Clock3
} from "lucide-react"

interface User {
  id?: string
  name: string
  email: string
  role?: string
}

interface Product {
  _id: string
  name: string
  price: string | number
  image?: string
  categoryName?: string
  subcategoryName?: string
  rating?: number
  badge?: string
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
}

const Navbar: React.FC<NavbarProps> = ({
  user,
  cartCount,
  onAuthModalOpen,
  onLogout,
  onAdminRedirect,
  onCartOpen,
  categories = [],
  onCategorySelect
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<{
    products: Product[]
    categories: Category[]
  }>({ products: [], categories: [] })
  const [popularProducts, setPopularProducts] = useState<Product[]>([])
  const [popularCategories, setPopularCategories] = useState<Category[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [scrolled, setScrolled] = useState(false)
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)
  const searchRef = useRef<HTMLDivElement>(null)

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
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.trim().length >= 2) {
        performSearch(searchTerm)
        setIsInitialLoad(false)
      } else if (searchTerm.trim().length === 0) {
        setSearchResults({ products: [], categories: [] })
        setIsInitialLoad(true)
      }
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [searchTerm])

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

  const handleProductClick = (productId: string) => {
    setShowSearchResults(false)
    setSearchTerm("")
    const productsSection = document.getElementById('produits')
    if (productsSection) {
      productsSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleCategoryClick = (categoryName: string, subcategoryName?: string) => {
    setShowSearchResults(false)
    setSearchTerm("")
    setHoveredCategory(null)
    
    if (onCategorySelect) {
      onCategorySelect(categoryName, subcategoryName)
    }
    
    const productsSection = document.getElementById('produits')
    if (productsSection) {
      setTimeout(() => {
        productsSection.scrollIntoView({ behavior: 'smooth' })
      }, 100)
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

  return (
    <>
      {/* Top Info Bar */}
      <div className="bg-green-50 border-b border-green-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-10 text-sm">
            <div className="flex items-center space-x-6 text-gray-700">
              <div className="flex items-center space-x-2 hover:text-green-600 transition-colors cursor-pointer">
                <Phone className="w-3 h-3" />
                <span className="hidden sm:inline">+216 26 744 525</span>
              </div>
              <div className="flex items-center space-x-2 hover:text-green-600 transition-colors cursor-pointer">
                <MapPin className="w-3 h-3" />
                <span className="hidden md:inline">Rue El Moez, Grombalia, Tunisia, 8030</span>
              </div>
              <div className="flex items-center space-x-2 hover:text-green-600 transition-colors cursor-pointer">
                <Clock3 className="w-3 h-3" />
                <span className="hidden lg:inline">Lun-Sam: 8h-20h</span>
              </div>
            </div>
            <div className="text-green-700 font-medium hidden md:flex items-center space-x-2 animate-pulse">
              <span>✅</span>
              <span>Livraison gratuite dès 150 TND</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <nav className={`sticky top-0 z-50 transition-all duration-500 ${
        scrolled 
          ? 'bg-white shadow-xl border-b border-green-200' 
          : 'bg-white/95 backdrop-blur-md border-b border-green-100 shadow-lg'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div 
              className="flex items-center space-x-3 cursor-pointer group" 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <div className="w-18 h-18 rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-all duration-300">
                <img 
                  src="/logo-icon_vff.png" 
                  alt="BioPharma Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="hidden sm:block">
                <span className="text-2xl font-bold bg-gradient-to-r from-green-700 via-emerald-600 to-green-600 bg-clip-text text-transparent">
                  BioPharma 
                </span>
                <p className="text-xs text-gray-500 -mt-1 group-hover:text-green-600 transition-colors">Votre santé, notre priorité</p>
              </div>
            </div>

            <div className="hidden lg:flex items-center space-x-1">
              {[
                { name: "Accueil", href: "#accueil" },
                { name: "Produits", href: "#produits" },
                { name: "À Propos", href: "#about" },
                { name: "Contact", href: "#contact" }
              ].map((item) => (
                <a 
                  key={item.name} 
                  href={item.href} 
                  className="px-4 py-2 text-gray-700 hover:text-green-600 transition-all duration-300 font-medium relative group rounded-lg hover:bg-green-50"
                >
                  {item.name}
                  <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-green-600 to-emerald-600 group-hover:w-3/4 transition-all duration-300"></span>
                </a>
              ))}
            </div>

            <div className="hidden md:block flex-1 max-w-2xl mx-8">
              <div className="relative" ref={searchRef}>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 transition-colors duration-200 peer-focus:text-green-600" />
                  <Input
                    type="text"
                    placeholder="Rechercher parmi nos produits et catégories..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setShowSearchResults(true)}
                    className="peer pl-12 pr-4 h-12 border-2 border-green-100 focus:border-green-400 focus:ring-4 focus:ring-green-100 rounded-xl bg-gray-50 focus:bg-white transition-all duration-300 shadow-sm hover:shadow-md focus:shadow-lg text-sm"
                  />
                  {isSearching && (
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-green-600 border-t-transparent"></div>
                    </div>
                  )}
                </div>

                {showSearchResults && (
                  <div 
                    className="fixed left-0 right-0 bg-white rounded-2xl shadow-2xl border border-green-100 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-300"
                    style={{ 
                      width: 'calc(100% - 2rem)',
                      maxWidth: '1280px',
                      maxHeight: '80vh',
                      top: '100%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      marginTop: '8px'
                    }}
                  >
                    <div className="overflow-y-auto max-h-[80vh]">
                      <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-green-700 p-6 text-white">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {isInitialLoad ? (
                              <div>
                                <h3 className="text-lg font-bold">Découvrez nos produits</h3>
                                <p className="text-sm text-green-50 mt-0.5">Explorez notre sélection populaire</p>
                              </div>
                            ) : (
                              <>
                                <Search className="w-6 h-6" />
                                <div>
                                  <h3 className="text-lg font-bold">Résultats de recherche</h3>
                                  <p className="text-sm text-green-50 mt-0.5">
                                    {displayProducts.length + displayCategories.length} résultats pour "{searchTerm}"
                                  </p>
                                </div>
                              </>
                            )}
                          </div>
                          <button
                            onClick={() => setShowSearchResults(false)}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
                        {displayCategories.length > 0 && (
                          <div className="lg:col-span-1">
                            <div className="flex items-center space-x-2 mb-4">
                              <Package className="w-5 h-5 text-green-600" />
                              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                                {isInitialLoad ? 'Catégories Populaires' : 'Catégories'}
                              </h4>
                            </div>
                            <div className="space-y-2">
                              {displayCategories.map((category) => (
                                <button
                                  key={category._id}
                                  onClick={() => handleCategoryClick(category.name)}
                                  className="w-full flex items-center justify-between p-4 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 rounded-xl transition-all duration-200 group border border-gray-100 hover:border-green-200 hover:shadow-md"
                                >
                                  <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                                      <Tag className="w-5 h-5 text-green-600" />
                                    </div>
                                    <span className="text-sm font-semibold text-gray-700 group-hover:text-green-600 transition-colors">
                                      {category.name}
                                    </span>
                                  </div>
                                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 transform group-hover:translate-x-1 transition-all" />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {displayProducts.length > 0 && (
                          <div className={displayCategories.length > 0 ? "lg:col-span-2" : "lg:col-span-3"}>
                            <div className="flex items-center space-x-2 mb-4">
                              {isInitialLoad ? (
                                <>
                                  <TrendingUp className="w-5 h-5 text-green-600" />
                                  <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Produits Populaires</h4>
                                </>
                              ) : (
                                <>
                                  <Clock className="w-5 h-5 text-green-600" />
                                  <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Produits Trouvés</h4>
                                </>
                              )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {displayProducts.map((product) => (
                                <button
                                  key={product._id}
                                  onClick={() => handleProductClick(product._id)}
                                  className="flex items-center space-x-4 p-4 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 rounded-xl transition-all duration-200 group border border-gray-100 hover:border-green-200 hover:shadow-md text-left"
                                >
                                  <div className="relative w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden flex-shrink-0 border-2 border-gray-200 group-hover:border-green-300 transition-colors">
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
                                    <p className="text-sm font-semibold text-gray-900 group-hover:text-green-600 line-clamp-2 mb-2 transition-colors">
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
                                      <span className="text-base font-bold text-green-600">
                                        {formatPrice(product.price)} TND
                                      </span>
                                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-green-600 transform group-hover:translate-x-1 transition-all" />
                                    </div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {!isInitialLoad && searchTerm.length >= 2 && displayProducts.length === 0 && displayCategories.length === 0 && !isSearching && (
                        <div className="p-12 text-center">
                          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Search className="w-12 h-12 text-gray-400" />
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">Aucun résultat trouvé</h3>
                          <p className="text-gray-500 mb-6">Essayez d'autres mots-clés ou parcourez nos catégories populaires</p>
                          <Button
                            onClick={() => setSearchTerm("")}
                            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                          >
                            Réinitialiser la recherche
                          </Button>
                        </div>
                      )}

                      <div className="bg-gradient-to-r from-gray-50 to-green-50 px-6 py-4 border-t border-gray-200">
                        <p className="text-xs text-gray-600 text-center font-medium">
                          Tapez au moins 2 caractères pour lancer une recherche
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-3">
              <Button 
                variant="ghost" 
                size="sm" 
                className="relative hover:bg-green-50 hover:text-green-600 rounded-xl transition-all duration-300 hover:scale-105" 
                onClick={onCartOpen}
              >
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-gradient-to-r from-red-600 to-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-lg animate-bounce">
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
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onAuthModalOpen("login")}
                    className="border-2 border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 rounded-xl font-medium transition-all duration-300 hover:scale-105"
                  >
                    Connexion
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => onAuthModalOpen("register")}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    Inscription
                  </Button>
                </div>
              )}
            </div>

            <div className="md:hidden flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="relative" 
                onClick={onCartOpen}
              >
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
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
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>

          {isMenuOpen && (
            <div className="md:hidden py-6 border-t border-green-100 animate-in slide-in-from-top-4 duration-300">
              <div className="space-y-4">
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-2 border-green-100 rounded-xl focus:border-green-400 focus:ring-2 focus:ring-green-200 transition-all duration-200"
                  />
                </div>

                {[
                  { name: "Accueil", href: "#accueil" },
                  { name: "Produits", href: "#produits" },
                  { name: "À Propos", href: "#about" },
                  { name: "Contact", href: "#contact" }
                ].map((item) => (
                  <a 
                    key={item.name} 
                    href={item.href} 
                    className="block py-3 px-4 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-xl font-medium transition-all duration-200 hover:translate-x-2" 
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </a>
                ))}

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
                          className="w-full border-green-200 rounded-xl hover:bg-green-50 transition-all duration-200"
                        >
                          Panneau Admin
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => { onLogout(); setIsMenuOpen(false); }} 
                        className="w-full border-green-200 rounded-xl hover:bg-green-50 transition-all duration-200"
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
                        className="w-full border-2 border-green-200 rounded-xl hover:bg-green-50 transition-all duration-200"
                      >
                        Connexion
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => { onAuthModalOpen("register"); setIsMenuOpen(false); }} 
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-xl shadow-lg transition-all duration-200"
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

      {/* Categories Bar with Mega Menu */}
      <div 
        className={`bg-gradient-to-r from-green-700 via-green-600 to-green-700 shadow-lg transition-all duration-500 sticky z-40 ${
          scrolled 
            ? 'top-[80px] opacity-0 -translate-y-full pointer-events-none' 
            : 'top-[80px] opacity-100 translate-y-0'
        }`}
        style={{ backgroundSize: '200% 200%', animation: 'gradientShift 15s ease infinite' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          {/* Main Categories Bar */}
          <div className="flex items-center space-x-2 py-4">
            {/* All Categories Button */}
            <button
              onClick={() => handleCategoryClick('Tous')}
              className="group px-5 py-2.5 text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl transition-all duration-300 whitespace-nowrap font-semibold text-sm flex items-center space-x-2 border border-white/20 hover:border-white/40 hover:scale-105 shadow-lg hover:shadow-xl flex-shrink-0"
            >
              <div className="p-1.5 bg-white/20 rounded-lg group-hover:bg-white/30 transition-all duration-300 group-hover:rotate-12">
                <Package className="w-4 h-4" />
              </div>
              <span className="group-hover:translate-x-0.5 transition-transform duration-300">
                Toutes les catégories
              </span>
            </button>

            <div className="h-8 w-px bg-white/20 flex-shrink-0"></div>

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
              <ChevronLeft className="w-5 h-5" />
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
                        className="group relative px-5 py-2.5 text-white hover:bg-white/10 rounded-xl transition-all duration-300 whitespace-nowrap font-medium text-sm flex items-center space-x-2 hover:scale-105 hover:shadow-lg"
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
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Mega Menu Dropdown - Full Width with Gap for Smooth Hover */}
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

              <div className="max-w-7xl mx-auto px-8 py-8">
                {categories
                  .filter(cat => cat._id === hoveredCategory)
                  .map(category => {
                    const subcategories = category.subcategories || []
                    
                    if (subcategories.length === 0) {
                      return (
                        <div key={category._id} className="text-center py-8">
                          <p className="text-gray-500">Aucune sous-catégorie disponible</p>
                        </div>
                      )
                    }

                    return (
                      <div key={category._id}>
                        {/* Category Header */}
                        <div className="mb-6 pb-4 border-b-2 border-green-100">
                          <h3 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
                            <Tag className="w-6 h-6 text-green-600 mr-3" />
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
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
                              className="group p-4 rounded-xl border-2 border-gray-100 hover:border-green-300 hover:bg-gradient-to-br hover:from-green-50 hover:to-emerald-50 transition-all duration-300 text-left hover:shadow-lg hover:scale-105 cursor-pointer"
                              style={{
                                animation: `fadeInUp 0.3s ease-out ${idx * 0.05}s both`
                              }}
                            >
                              <div className="flex items-start space-x-3">
                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-green-200 group-hover:scale-110 transition-all duration-300">
                                  <ChevronRight className="w-5 h-5 text-green-600 group-hover:translate-x-1 transition-transform" />
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
                        <div className="mt-8 text-center">
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
                            className="inline-flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer"
                          >
                            <span>Voir tous les produits de {category.name}</span>
                            <ArrowRight className="w-5 h-5" />
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
          height: 6px;
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
      `}</style>
    </>
  )
}

export default Navbar