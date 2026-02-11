"use client"
import React, { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Search, 
  X, 
  Command, 
  Clock, 
  TrendingUp, 
  Star, 
  ArrowRight,
  Sparkles,
  Package,
  Tag,
  History,
  ArrowUpRight,
  Loader2,
  Filter,
  SlidersHorizontal,
  Zap
} from "lucide-react"

interface SearchProduct {
  _id: string
  name: string
  price: string | number
  image?: string
  categoryName?: string
  subcategoryName?: string
  rating?: number
  badge?: string
  inStock?: boolean
}

interface Category {
  _id: string
  name: string
  description?: string
}

interface SearchCommandProps {
  onProductClick?: (product: SearchProduct) => void
  onCategorySelect?: (categoryName: string) => void
  onSearchSubmit?: (term: string) => void
  className?: string
  isMobile?: boolean
}

const RECENT_SEARCHES_KEY = 'biopharma_recent_searches'
const MAX_RECENT_SEARCHES = 5

export const SearchCommand: React.FC<SearchCommandProps> = ({
  onProductClick,
  onCategorySelect,
  onSearchSubmit,
  className = "",
  isMobile = false
}) => {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [results, setResults] = useState<{ products: SearchProduct[], categories: Category[] }>({ products: [], categories: [] })
  const [isLoading, setIsLoading] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [popularProducts, setPopularProducts] = useState<SearchProduct[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [activeFilter, setActiveFilter] = useState<'all' | 'products' | 'categories'>('all')
  
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(RECENT_SEARCHES_KEY)
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved))
      } catch (e) {
        console.error('Error loading recent searches:', e)
      }
    }
  }, [])

  // Load popular products on mount
  useEffect(() => {
    loadPopularProducts()
  }, [])

  // Keyboard shortcut: Ctrl+K or Cmd+K to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
        setTimeout(() => inputRef.current?.focus(), 100)
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
        setSearchTerm("")
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyNavigation = (e: KeyboardEvent) => {
      if (!isOpen) return

      const totalItems = getFilteredResults().products.length + getFilteredResults().categories.length

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % totalItems)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => (prev - 1 + totalItems) % totalItems)
      } else if (e.key === 'Enter' && selectedIndex >= 0) {
        e.preventDefault()
        handleSelection(selectedIndex)
      }
    }

    document.addEventListener('keydown', handleKeyNavigation)
    return () => document.removeEventListener('keydown', handleKeyNavigation)
  }, [isOpen, selectedIndex, results])

  // Debounced search
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchTerm.trim().length >= 2) {
        performSearch(searchTerm)
      } else {
        setResults({ products: [], categories: [] })
      }
    }, 300)

    return () => clearTimeout(delayDebounce)
  }, [searchTerm])

  const loadPopularProducts = async () => {
    try {
      const res = await fetch('https://biopharma-backend.onrender.com/api/products?limit=6&sortBy=rating&sortOrder=desc')
      if (res.ok) {
        const data = await res.json()
        const products = (data.products || []).slice(0, 6).map((p: any) => ({
          _id: p._id,
          name: p.name,
          price: p.price,
          image: p.image,
          categoryName: p.category?.name || 'Non catégorisé',
          subcategoryName: p.subcategory?.name,
          rating: p.averageRating || 0,
          badge: p.badge,
          inStock: p.inStock
        }))
        setPopularProducts(products)
      }
    } catch (error) {
      console.error('Error loading popular products:', error)
    }
  }

  const performSearch = async (query: string) => {
    setIsLoading(true)
    setSelectedIndex(-1)
    
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        fetch(`https://biopharma-backend.onrender.com/api/products?search=${encodeURIComponent(query)}&limit=10`),
        fetch('https://biopharma-backend.onrender.com/api/categories')
      ])

      if (productsRes.ok && categoriesRes.ok) {
        const productsData = await productsRes.json()
        const categoriesData = await categoriesRes.json()

        const products = (productsData.products || []).slice(0, 10).map((p: any) => ({
          _id: p._id,
          name: p.name,
          price: p.price,
          image: p.image,
          categoryName: p.category?.name || 'Non catégorisé',
          subcategoryName: p.subcategory?.name,
          rating: p.averageRating || 0,
          badge: p.badge,
          inStock: p.inStock
        }))

        const categories = (Array.isArray(categoriesData) ? categoriesData : [])
          .filter((c: any) => c.name.toLowerCase().includes(query.toLowerCase()))
          .slice(0, 5)

        setResults({ products, categories })
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const saveRecentSearch = (term: string) => {
    const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, MAX_RECENT_SEARCHES)
    setRecentSearches(updated)
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated))
  }

  const clearRecentSearches = () => {
    setRecentSearches([])
    localStorage.removeItem(RECENT_SEARCHES_KEY)
  }

  const handleProductSelect = (product: SearchProduct) => {
    saveRecentSearch(product.name)
    setIsOpen(false)
    setSearchTerm("")
    router.push(`/product/${product._id}`)
    onProductClick?.(product)
  }

  const handleCategorySelect = (category: Category) => {
    saveRecentSearch(category.name)
    setIsOpen(false)
    setSearchTerm("")
    onCategorySelect?.(category.name)
  }

  const handleRecentSearchClick = (term: string) => {
    setSearchTerm(term)
    performSearch(term)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      saveRecentSearch(searchTerm)
      onSearchSubmit?.(searchTerm)
      setIsOpen(false)
    }
  }

  const handleSelection = (index: number) => {
    const filtered = getFilteredResults()
    if (index < filtered.products.length) {
      handleProductSelect(filtered.products[index])
    } else {
      const categoryIndex = index - filtered.products.length
      handleCategorySelect(filtered.categories[categoryIndex])
    }
  }

  const getFilteredResults = useCallback(() => {
    if (activeFilter === 'products') {
      return { products: results.products, categories: [] }
    }
    if (activeFilter === 'categories') {
      return { products: [], categories: results.categories }
    }
    return results
  }, [results, activeFilter])

  const formatPrice = (price: string | number): string => {
    const num = typeof price === 'number' ? price : parseFloat(price)
    return isNaN(num) ? String(price) : num.toFixed(2)
  }

  const hasResults = searchTerm.length >= 2 && (results.products.length > 0 || results.categories.length > 0)
  const hasNoResults = searchTerm.length >= 2 && !isLoading && results.products.length === 0 && results.categories.length === 0
  const showInitialState = searchTerm.length < 2 && !isLoading

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Search Trigger */}
      <div 
        className="relative cursor-pointer group"
        onClick={() => {
          setIsOpen(true)
          setTimeout(() => inputRef.current?.focus(), 100)
        }}
      >
        <div className={`flex items-center ${isMobile ? 'w-full' : 'w-[280px] lg:w-[400px]'} h-11 px-4 border-2 border-green-100 bg-gray-50 hover:bg-white hover:border-green-300 rounded-xl transition-all duration-300 group-hover:shadow-lg`}>
          <Search className="w-4 h-4 text-gray-400 group-hover:text-green-600 mr-3 transition-colors" />
          <span className="flex-1 text-sm text-gray-400">Rechercher...</span>
          {!isMobile && (
            <div className="hidden sm:flex items-center gap-1 ml-2">
              <kbd className="px-1.5 py-0.5 text-[10px] font-medium text-gray-400 bg-gray-100 border border-gray-200 rounded">
                Ctrl
              </kbd>
              <kbd className="px-1.5 py-0.5 text-[10px] font-medium text-gray-400 bg-gray-100 border border-gray-200 rounded">
                K
              </kbd>
            </div>
          )}
        </div>
      </div>

      {/* Search Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200]"
              onClick={() => setIsOpen(false)}
            />

            {/* Search Panel */}
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={`fixed ${isMobile ? 'inset-x-3 top-4' : 'left-1/2 -translate-x-1/2 top-[10vh] w-full max-w-2xl'} z-[201]`}
            >
              <div className="bg-white rounded-2xl shadow-2xl border border-green-100 overflow-hidden">
                {/* Search Header */}
                <div className="bg-gradient-to-r from-green-600 via-emerald-500 to-green-600 p-4">
                  <form onSubmit={handleSearchSubmit}>
                    <div className="relative flex items-center">
                      <div className="absolute left-4 flex items-center justify-center">
                        {isLoading ? (
                          <Loader2 className="w-5 h-5 text-white animate-spin" />
                        ) : (
                          <Search className="w-5 h-5 text-white/80" />
                        )}
                      </div>
                      <Input
                        ref={inputRef}
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Rechercher produits, catégories..."
                        className="flex-1 pl-12 pr-12 h-12 text-base bg-white/10 border-0 text-white placeholder:text-white/60 focus:bg-white/20 focus:ring-2 focus:ring-white/30 rounded-xl transition-all"
                        autoComplete="off"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setIsOpen(false)
                          setSearchTerm("")
                        }}
                        className="absolute right-3 p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </form>

                  {/* Quick Filters */}
                  {searchTerm.length >= 2 && (
                    <div className="flex items-center gap-2 mt-3">
                      {(['all', 'products', 'categories'] as const).map((filter) => (
                        <button
                          key={filter}
                          onClick={() => setActiveFilter(filter)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
                            activeFilter === filter
                              ? 'bg-white text-green-700'
                              : 'bg-white/10 text-white/80 hover:bg-white/20'
                          }`}
                        >
                          {filter === 'all' ? 'Tout' : filter === 'products' ? 'Produits' : 'Catégories'}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Results Container */}
                <div 
                  ref={resultsRef}
                  className="max-h-[60vh] overflow-y-auto overscroll-contain"
                  style={{ scrollBehavior: 'smooth' }}
                >
                  {/* Initial State - Recent & Popular */}
                  {showInitialState && (
                    <div className="p-4 space-y-6">
                      {/* Recent Searches */}
                      {recentSearches.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                              <History className="w-4 h-4 text-green-600" />
                              <span>Recherches récentes</span>
                            </div>
                            <button
                              onClick={clearRecentSearches}
                              className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                            >
                              Effacer
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {recentSearches.map((term, i) => (
                              <button
                                key={i}
                                onClick={() => handleRecentSearchClick(term)}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 bg-gray-50 hover:bg-green-50 hover:text-green-700 rounded-full transition-all group"
                              >
                                <Clock className="w-3 h-3" />
                                <span>{term}</span>
                                <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 -ml-1 transition-opacity" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Popular Products */}
                      {popularProducts.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                            <TrendingUp className="w-4 h-4 text-green-600" />
                            <span>Produits populaires</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {popularProducts.slice(0, 4).map((product) => (
                              <motion.button
                                key={product._id}
                                onClick={() => handleProductSelect(product)}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="flex items-center gap-3 p-3 text-left rounded-xl border border-gray-100 hover:border-green-200 hover:bg-green-50/50 transition-all group"
                              >
                                <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                                  <img
                                    src={product.image || "/placeholder-product.jpg"}
                                    alt={product.name}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                    onError={(e) => { e.currentTarget.src = "/placeholder-product.jpg" }}
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate group-hover:text-green-700 transition-colors">
                                    {product.name}
                                  </p>
                                  <p className="text-xs text-gray-500">{product.categoryName}</p>
                                </div>
                                <span className="text-sm font-bold text-green-600">
                                  {formatPrice(product.price)} TND
                                </span>
                              </motion.button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Quick Tips */}
                      <div className="pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Astuce: Tapez au moins 2 caractères pour rechercher</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Search Results */}
                  {hasResults && (
                    <div className="p-4 space-y-4">
                      {/* Products Results */}
                      {getFilteredResults().products.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                            <Package className="w-4 h-4 text-green-600" />
                            <span>Produits</span>
                            <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                              {getFilteredResults().products.length}
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            {getFilteredResults().products.map((product, index) => (
                              <motion.button
                                key={product._id}
                                onClick={() => handleProductSelect(product)}
                                whileHover={{ x: 4 }}
                                className={`w-full flex items-center gap-4 p-3 text-left rounded-xl border transition-all group ${
                                  selectedIndex === index
                                    ? 'border-green-400 bg-green-50 shadow-md'
                                    : 'border-gray-100 hover:border-green-200 hover:bg-green-50/50'
                                }`}
                              >
                                <div className="relative w-14 h-14 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200 group-hover:border-green-300">
                                  {product.badge && (
                                    <Badge className="absolute top-0.5 left-0.5 z-10 text-[10px] px-1 py-0 bg-red-500 text-white">
                                      {product.badge}
                                    </Badge>
                                  )}
                                  <img
                                    src={product.image || "/placeholder-product.jpg"}
                                    alt={product.name}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                    onError={(e) => { e.currentTarget.src = "/placeholder-product.jpg" }}
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-gray-900 line-clamp-1 group-hover:text-green-700 transition-colors">
                                    {product.name}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-xs border-green-200 text-green-700">
                                      {product.categoryName}
                                    </Badge>
                                    {product.rating && product.rating > 0 && (
                                      <div className="flex items-center gap-0.5">
                                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                        <span className="text-xs text-gray-500">{product.rating.toFixed(1)}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                  <span className="text-base font-bold text-green-600">
                                    {formatPrice(product.price)} TND
                                  </span>
                                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-green-600 group-hover:translate-x-1 transition-all" />
                                </div>
                              </motion.button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Categories Results */}
                      {getFilteredResults().categories.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                            <Tag className="w-4 h-4 text-green-600" />
                            <span>Catégories</span>
                            <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                              {getFilteredResults().categories.length}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {getFilteredResults().categories.map((category, index) => (
                              <motion.button
                                key={category._id}
                                onClick={() => handleCategorySelect(category)}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
                                  selectedIndex === results.products.length + index
                                    ? 'border-green-400 bg-green-100 text-green-700'
                                    : 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                                }`}
                              >
                                <Tag className="w-3.5 h-3.5" />
                                <span className="text-sm font-medium">{category.name}</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </motion.button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* No Results State */}
                  {hasNoResults && (
                    <div className="p-8 text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Aucun résultat trouvé
                      </h3>
                      <p className="text-sm text-gray-500 mb-4">
                        Aucun produit ne correspond à "{searchTerm}"
                      </p>
                      <div className="flex flex-wrap justify-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSearchTerm("")}
                          className="rounded-full border-green-200 text-green-700 hover:bg-green-50"
                        >
                          Effacer la recherche
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Loading State */}
                  {isLoading && searchTerm.length >= 2 && (
                    <div className="p-8 text-center">
                      <Loader2 className="w-8 h-8 text-green-600 animate-spin mx-auto mb-4" />
                      <p className="text-sm text-gray-500">Recherche en cours...</p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-4 py-3 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <kbd className="px-1.5 py-0.5 text-[10px] font-medium bg-white border border-gray-200 rounded">↑↓</kbd>
                        <span>naviguer</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <kbd className="px-1.5 py-0.5 text-[10px] font-medium bg-white border border-gray-200 rounded">↵</kbd>
                        <span>sélectionner</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <kbd className="px-1.5 py-0.5 text-[10px] font-medium bg-white border border-gray-200 rounded">esc</kbd>
                        <span>fermer</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-green-600">
                      <Zap className="w-3 h-3" />
                      <span>BioPharma Search</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default SearchCommand
