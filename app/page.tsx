"use client"
import React, { useState, useEffect } from "react"
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
  Clock, 
  CheckCircle, 
  Users, 
  Award,
  Heart,
  Sparkles,
  TrendingUp,
  Facebook,
  Instagram,
  Twitter,
  Linkedin
} from "lucide-react"
import HeroSection from "@/components/HeroSection"
import ProductsSection from "@/components/ProductsSection"
import Navbar from "@/components/Navbar"

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

export default function VitaPharmWebsite() {
  const [authModal, setAuthModal] = useState({ isOpen: false, mode: "login" as "login" | "register" })
  const [activeCategory, setActiveCategory] = useState("Tous")
  const [activeSubcategory, setActiveSubcategory] = useState("Tous")
  const [cartItems, setCartItems] = useState<Product[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [newsletterEmail, setNewsletterEmail] = useState("")
  const [isNewsletterLoading, setIsNewsletterLoading] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  
  const [products, setProducts] = useState<Product[]>([])
  const [allCategories, setAllCategories] = useState<Category[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [subcategories, setSubcategories] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000])
  const [sortBy, setSortBy] = useState("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(12)
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [availableBrands, setAvailableBrands] = useState<string[]>([])
  const [minRating, setMinRating] = useState(0)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    const userData = localStorage.getItem('userData')
    
    if (token && userData) {
      setUser(JSON.parse(userData))
    }
    
    loadData()
  }, [])

  const loadData = async () => {
  setIsLoading(true)
  try {
    // Fetch categories
    const categoriesResponse = await fetch('http://localhost:5000/api/categories')
    const categoriesData = await categoriesResponse.json()
    
    // Fetch subcategories
    const subcategoriesResponse = await fetch('http://localhost:5000/api/subcategories')
    const subcategoriesData = await subcategoriesResponse.json()
    
    // Map subcategories to their categories
    const categoriesWithSubs = categoriesData.map((cat: any) => ({
      ...cat,
      subcategories: subcategoriesData.filter((sub: any) => 
        sub.category === cat._id || sub.category?._id === cat._id
      )
    }))
    
    setAllCategories(categoriesWithSubs)
    const categoryNames = categoriesWithSubs.map((cat: any) => cat.name) || []
    setCategories(['Tous', ...categoryNames])

    // ... rest of your products loading code
    const productsResponse = await fetch('http://localhost:5000/api/products')
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
      totalReviews: product.totalReviews || product.reviews || 0
    }))
    
    setProducts(transformedProducts)
    
    const brands = [...new Set(transformedProducts.map((product: any) => product.brand))].sort()
    setAvailableBrands(brands)
    
    const maxPrice = Math.max(...transformedProducts.map((product: any) => product.price))
    setPriceRange([0, maxPrice])
    
  } catch (error) {
    console.error('Error loading data:', error)
    setProducts([])
    setCategories(['Tous'])
    setAllCategories([])
  } finally {
    setIsLoading(false)
  }
}

  // FIXED: Remove the problematic useEffect that resets subcategory
  // This was causing the flickering issue
  // useEffect(() => {
  //   if (activeCategory === "Tous") {
  //     setSubcategories(['Tous'])
  //     setActiveSubcategory('Tous')
  //   } else {
  //     const selectedCategory = allCategories.find(cat => cat.name === activeCategory)
  //     if (selectedCategory && selectedCategory.subcategories) {
  //       const subCatNames = selectedCategory.subcategories.map(sub => sub.name)
  //       setSubcategories(['Tous', ...subCatNames])
  //       setActiveSubcategory('Tous') // THIS WAS THE PROBLEM - it always reset to "Tous"
  //     } else {
  //       setSubcategories(['Tous'])
  //       setActiveSubcategory('Tous')
  //     }
  //   }
  //   setCurrentPage(1)
  // }, [activeCategory, allCategories])

  // NEW: Update subcategories when category changes, but DON'T reset active subcategory
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

// Add this new function
const handleCategoryAndSubcategoryChange = (category: string, subcategory: string = "Tous") => {
  console.log('🔥 handleCategoryAndSubcategoryChange called:', { category, subcategory })
  setActiveCategory(category)
  setActiveSubcategory(subcategory)
  setCurrentPage(1)
}

const handleCategoryChange = (category: string) => {
  console.log('🔵 handleCategoryChange called:', category)
  // When changing category, reset subcategory to "Tous"
  handleCategoryAndSubcategoryChange(category, "Tous")
}

const handleSubcategoryChange = (subcategory: string) => {
  console.log('🟢 handleSubcategoryChange called:', subcategory, 'Current category:', activeCategory)
  // When changing subcategory, keep the current active category
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
  }

  const handleAuthSuccess = (userData: User) => {
    setUser(userData)
    localStorage.setItem('userData', JSON.stringify(userData))
    setAuthModal({ isOpen: false, mode: "login" })
    
    if (userData.role === 'admin') {
      window.location.href = '/admin'
    }
  }
  
  const handleAdminRedirect = () => {
    const token = localStorage.getItem('authToken')
    if (token) {
      window.location.href = '/admin'
    } else {
      alert('Veuillez vous reconnecter')
      setAuthModal({ isOpen: true, mode: "login" })
    }
  }

  const addToCart = (product: Product) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item._id === product._id)
      if (existingItem) {
        return prevItems.map(item =>
          item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
        )
      } else {
        return [...prevItems, { 
          ...product, 
          quantity: 1,
          price: parseFloat(product.price.toString().replace(/[^\d.-]/g, '')) || 0
        }]
      }
    })
  }

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity === 0) {
      removeFromCart(id)
    } else {
      setCartItems(prevItems => prevItems.map(item => item._id === id ? { ...item, quantity } : item))
    }
  }

  const removeFromCart = (id: string) => {
    setCartItems(prevItems => prevItems.filter(item => item._id !== id))
  }

  const clearCart = () => {
    setCartItems([])
  }

  const logout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('userData')
    setUser(null)
  }

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsNewsletterLoading(true)
    
    try {
      setTimeout(() => {
        alert("Merci de vous être abonné à notre newsletter !")
        setNewsletterEmail("")
        setIsNewsletterLoading(false)
      }, 1000)
    } catch (error) {
      alert("Erreur lors de l'abonnement")
      setIsNewsletterLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
<Navbar 
  user={user}
  cartCount={cartItems.length}
  onAuthModalOpen={(mode) => setAuthModal({ isOpen: true, mode })}
  onLogout={logout}
  onAdminRedirect={handleAdminRedirect}
  onCartOpen={() => setIsCartOpen(true)}
  categories={allCategories}
  onCategorySelect={(categoryName, subcategoryName) => {
    console.log('🚀 Navbar onCategorySelect:', { categoryName, subcategoryName })
    handleCategoryAndSubcategoryChange(categoryName, subcategoryName || 'Tous')
    
    setTimeout(() => {
      const productsSection = document.getElementById('produits')
      if (productsSection) {
        productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 150)
  }}
/>
      <HeroSection />

      <ProductsSection 
  products={products}
  allCategories={allCategories}
  categories={categories}
  subcategories={subcategories}
  isLoading={isLoading}
  searchTerm=""
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
  user={user}
/>

      {/* About Section - Enhanced */}
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

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {[
              {
                icon: Shield,
                title: "Qualité Garantie",
                description: "Tous nos produits sont certifiés et conformes aux normes internationales les plus strictes",
                color: "from-blue-500 to-blue-600"
              },
              {
                icon: Users,
                title: "Service Client Expert",
                description: "Une équipe de pharmaciens qualifiés à votre écoute 7j/7 pour vous conseiller",
                color: "from-green-500 to-emerald-600"
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
              <img 
                src="/api/placeholder/600/400" 
                alt="Notre équipe" 
                className="relative rounded-3xl shadow-2xl w-full h-auto transform hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Enhanced */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-green-50 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-green-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-400 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-emerald-100 text-emerald-700 px-4 py-1">
              <Sparkles className="w-4 h-4 inline mr-2" />
              Nos Avantages
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-green-700 to-emerald-600 bg-clip-text text-transparent">
              Pourquoi Choisir BioPharma ?
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Truck,
                title: "Livraison Rapide",
                description: "Livraison en 24-48h partout en Tunisie",
                gradient: "from-blue-500 to-cyan-500"
              },
              {
                icon: Shield,
                title: "Paiement Sécurisé",
                description: "Transactions 100% sécurisées et cryptées",
                gradient: "from-green-500 to-emerald-500"
              },
              {
                icon: TrendingUp,
                title: "Meilleurs Prix",
                description: "Prix compétitifs et promotions régulières",
                gradient: "from-purple-500 to-pink-500"
              },
              {
                icon: Star,
                title: "Service Premium",
                description: "Support client disponible 7j/7",
                gradient: "from-orange-500 to-red-500"
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

      {/* Contact Section - Enhanced */}
      <section id="contact" className="py-24 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-50/30 to-emerald-50/30"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-green-100 text-green-700 px-4 py-1">Contactez-Nous</Badge>
            <h2 className="text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-green-700 to-emerald-600 bg-clip-text text-transparent">
              Nous Sommes à Votre Écoute
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Une question ? Besoin de conseils ? Notre équipe d'experts est là pour vous aider
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <Card className="border-2 border-green-100 shadow-xl hover:shadow-2xl transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-2xl">Envoyez-nous un Message</CardTitle>
                <CardDescription>Nous vous répondrons dans les 24 heures</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
                      <Input placeholder="Votre nom" className="border-green-200 focus:border-green-400" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Prénom</label>
                      <Input placeholder="Votre prénom" className="border-green-200 focus:border-green-400" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <Input type="email" placeholder="votre@email.com" className="border-green-200 focus:border-green-400" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                    <Input placeholder="+216 XX XXX XXX" className="border-green-200 focus:border-green-400" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                    <textarea 
                      rows={5} 
                      placeholder="Votre message..." 
                      className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-200 transition-all"
                    ></textarea>
                  </div>
                  <Button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                    Envoyer le Message
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <div className="space-y-8">
              {[
                {
                  icon: MapPin,
                  title: "Adresse",
                  content: "123 Avenue Habib Bourguiba, Tunis, Tunisie",
                  gradient: "from-red-500 to-pink-500"
                },
                {
                  icon: Phone,
                  title: "Téléphone",
                  content: "+216 71 XXX XXX",
                  gradient: "from-green-500 to-emerald-500"
                },
                {
                  icon: Mail,
                  title: "Email",
                  content: "contact@biopharma.tn",
                  gradient: "from-blue-500 to-cyan-500"
                },
                {
                  icon: Clock,
                  title: "Horaires",
                  content: "Lun - Sam: 8h - 20h | Dim: 9h - 18h",
                  gradient: "from-purple-500 to-indigo-500"
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
          </div>
        </div>
      </section>

      {/* Newsletter Section - Enhanced */}
      <section className="py-20 bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl mb-6">
              <Mail className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">
              Restez Informé
            </h2>
            <p className="text-xl text-green-50">
              Inscrivez-vous à notre newsletter pour recevoir nos offres exclusives et conseils santé
            </p>
          </div>

          <form onSubmit={handleNewsletterSubmit} className="max-w-xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                type="email"
                placeholder="Votre adresse email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                className="flex-1 h-14 px-6 bg-white/95 backdrop-blur-sm border-2 border-white/50 focus:border-white rounded-xl text-gray-900 placeholder:text-gray-500"
                required
              />
              <Button 
                type="submit"
                disabled={isNewsletterLoading}
                className="h-14 px-8 bg-white text-green-600 hover:bg-green-50 font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                {isNewsletterLoading ? "Envoi..." : "S'abonner"}
              </Button>
            </div>
            <p className="text-green-50 text-sm mt-4 text-center">
              En vous inscrivant, vous acceptez de recevoir nos communications marketing
            </p>
          </form>
        </div>
      </section>

      {/* Footer - Enhanced */}
      <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
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
                {[Facebook, Instagram, Twitter, Linkedin].map((Icon, index) => (
                  <a 
                    key={index}
                    href="#" 
                    className="w-10 h-10 bg-gray-800 hover:bg-gradient-to-br hover:from-green-600 hover:to-emerald-600 rounded-lg flex items-center justify-center transition-all duration-300 transform hover:scale-110"
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </div>

            {[
              {
                title: "Navigation",
                links: ["Accueil", "Produits", "À Propos", "Contact"]
              },
              {
                title: "Informations",
                links: ["Conditions d'utilisation", "Politique de confidentialité", "Livraison", "Retours"]
              },
              {
                title: "Support",
                links: ["FAQ", "Service Client", "Suivi de commande", "Garanties"]
              }
            ].map((section, index) => (
              <div key={index}>
                <h3 className="font-bold text-lg mb-6">{section.title}</h3>
                <ul className="space-y-3">
                  {section.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <a href="#" className="text-gray-400 hover:text-green-400 transition-colors duration-200 flex items-center group">
                        <span className="w-0 h-0.5 bg-green-400 group-hover:w-4 mr-0 group-hover:mr-2 transition-all duration-200"></span>
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <p className="text-gray-400 text-sm">
                © 2024 BioPharma. Tous droits réservés.
              </p>
              <div className="flex items-center space-x-6 text-sm text-gray-400">
                <a href="#" className="hover:text-green-400 transition-colors">Mentions légales</a>
                <span>•</span>
                <a href="#" className="hover:text-green-400 transition-colors">CGV</a>
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
        user={user}
      />
    </div>
  )
}