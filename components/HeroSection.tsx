import React, { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Play, Pause } from "lucide-react"

const HeroSection: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const [progress, setProgress] = useState(0)
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const progressInterval = useRef<NodeJS.Timeout | null>(null)

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

          {/* Navigation Arrows */}
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

          {/* Play/Pause Button */}
          <button
            onClick={toggleAutoPlay}
            className="absolute top-4 right-4 bg-white/90 hover:bg-white text-green-700 rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110 backdrop-blur-sm z-10"
            aria-label={isAutoPlaying ? "Pause slideshow" : "Play slideshow"}
          >
            {isAutoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          {/* Enhanced Dot Indicators with Progress */}
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

          {/* Slide Counter */}
          <div className="absolute bottom-6 right-6 bg-black/50 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm font-medium z-10">
            {currentSlide + 1} / {banners.length}
          </div>
        </div>

        {/* Thumbnail Navigation */}
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
  )
}

export default HeroSection