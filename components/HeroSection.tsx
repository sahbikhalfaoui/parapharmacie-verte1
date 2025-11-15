import React, { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Play, Pause, ShoppingCart, Star, Sparkles } from "lucide-react"
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from "framer-motion"

interface Product {
  _id: string
  name: string
  price: number
  image?: string
  categoryName?: string
  subcategoryName?: string
  description?: string
  badge?: string
  originalPrice?: number
  averageRating?: number
  totalReviews?: number
  inStock?: boolean
}

interface HeroSectionProps {
  onAddToCart?: (product: Product) => void
}

const HeroSection: React.FC<HeroSectionProps> = ({ onAddToCart }) => {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const [progress, setProgress] = useState(0)
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)
  const [promotionalProducts, setPromotionalProducts] = useState<Product[]>([])
  const [promoCurrentIndex, setPromoCurrentIndex] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const promoScrollRef = useRef<HTMLDivElement>(null)
  const progressInterval = useRef<NodeJS.Timeout | null>(null)
  const promoSectionRef = useRef<HTMLDivElement>(null)

  // Parallax scroll effects
  const { scrollYProgress } = useScroll({
    target: promoSectionRef,
    offset: ["start end", "end start"]
  })

  const y1 = useTransform(scrollYProgress, [0, 1], [150, -150])
  const y2 = useTransform(scrollYProgress, [0, 1], [-150, 150])
  const y3 = useTransform(scrollYProgress, [0, 1], [100, -100])
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1, 0.8])
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0])
  
  const smoothY1 = useSpring(y1, { stiffness: 100, damping: 30 })
  const smoothY2 = useSpring(y2, { stiffness: 100, damping: 30 })
  const smoothY3 = useSpring(y3, { stiffness: 100, damping: 30 })

  const banners = [
    {
      image: "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=1200&h=500&fit=crop",
      title: "Promotions Exclusives",
      subtitle: "Jusqu'à -40% sur vos produits préférés",
      description: "Vitamines, compléments alimentaires et soins de beauté"
    },
    {
      image: "https://images.unsplash.com/photo-1576602976047-174e57a47881?w=1200&h=500&fit=crop",
      title: "Parapharmacie de Confiance",
      subtitle: "Large Gamme de Produits",
      description: "Médicaments, dermocosmétique et produits naturels certifiés"
    },
    {
      image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=1200&h=500&fit=crop",
      title: "Nouveautés & Best-Sellers",
      subtitle: "Découvrez nos Derniers Arrivages",
      description: "Soins visage, corps et compléments bien-être"
    },
    {
      image: "https://images.unsplash.com/photo-1512069511692-41e1e3a896b1?w=1200&h=500&fit=crop",
      title: "Conseil Pharmaceutique Expert",
      subtitle: "À Votre Service 7j/7",
      description: "Des professionnels pour vous accompagner dans vos choix santé"
    }
  ]

  useEffect(() => {
    loadPromotionalProducts()
  }, [])

  const loadPromotionalProducts = async () => {
    try {
      const response = await fetch('https://biopharma-backend.onrender.com/api/products?limit=20&sortBy=createdAt&sortOrder=desc')
      const data = await response.json()
      const products = (data.products || []).map((p: any) => ({
        _id: p._id,
        name: p.name,
        price: parseFloat(p.price.toString().replace(/[^\d.-]/g, '')) || 0,
        image: p.image,
        categoryName: p.category?.name || 'Non catégorisé',
        subcategoryName: p.subcategory?.name,
        description: p.description,
        badge: p.badge,
        originalPrice: p.originalPrice ? parseFloat(p.originalPrice.toString().replace(/[^\d.-]/g, '')) : null,
        averageRating: p.averageRating || 0,
        totalReviews: p.totalReviews || 0,
        inStock: p.inStock !== false
      }))
      // Filter only promotional products (with badge 'promo')
      const promoProducts = products.filter(p => p.badge?.toLowerCase() === 'promo')
      setPromotionalProducts(promoProducts)
    } catch (error) {
      console.error('Error loading promotional products:', error)
    }
  }

  const scrollPromoProducts = (direction: 'left' | 'right') => {
    if (promoScrollRef.current) {
      const scrollAmount = 320
      const newIndex = direction === 'left' 
        ? Math.max(0, promoCurrentIndex - 1)
        : Math.min(promotionalProducts.length - 1, promoCurrentIndex + 1)
      
      promoScrollRef.current.scrollTo({
        left: newIndex * scrollAmount,
        behavior: 'smooth'
      })
      setPromoCurrentIndex(newIndex)
    }
  }

  const scrollToSlide = (index: number) => {
    if (scrollRef.current) {
      const slideWidth = scrollRef.current.offsetWidth
      scrollRef.current.scrollTo({
        left: slideWidth * index,
        behavior: 'smooth'
      })
      setCurrentSlide(index)
      setProgress(0)
    }
  }

  const nextSlide = () => {
    const next = (currentSlide + 1) % banners.length
    scrollToSlide(next)
  }

  const prevSlide = () => {
    const prev = (currentSlide - 1 + banners.length) % banners.length
    scrollToSlide(prev)
  }

  const toggleAutoPlay = () => {
    setIsAutoPlaying(!isAutoPlaying)
    setProgress(0)
  }

  useEffect(() => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current)
    }

    if (isAutoPlaying) {
      progressInterval.current = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            nextSlide()
            return 0
          }
          return prev + 2
        })
      }, 100)
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current)
      }
    }
  }, [currentSlide, isAutoPlaying])

  const handleScroll = () => {
    if (scrollRef.current) {
      const slideWidth = scrollRef.current.offsetWidth
      const scrollPosition = scrollRef.current.scrollLeft
      const newIndex = Math.round(scrollPosition / slideWidth)
      if (newIndex !== currentSlide) {
        setCurrentSlide(newIndex)
        setProgress(0)
      }
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 75) {
      nextSlide()
    }
    if (touchStart - touchEnd < -75) {
      prevSlide()
    }
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') prevSlide()
    if (e.key === 'ArrowRight') nextSlide()
  }

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentSlide])

  return (
    <>
      {/* Hero Carousel Section */}
      <section 
        id="accueil" 
        className="relative w-full py-8 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white"
      >
        <div className="max-w-6xl mx-auto">
          <div
            className="relative h-[400px] sm:h-[450px] rounded-2xl overflow-hidden shadow-2xl group"
            onMouseEnter={() => setIsAutoPlaying(false)}
            onMouseLeave={() => setIsAutoPlaying(true)}
          >
            <div 
              ref={scrollRef}
              onScroll={handleScroll}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="flex h-full overflow-x-auto overflow-y-hidden snap-x snap-mandatory scroll-smooth scrollbar-hide"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {banners.map((banner, index) => (
                <div key={index} className="relative min-w-full h-full flex-shrink-0 snap-start">
                  <div className="absolute inset-0 overflow-hidden">
                    <img 
                      src={banner.image}
                      alt={banner.title}
                      className="w-full h-full object-cover transform transition-transform duration-[7000ms] hover:scale-110"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent"></div>
                  <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-12 lg:px-16">
                    <div className={`transform transition-all duration-700 ${currentSlide === index ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'}`}>
                      <Badge variant="secondary" className="bg-green-500 text-white border-0 px-4 py-2 w-fit mb-4 shadow-lg backdrop-blur-sm hover:bg-green-600 transition-colors">
                        {banner.subtitle}
                      </Badge>
                      <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white max-w-xl mb-3 leading-tight drop-shadow-2xl">
                        {banner.title}
                      </h1>
                      <p className="text-base sm:text-lg text-gray-200 max-w-lg mb-6 drop-shadow-lg">
                        {banner.description}
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button 
                          size="lg" 
                          className="bg-green-600 hover:bg-green-700 text-white shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 hover:-translate-y-0.5"
                          onClick={() => document.getElementById('produits')?.scrollIntoView({ behavior: 'smooth' })}
                        >
                          Acheter Maintenant
                        </Button>
                        <Button 
                          variant="outline" 
                          size="lg" 
                          className="border-2 border-white bg-white/10 backdrop-blur-sm text-white hover:bg-white hover:text-green-700 transition-all transform hover:scale-105"
                          onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
                        >
                          En Savoir Plus
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white text-green-700 rounded-full p-2.5 shadow-xl opacity-0 group-hover:opacity-100 transition-all hover:scale-110 backdrop-blur-sm z-10"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white text-green-700 rounded-full p-2.5 shadow-xl opacity-0 group-hover:opacity-100 transition-all hover:scale-110 backdrop-blur-sm z-10"
              aria-label="Next slide"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <button
              onClick={toggleAutoPlay}
              className="absolute top-4 right-4 bg-white/90 hover:bg-white text-green-700 rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110 backdrop-blur-sm z-10"
              aria-label={isAutoPlaying ? "Pause slideshow" : "Play slideshow"}
            >
              {isAutoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              {banners.map((_, index) => (
                <button
                  key={index}
                  onClick={() => scrollToSlide(index)}
                  className="relative group/dot"
                  aria-label={`Go to slide ${index + 1}`}
                >
                  <div className={`transition-all rounded-full ${
                    currentSlide === index 
                      ? 'bg-white w-10 h-3' 
                      : 'bg-white/60 hover:bg-white/80 w-3 h-3'
                  }`}>
                    {currentSlide === index && (
                      <div 
                        className="absolute top-0 left-0 h-full bg-green-500 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="absolute bottom-6 right-6 bg-black/50 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm font-medium z-10">
              {currentSlide + 1} / {banners.length}
            </div>
          </div>

          <div className="flex gap-3 mt-6 justify-center">
            {banners.map((banner, index) => (
              <button
                key={index}
                onClick={() => scrollToSlide(index)}
                className={`relative w-20 h-14 rounded-lg overflow-hidden transition-all transform hover:scale-105 ${
                  currentSlide === index 
                    ? 'ring-4 ring-green-500 scale-105' 
                    : 'ring-2 ring-gray-300 opacity-60 hover:opacity-100'
                }`}
              >
                <img 
                  src={banner.image} 
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                {currentSlide === index && (
                  <div className="absolute inset-0 bg-green-500/20"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        <style jsx>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      </section>

      {/* Promotional Products Section with Parallax - Only Promotions */}
      <section 
        ref={promoSectionRef}
        className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden"
      >
        {/* Animated Background with Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50"></div>
        
        {/* Parallax Background Layers */}
        <motion.div 
          style={{ y: smoothY1, opacity }}
          className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-green-300/40 to-emerald-300/40 rounded-full blur-3xl"
        />
        <motion.div 
          style={{ y: smoothY2, opacity }}
          className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-300/40 to-teal-300/40 rounded-full blur-3xl"
        />
        <motion.div 
          style={{ y: smoothY3, scale }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-teal-200/30 to-green-200/30 rounded-full blur-3xl"
        />

        {/* Floating Particles */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-green-400/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, Math.random() * 20 - 10, 0],
              opacity: [0.3, 0.7, 0.3],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Header with Animation */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              whileInView={{ scale: 1, rotate: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Badge className="mb-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 text-base shadow-xl">
                <Sparkles className="w-5 h-5 inline mr-2" />
                Produits en Vedette
              </Badge>
            </motion.div>
            
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-green-700 via-emerald-600 to-teal-600 bg-clip-text text-transparent"
            >
              Découvrez Nos Offres Spéciales
            </motion.h2>
            
            <motion.p 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-gray-600 max-w-2xl mx-auto text-lg"
            >
              Profitez de nos promotions exclusives et découvrez nos derniers arrivages
            </motion.p>
          </motion.div>

          {/* Products Carousel - Only Promotions */}
          <AnimatePresence mode="wait">
            {promotionalProducts.length > 0 ? (
              <motion.div 
                key="promo-carousel"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.5 }}
                className="relative"
              >
                <motion.button
                  whileHover={{ scale: 1.1, x: -5 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => scrollPromoProducts('left')}
                  disabled={promoCurrentIndex === 0}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white/95 hover:bg-white text-green-700 rounded-full p-4 shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all backdrop-blur-sm"
                  aria-label="Previous products"
                >
                  <ChevronLeft className="w-6 h-6" />
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.1, x: 5 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => scrollPromoProducts('right')}
                  disabled={promoCurrentIndex >= promotionalProducts.length - 4}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white/95 hover:bg-white text-green-700 rounded-full p-4 shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all backdrop-blur-sm"
                  aria-label="Next products"
                >
                  <ChevronRight className="w-6 h-6" />
                </motion.button>

                <div 
                  ref={promoScrollRef}
                  className="flex gap-6 overflow-x-auto scroll-smooth scrollbar-hide px-12"
                  style={{ scrollSnapType: 'x mandatory' }}
                >
                  {promotionalProducts.map((product, index) => (
                    <motion.div
                      key={product._id}
                      initial={{ opacity: 0, scale: 0.8, y: 50 }}
                      whileInView={{ opacity: 1, scale: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.3 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      whileHover={{ y: -10, scale: 1.02 }}
                      className="flex-shrink-0 w-[300px] bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group"
                      style={{ scrollSnapAlign: 'start' }}
                    >
                      <div className="relative h-64 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                        {/* Promo Badge */}
                        <motion.div
                          initial={{ x: -100, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ duration: 0.5, delay: 0.2 }}
                        >
                          <Badge className="absolute top-4 left-4 z-10 bg-red-500 text-white shadow-lg px-3 py-1 text-sm font-bold">
                            PROMO
                          </Badge>
                        </motion.div>
                        
                        {/* Discount Percentage */}
                        {product.originalPrice && (
                          <motion.div
                            initial={{ x: 100, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                          >
                            <Badge className="absolute top-4 right-4 z-10 bg-orange-500 text-white shadow-lg px-3 py-1 text-sm font-bold">
                              -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                            </Badge>
                          </motion.div>
                        )}
                        
                        <motion.img
                          whileHover={{ scale: 1.15 }}
                          transition={{ duration: 0.6 }}
                          src={product.image || "/placeholder.jpg"}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder.jpg"
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>

                      <div className="p-6">
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: 0.3 }}
                        >
                          <Badge variant="secondary" className="mb-3 bg-green-100 text-green-800 text-xs font-semibold">
                            {product.categoryName}
                          </Badge>
                        </motion.div>
                        
                        <motion.h3 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3, delay: 0.4 }}
                          className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-green-600 transition-colors"
                        >
                          {product.name}
                        </motion.h3>
                        
                        <motion.p 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3, delay: 0.5 }}
                          className="text-sm text-gray-600 mb-3 line-clamp-2"
                        >
                          {product.description}
                        </motion.p>

                        {product.averageRating > 0 && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3, delay: 0.6 }}
                            className="flex items-center space-x-1 mb-4"
                          >
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <motion.div
                                  key={i}
                                  initial={{ opacity: 0, rotate: -180 }}
                                  animate={{ opacity: 1, rotate: 0 }}
                                  transition={{ duration: 0.3, delay: 0.7 + i * 0.05 }}
                                >
                                  <Star
                                    className={`w-4 h-4 ${
                                      i < Math.floor(product.averageRating)
                                        ? 'text-yellow-400 fill-yellow-400'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                </motion.div>
                              ))}
                            </div>
                            <span className="text-sm text-gray-600 font-medium">
                              {product.averageRating.toFixed(1)} ({product.totalReviews})
                            </span>
                          </motion.div>
                        )}

                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: 0.8 }}
                          className="flex items-center justify-between"
                        >
                          <div>
                            <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                              {product.price.toFixed(2)} TND
                            </div>
                            {product.originalPrice && (
                              <span className="text-sm text-gray-400 line-through">
                                {product.originalPrice.toFixed(2)} TND
                              </span>
                            )}
                          </div>
                          
                          <motion.div
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Button
                              onClick={() => onAddToCart && onAddToCart(product)}
                              disabled={!product.inStock}
                              size="sm"
                              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all"
                            >
                              <ShoppingCart className="w-4 h-4" />
                            </Button>
                          </motion.div>
                        </motion.div>

                        {!product.inStock && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3 }}
                          >
                            <Badge className="mt-3 w-full justify-center bg-red-100 text-red-800 py-2">
                              Rupture de stock
                            </Badge>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Progress Indicators */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  className="flex justify-center mt-8 gap-2"
                >
                  {Array.from({ length: Math.ceil(promotionalProducts.length / 4) }).map((_, index) => (
                    <motion.button
                      key={index}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        setPromoCurrentIndex(index * 4)
                        if (promoScrollRef.current) {
                          promoScrollRef.current.scrollTo({
                            left: index * 4 * 320,
                            behavior: 'smooth'
                          })
                        }
                      }}
                      className={`h-3 rounded-full transition-all duration-300 ${
                        Math.floor(promoCurrentIndex / 4) === index
                          ? 'w-12 bg-gradient-to-r from-green-600 to-emerald-600'
                          : 'w-3 bg-gray-300 hover:bg-gray-400'
                      }`}
                      aria-label={`Go to slide group ${index + 1}`}
                    />
                  ))}
                </motion.div>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="text-center py-16 bg-white rounded-3xl shadow-xl"
              >
                <motion.div
                  animate={{ 
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 1
                  }}
                  className="text-6xl mb-4"
                >
                  📦
                </motion.div>
                <p className="text-gray-500 text-xl font-medium">
                  Aucune promotion disponible pour le moment
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Call to Action */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center mt-12"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={() => {
                  const productsSection = document.getElementById('produits')
                  if (productsSection) {
                    productsSection.scrollIntoView({ behavior: 'smooth' })
                  }
                }}
                size="lg"
                className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 hover:from-green-700 hover:via-emerald-700 hover:to-teal-700 text-white px-12 py-6 text-lg font-bold shadow-2xl hover:shadow-3xl transition-all rounded-2xl"
              >
                <motion.span
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="flex items-center"
                >
                  Voir Tous les Produits
                  <ChevronRight className="w-6 h-6 ml-2" />
                </motion.span>
              </Button>
            </motion.div>
          </motion.div>
        </div>

        {/* Decorative Elements */}
        <motion.div
          animate={{ 
            rotate: 360,
            scale: [1, 1.2, 1]
          }}
          transition={{ 
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-10 right-10 w-32 h-32 border-4 border-green-200/30 rounded-full"
        />
        <motion.div
          animate={{ 
            rotate: -360,
            scale: [1, 1.3, 1]
          }}
          transition={{ 
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute bottom-20 left-10 w-40 h-40 border-4 border-emerald-200/30 rounded-full"
        />
      </section>
    </>
  )
}

export default HeroSection