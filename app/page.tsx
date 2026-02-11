"use client"
import React, { useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { AuthModal, CartSheet } from "@/components/Modals"
import { 
  Shield, 
  Truck, 
  Star, 
  Phone, 
  Mail, 
  MapPin, 
  CheckCircle, 
  Award,
  Heart,
  TrendingUp,
  Facebook,
  Instagram,
  Twitter,
  Linkedin
} from "lucide-react"
import HeroSection from "@/components/HeroSection"
import ProductsSection from "@/components/ProductsSection"
import Navbar from "@/components/Navbar"
import { ToastContainer } from "@/components/Toast"
import { ConfirmModal } from "@/components/ConfirmModal"

interface User {
  id?: string
  name: string
  email: string
  role?: string
  phone?: string
  address?: string
  city?: string
}

interface Product {
  _id: string
  name: string
  price: number
  image?: string
  categoryName?: string
  subcategoryName?: string
  quantity: number
  description?: string
  rating?: number
  reviews?: number
  inStock?: boolean
  badge?: string
  originalPrice?: number
  category?: { name: string }
  subcategory?: { name: string }
  brand?: string
  averageRating?: number
  totalReviews?: number
}

interface Category {
  _id: string
  name: string
  subcategories?: Subcategory[]
}

interface Subcategory {
  _id: string
  name: string
  categoryId: string
}

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

export default function VitaPharmWebsite() {
  const [showLoading, setShowLoading] = useState(true)
  const [authModal, setAuthModal] = useState({ isOpen: false, mode: "login" as "login" | "register" })
  const [activeCategory, setActiveCategory] = useState("Tous")
  const [activeSubcategory, setActiveSubcategory] = useState("Tous")
  const [cartItems, setCartItems] = useState<Product[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  
  const [products, setProducts] = useState<Product[]>([])
  const [allCategories, setAllCategories] = useState<Category[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [subcategories, setSubcategories] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000])
  const [sortBy, setSortBy] = useState("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(15)
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [availableBrands, setAvailableBrands] = useState<string[]>([])
  const [minRating, setMinRating] = useState(0)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [toasts, setToasts] = useState<any[]>([])
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    title: string
    message: string
    type?: "danger" | "success" | "warning" | "info"
    confirmText?: string
    cancelText?: string
    onConfirm?: () => void
    onCancel?: () => void
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "warning"
  })
  const [globalSearchTerm, setGlobalSearchTerm] = useState("")

  // Load cart and favorites from localStorage on component mount
  useEffect(() => {
    // Set loading timer - reduced for faster perceived performance
    const loadingTimer = setTimeout(() => {
      setShowLoading(false)
    }, 1500)

    const token = localStorage.getItem('authToken')
    const userData = localStorage.getItem('userData')
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData))
      } catch (e) {
        console.error('Error parsing user data:', e)
        localStorage.removeItem('userData')
      }
    }
    
    // Load cart from localStorage
    const savedCart = localStorage.getItem('cart')
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart)
        // Ensure each item has quantity property
        const cartWithQuantity = parsedCart.map((item: any) => ({
          ...item,
          quantity: item.quantity || 1
        }))
        setCartItems(cartWithQuantity)
      } catch (error) {
        console.error('Error parsing cart from localStorage:', error)
        setCartItems([])
      }
    }
    
    // Load favorites from localStorage
    const savedFavorites = localStorage.getItem('favorites')
    if (savedFavorites) {
      try {
        const parsedFavorites = JSON.parse(savedFavorites)
        setFavorites(new Set(parsedFavorites))
      } catch (error) {
        console.error('Error parsing favorites from localStorage:', error)
        setFavorites(new Set())
      }
    }
    
    loadData()

    return () => clearTimeout(loadingTimer)
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (cartItems.length > 0) {
      localStorage.setItem('cart', JSON.stringify(cartItems))
    } else {
      localStorage.removeItem('cart')
    }
  }, [cartItems])

  // Save favorites to localStorage whenever they change
  useEffect(() => {
    if (favorites.size > 0) {
      localStorage.setItem('favorites', JSON.stringify(Array.from(favorites)))
    } else {
      localStorage.removeItem('favorites')
    }
  }, [favorites])

  // Toast functionality
  const showToast = (message: string, type: "success" | "error" | "warning" | "info" = "info", duration: number = 4) => {
    const id = Date.now().toString()
    const newToast = { id, message, type, duration }
    setToasts(prev => [newToast, ...prev.slice(0, 4)])
    
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration * 1000)
    }
    
    return id
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const showConfirm = (
    title: string,
    message: string,
    type: "danger" | "success" | "warning" | "info" = "warning",
    confirmText: string = "Confirmer",
    cancelText: string = "Annuler"
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmModal({
        isOpen: true,
        title,
        message,
        type,
        confirmText,
        cancelText,
        onConfirm: () => {
          setConfirmModal(prev => ({ ...prev, isOpen: false }))
          resolve(true)
        },
        onCancel: () => {
          setConfirmModal(prev => ({ ...prev, isOpen: false }))
          resolve(false)
        }
      })
    })
  }

  const loadData = async () => {
    setIsLoading(true)
    try {
      const categoriesResponse = await fetch('https://biopharma-backend.onrender.com/api/categories')
      const categoriesData = await categoriesResponse.json()
      
      const subcategoriesResponse = await fetch('https://biopharma-backend.onrender.com/api/subcategories')
      const subcategoriesData = await subcategoriesResponse.json()
      
      const categoriesWithSubs = categoriesData.map((cat: any) => ({
        ...cat,
        subcategories: subcategoriesData.filter((sub: any) => 
          sub.category === cat._id || sub.category?._id === cat._id
        )
      }))
      
      setAllCategories(categoriesWithSubs)
      const categoryNames = categoriesWithSubs.map((cat: any) => cat.name) || []
      setCategories(['Tous', ...categoryNames])

      const productsResponse = await fetch('https://biopharma-backend.onrender.com/api/products')
      const productsData = await productsResponse.json()
      
      const transformedProducts = (productsData.products || []).map((product: any) => ({
        ...product,
        id: product._id,
        categoryName: product.category?.name || 'Non catégorisé',
        subcategoryName: product.subcategory?.name || 'Aucune',
        brand: product.brand || 'Marque générique',
        price: parseFloat(product.price.toString().replace(/[^\d.-]/g, '')) || 0,
        originalPrice: product.originalPrice ? parseFloat(product.originalPrice.toString().replace(/[^\d.-]/g, '')) : null,
        averageRating: product.averageRating || product.rating || 0,
        totalReviews: product.totalReviews || product.reviews || 0,
        quantity: 1
      }))
      
      setProducts(transformedProducts)
      
      const brands = [...new Set(transformedProducts.map((product: any) => product.brand))].sort()
      setAvailableBrands(brands)
      
      const maxPrice = Math.max(...transformedProducts.map((product: any) => product.price))
      setPriceRange([0, maxPrice])
      
    } catch (error) {
      console.error('Error loading data:', error)
      showToast("Erreur lors du chargement des données", "error")
      setProducts([])
      setCategories(['Tous'])
      setAllCategories([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (activeCategory === "Tous") {
      setSubcategories(['Tous'])
    } else {
      const selectedCategory = allCategories.find(cat => cat.name === activeCategory)
      if (selectedCategory && selectedCategory.subcategories) {
        const subCatNames = selectedCategory.subcategories.map(sub => sub.name)
        setSubcategories(['Tous', ...subCatNames])
      } else {
        setSubcategories(['Tous'])
      }
    }
    setCurrentPage(1)
  }, [activeCategory, allCategories])

  const handleCategoryAndSubcategoryChange = (category: string, subcategory: string = "Tous") => {
    setActiveCategory(category)
    setActiveSubcategory(subcategory)
    setCurrentPage(1)
  }

  const handleCategoryChange = (category: string) => {
    handleCategoryAndSubcategoryChange(category, "Tous")
  }

  const handleSubcategoryChange = (subcategory: string) => {
    setActiveSubcategory(subcategory)
    setCurrentPage(1)
  }

  const handleBrandToggle = (brand: string) => {
    setSelectedBrands(prev => 
      prev.includes(brand) 
        ? prev.filter(b => b !== brand)
        : [...prev, brand]
    )
    setCurrentPage(1)
  }

  const handleSortChange = (newSortBy: string) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(newSortBy)
      setSortOrder("asc")
    }
    setCurrentPage(1)
  }

  const clearFilters = () => {
    handleCategoryAndSubcategoryChange("Tous", "Tous")
    setPriceRange([0, Math.max(...products.map(p => p.price))])
    setMinRating(0)
    setSortBy("name")
    setSortOrder("asc")
    setCurrentPage(1)
    setGlobalSearchTerm("")
    showToast("Filtres réinitialisés", "success")
  }

  const handleAuthSuccess = (userData: User) => {
    setUser(userData)
    localStorage.setItem('userData', JSON.stringify(userData))
    setAuthModal({ isOpen: false, mode: "login" })
    showToast(`Bienvenue ${userData.name} !`, "success")
    
    if (userData.role === 'admin') {
      window.location.href = '/admin'
    }
  }
  
  const handleAdminRedirect = () => {
    const token = localStorage.getItem('authToken')
    if (token) {
      window.location.href = '/admin'
    } else {
      setAuthModal({ isOpen: true, mode: "login" })
      showToast("Veuillez vous connecter pour accéder au panneau admin", "warning")
    }
  }

  const handleProductClick = async (navbarProduct: NavbarProduct) => {
    console.log('Product clicked from navbar:', navbarProduct);
    
    // First, check if we have the product in our loaded products
    const foundProduct = products.find(p => p._id === navbarProduct._id);
    
    if (foundProduct) {
      console.log('Product found in products array:', foundProduct);
      setSelectedProduct(foundProduct);
      setIsProductModalOpen(true);
      return;
    }
    
    // If not found, fetch it from the API
    try {
      console.log('Fetching product details from API for ID:', navbarProduct._id);
      const response = await fetch(`https://biopharma-backend.onrender.com/api/products/${navbarProduct._id}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const productData = await response.json();
      console.log('API response:', productData);
      
      // Create a full Product object from the API response
      const fullProduct: Product = {
        _id: productData._id,
        name: productData.name,
        price: parseFloat(productData.price.toString().replace(/[^\d.-]/g, '')) || 0,
        image: productData.image || '/placeholder.jpg',
        categoryName: productData.category?.name || navbarProduct.categoryName || 'Non catégorisé',
        subcategoryName: productData.subcategory?.name || navbarProduct.subcategoryName || 'Aucune',
        quantity: 1,
        description: productData.description || '',
        averageRating: productData.averageRating || navbarProduct.rating || 0,
        totalReviews: productData.totalReviews || 0,
        inStock: productData.inStock !== false,
        badge: productData.badge || navbarProduct.badge,
        originalPrice: productData.originalPrice ? parseFloat(productData.originalPrice.toString().replace(/[^\d.-]/g, '')) : undefined,
        brand: productData.brand || 'Marque générique',
        category: productData.category || { name: navbarProduct.categoryName || 'Non catégorisé' },
        subcategory: productData.subcategory || { name: navbarProduct.subcategoryName || 'Aucune' },
        rating: productData.averageRating || navbarProduct.rating || 0,
        reviews: productData.totalReviews || 0
      };
      
      console.log('Created full product:', fullProduct);
      setSelectedProduct(fullProduct);
      setIsProductModalOpen(true);
      
    } catch (error) {
      console.error('Error fetching product details:', error);
      
      // If API fails, create a minimal product from navbar data
      const minimalProduct: Product = {
        _id: navbarProduct._id,
        name: navbarProduct.name,
        price: typeof navbarProduct.price === 'string' 
          ? parseFloat(navbarProduct.price.replace(/[^\d.-]/g, '')) || 0 
          : navbarProduct.price,
        image: navbarProduct.image || '/placeholder.jpg',
        categoryName: navbarProduct.categoryName || 'Non catégorisé',
        subcategoryName: navbarProduct.subcategoryName || 'Aucune',
        quantity: 1,
        description: `Produit ${navbarProduct.name}`,
        averageRating: navbarProduct.rating || 0,
        totalReviews: 0,
        inStock: true,
        badge: navbarProduct.badge,
        originalPrice: undefined,
        brand: 'Marque générique',
        category: { name: navbarProduct.categoryName || 'Non catégorisé' },
        subcategory: { name: navbarProduct.subcategoryName || 'Aucune' },
        rating: navbarProduct.rating || 0,
        reviews: 0
      };
      
      setSelectedProduct(minimalProduct);
      setIsProductModalOpen(true);
      showToast("Détails du produit chargés", "info");
    }
  };

  const addToCart = (product: Product) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item._id === product._id)
      let newItems
      
      if (existingItem) {
        newItems = prevItems.map(item =>
          item._id === product._id ? { 
            ...item, 
            quantity: item.quantity + 1 
          } : item
        )
      } else {
        newItems = [...prevItems, { 
          ...product, 
          quantity: 1,
          price: parseFloat(product.price.toString().replace(/[^\d.-]/g, '')) || 0
        }]
      }
      
      // Save to localStorage immediately
      localStorage.setItem('cart', JSON.stringify(newItems))
      return newItems
    })
    
    showToast(`${product.name} ajouté au panier`, "success")
  }

  const toggleFavorite = (productId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev)
      if (newFavorites.has(productId)) {
        newFavorites.delete(productId)
        showToast("Produit retiré des favoris", "info")
      } else {
        newFavorites.add(productId)
        showToast("Produit ajouté aux favoris", "success")
      }
      // Save to localStorage immediately
      localStorage.setItem('favorites', JSON.stringify(Array.from(newFavorites)))
      return newFavorites
    })
  }

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity === 0) {
      removeFromCart(id)
    } else {
      setCartItems(prevItems => {
        const newItems = prevItems.map(item => 
          item._id === id ? { ...item, quantity } : item
        )
        localStorage.setItem('cart', JSON.stringify(newItems))
        return newItems
      })
    }
  }

  const removeFromCart = async (id: string) => {
    const confirmed = await showConfirm(
      "Supprimer l'article",
      "Êtes-vous sûr de vouloir supprimer cet article de votre panier ?",
      "danger",
      "Supprimer",
      "Annuler"
    )
    
    if (confirmed) {
      setCartItems(prevItems => {
        const newItems = prevItems.filter(item => item._id !== id)
        if (newItems.length > 0) {
          localStorage.setItem('cart', JSON.stringify(newItems))
        } else {
          localStorage.removeItem('cart')
        }
        showToast("Article supprimé du panier", "success")
        return newItems
      })
    }
  }

  const clearCart = async () => {
    const confirmed = await showConfirm(
      "Vider le panier",
      "Êtes-vous sûr de vouloir vider complètement votre panier ?",
      "danger",
      "Vider le panier",
      "Annuler"
    )
    
    if (confirmed) {
      setCartItems([])
      localStorage.removeItem('cart')
      showToast("Panier vidé", "success")
    }
  }

  const logout = async () => {
    const confirmed = await showConfirm(
      "Déconnexion",
      "Êtes-vous sûr de vouloir vous déconnecter ?",
      "warning",
      "Déconnexion",
      "Annuler"
    )
    
    if (confirmed) {
      localStorage.removeItem('authToken')
      localStorage.removeItem('userData')
      setUser(null)
      showToast("Déconnexion réussie", "success")
    }
  }

  const handleGlobalSearch = (term: string) => {
    setGlobalSearchTerm(term)
    setActiveCategory("Tous")
    setActiveSubcategory("Tous")
    setCurrentPage(1)
    
    // Scroll to products section
    setTimeout(() => {
      const productsSection = document.getElementById('produits')
      if (productsSection) {
        productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 100)
  }

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  // Loading Screen Component
  if (showLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600">
        <div className="text-center">
          <div className="mb-8 relative">
            <div className="w-24 h-24 mx-auto bg-white rounded-full flex items-center justify-center shadow-2xl">
              <Heart className="w-12 h-12 text-green-600 animate-pulse" />
            </div>
            <div className="absolute inset-0 w-24 h-24 mx-auto border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          
          <h1 className="text-4xl font-bold text-white mb-4">BioPharma</h1>
          <p className="text-white/90 text-lg mb-8">Votre partenaire santé de confiance</p>
          
          <div className="flex items-center justify-center space-x-2">
            <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      
      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        type={confirmModal.type}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
        onConfirm={confirmModal.onConfirm || (() => {})}
        onCancel={confirmModal.onCancel || (() => {})}
      />
      
      <Navbar 
        user={user}
        cartCount={cartItems.length}
        onAuthModalOpen={(mode) => setAuthModal({ isOpen: true, mode })}
        onLogout={logout}
        onAdminRedirect={handleAdminRedirect}
        onCartOpen={() => setIsCartOpen(true)}
        categories={allCategories}
        onCategorySelect={(categoryName, subcategoryName) => {
          handleCategoryAndSubcategoryChange(categoryName, subcategoryName || 'Tous')
          
          setTimeout(() => {
            const productsSection = document.getElementById('produits')
            if (productsSection) {
              productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }
          }, 150)
        }}
        onProductClick={handleProductClick}
        onSearchChange={handleGlobalSearch}
      />
      
      <HeroSection 
        onAddToCart={addToCart}
        onProductClick={handleProductClick}
      />

      <ProductsSection 
        products={products}
        allCategories={allCategories}
        categories={categories}
        subcategories={subcategories}
        isLoading={isLoading}
        searchTerm={globalSearchTerm}
        activeCategory={activeCategory}
        activeSubcategory={activeSubcategory}
        priceRange={priceRange}
        sortBy={sortBy}
        sortOrder={sortOrder}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        minRating={minRating}
        onCategoryChange={handleCategoryChange}
        onSubcategoryChange={handleSubcategoryChange}
        onSortChange={handleSortChange}
        onClearFilters={clearFilters}
        onAddToCart={addToCart}
        onPriceRangeChange={setPriceRange}
        onMinRatingChange={setMinRating}
        onCurrentPageChange={setCurrentPage}
        onSearchChange={handleGlobalSearch}
        user={user}
        favorites={favorites}
        onToggleFavorite={toggleFavorite}
        selectedProduct={selectedProduct}
        isProductModalOpen={isProductModalOpen}
        setSelectedProduct={setSelectedProduct}
        setIsProductModalOpen={setIsProductModalOpen}
        showToast={showToast}
      />

      {/* About Section */}
      <section id="about" className="py-24 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-emerald-50/50"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-green-100 text-green-700 px-4 py-1">À Propos de Nous</Badge>
            <h2 className="text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-green-700 to-emerald-600 bg-clip-text text-transparent">
              Votre Partenaire Santé de Confiance
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Depuis plus de 20 ans, BioPharma s'engage à fournir des produits pharmaceutiques et de bien-être de la plus haute qualité pour améliorer votre santé au quotidien.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-16 max-w-4xl mx-auto">
            {[
              {
                icon: Shield,
                title: "Qualité Garantie",
                description: "Tous nos produits sont certifiés et conformes aux normes internationales les plus strictes",
                color: "from-blue-500 to-blue-600"
              },
              {
                icon: Award,
                title: "Excellence Reconnue",
                description: "Récompensés pour notre engagement envers la satisfaction client et l'innovation",
                color: "from-purple-500 to-purple-600"
              }
            ].map((feature, index) => {
              const Icon = feature.icon
              return (
                <Card key={index} className="group hover:shadow-2xl transition-all duration-300 border-2 border-green-100 hover:border-green-300 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <CardHeader className="relative">
                    <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-4 transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-green-600 transition-colors">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative">
                    <CardDescription className="text-gray-600 leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h3 className="text-3xl font-bold text-gray-900">Notre Mission</h3>
              <p className="text-gray-600 leading-relaxed">
                Chez BioPharma, nous croyons que chacun mérite un accès facile à des produits de santé de qualité. Notre mission est de rendre la santé et le bien-être accessibles à tous, en combinant expertise pharmaceutique, innovation technologique et service client exceptionnel.
              </p>
              <div className="space-y-4">
                {[
                  "Produits certifiés et contrôlés",
                  "Conseils personnalisés par des experts",
                  "Livraison rapide et sécurisée",
                  "Prix compétitifs garantis"
                ].map((item, index) => (
                  <div key={index} className="flex items-center space-x-3 group">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-600 transition-colors duration-200">
                      <CheckCircle className="w-4 h-4 text-green-600 group-hover:text-white transition-colors duration-200" />
                    </div>
                    <span className="text-gray-700 group-hover:text-green-600 transition-colors duration-200 font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-500 rounded-3xl transform rotate-3 opacity-20"></div>
             
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-green-50 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-green-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-400 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-emerald-100 text-emerald-700 px-4 py-1">
              Nos Avantages
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-green-700 to-emerald-600 bg-clip-text text-transparent">
              Pourquoi Choisir BioPharma ?
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Truck,
                title: "Livraison Rapide",
                description: "Livraison en 24-48h partout en Tunisie",
                gradient: "from-blue-500 to-cyan-500"
              },
              {
                icon: Shield,
                title: "Qualité Garantie",
                description: "Produits certifiés et conformes aux normes",
                gradient: "from-green-500 to-emerald-500"
              },
              {
                icon: TrendingUp,
                title: "Meilleurs Prix",
                description: "Prix compétitifs et promotions régulières",
                gradient: "from-purple-500 to-pink-500"
              }
            ].map((feature, index) => {
              const Icon = feature.icon
              return (
                <Card 
                  key={index} 
                  className="group relative overflow-hidden border-2 border-transparent hover:border-green-200 transition-all duration-300 hover:shadow-2xl bg-white/80 backdrop-blur-sm"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <CardContent className="p-8 relative">
                    <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-xl`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-green-600 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-50/30 to-emerald-50/30"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-green-100 text-green-700 px-4 py-1">Contactez-Nous</Badge>
            <h2 className="text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-green-700 to-emerald-600 bg-clip-text text-transparent">
              Nous Sommes à Votre Écoute
            </h2>
            <p className="text-lg text-gray-600">
              Une question ? Besoin de conseils ? Notre équipe est là pour vous aider
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Contact Info Cards */}
            <div className="space-y-6">
              {[
                {
                  icon: MapPin,
                  title: "Adresse",
                  content: "Rue El Moez, Grombalia, Tunisia, 8030",
                  gradient: "from-red-500 to-pink-500"
                },
                {
                  icon: Phone,
                  title: "Téléphone",
                  content: "26 744 525",
                  gradient: "from-green-500 to-emerald-500"
                },
                {
                  icon: Mail,
                  title: "Email",
                  content: "biopharma.tunisie@gmail.com",
                  gradient: "from-blue-500 to-cyan-500"
                }
              ].map((item, index) => {
                const Icon = item.icon
                return (
                  <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-2 border-green-100 hover:border-green-300 bg-gradient-to-br from-white to-green-50/30">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className={`w-14 h-14 bg-gradient-to-br ${item.gradient} rounded-xl flex items-center justify-center flex-shrink-0 transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg`}>
                          <Icon className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 mb-2 text-lg group-hover:text-green-600 transition-colors">{item.title}</h3>
                          <p className="text-gray-600 leading-relaxed">{item.content}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Google Map */}
            <div className="h-full min-h-[400px]">
              <Card className="h-full border-2 border-green-100 overflow-hidden shadow-xl">
                <CardContent className="p-0 h-full">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3195.4827829916147!2d10.517659315394!3d36.77777797994!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x12fd5bf511da75e3%3A0x4c67b209b1ad254e!2sParapharmacie%20Biopharma!5e0!3m2!1sen!2stn!4v1234567890123"
                    width="100%"
                    height="100%"
                    style={{ border: 0, minHeight: '400px' }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="BioPharma Location"
                  ></iframe>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-16">
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
              <div className="flex space-x-4">
                
              </div>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-6">Navigation</h3>
              <ul className="space-y-3">
                {["Accueil", "Produits", "À Propos", "Contact"].map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a href="#" className="text-gray-400 hover:text-green-400 transition-colors duration-200 flex items-center group">
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

      <AuthModal 
        isOpen={authModal.isOpen} 
        onClose={() => setAuthModal({ isOpen: false, mode: "login" })} 
        mode={authModal.mode} 
        onSwitchMode={(mode) => setAuthModal({ isOpen: true, mode })} 
        onAuthSuccess={handleAuthSuccess}
      />
      <CartSheet 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        cartItems={cartItems} 
        updateQuantity={updateQuantity} 
        removeFromCart={removeFromCart} 
        clearCart={clearCart}
      />

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="grid grid-cols-4 gap-1">
          <button
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            className="flex flex-col items-center justify-center py-2 px-1 hover:bg-green-50 transition-colors"
          >
            <div className="w-6 h-6 mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-700">
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
            </div>
            <span className="text-xs font-medium text-gray-700">Accueil</span>
          </button>

          <button
            onClick={() => {
              const productsSection = document.getElementById('produits')
              if (productsSection) {
                productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }
            }}
            className="flex flex-col items-center justify-center py-2 px-1 hover:bg-green-50 transition-colors"
          >
            <div className="w-6 h-6 mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-700">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <span className="text-xs font-medium text-gray-700">Produits</span>
          </button>

          <button
            onClick={() => setIsCartOpen(true)}
            className="flex flex-col items-center justify-center py-2 px-1 hover:bg-green-50 transition-colors relative"
          >
            <div className="w-6 h-6 mb-1 relative">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-700">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
              </svg>
              {cartItems.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  {cartItems.length}
                </span>
              )}
            </div>
            <span className="text-xs font-medium text-gray-700">Panier</span>
          </button>

          <button
            onClick={() => {
              if (user) {
                if (user.role === 'admin') {
                  handleAdminRedirect()
                }
              } else {
                setAuthModal({ isOpen: true, mode: 'login' })
              }
            }}
            className="flex flex-col items-center justify-center py-2 px-1 hover:bg-green-50 transition-colors"
          >
            <div className="w-6 h-6 mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-700">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <span className="text-xs font-medium text-gray-700">{user ? 'Compte' : 'Connexion'}</span>
          </button>
        </div>
      </div>

      {/* Spacer for mobile bottom nav */}
      <div className="lg:hidden h-16"></div>
    </div>
  )
}