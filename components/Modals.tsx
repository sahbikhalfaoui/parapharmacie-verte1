"use client"
import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  ShieldIcon, XIcon, ShoppingCartIcon, MinusIcon, PlusIcon, 
  TrashIcon, LogOutIcon 
} from "./Icons"

// ==================== TYPES ====================
interface User {
  id?: string
  name: string
  email: string
  role?: string
  picture?: string
}

interface Product {
  _id: string
  name: string
  price: number
  image?: string
  categoryName?: string
  quantity: number
}

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  mode: "login" | "register"
  onSwitchMode: (mode: "login" | "register") => void
  onAuthSuccess: (user: User) => void
}

interface ProfileDropdownProps {
  user: User
  onLogout: () => void
  onAdminClick: () => void
}

interface CartSheetProps {
  isOpen: boolean
  onClose: () => void
  cartItems: Product[]
  updateQuantity: (id: string, quantity: number) => void
  removeFromCart: (id: string) => void
  clearCart: () => void
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void
          prompt: (momentListener?: (notification: any) => void) => void
          renderButton: (parent: HTMLElement, options: any) => void
          disableAutoSelect: () => void
          cancel: () => void
          revoke: (hint: string, callback: (response: any) => void) => void
        }
      }
    }
  }
}

// Helper function to get correct image URL
const getImageUrl = (imagePath?: string): string => {
  if (!imagePath) return "/placeholder.jpg"
  
  // If imagePath is already a full URL, return it
  if (imagePath.startsWith('http')) {
    return imagePath
  }
  
  // If imagePath starts with /uploads or similar, construct the full URL
  if (imagePath.startsWith('/')) {
    return `https://biopharma-backend.onrender.com${imagePath}`
  }
  
  // Default to placeholder
  return "/placeholder.jpg"
}

// ==================== AUTH MODAL ====================
export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, onClose, mode, onSwitchMode, onAuthSuccess 
}) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    phone: "",
    address: "",
    city: ""
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")

  const GOOGLE_CLIENT_ID = '775881234717-36l5t936hnf5pj8f7uhjg8hf17dm46h3.apps.googleusercontent.com'

  // Initialize Google Sign-In
  useEffect(() => {
    if (!isOpen) return

    const loadGoogleScript = () => {
      if (document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
        if (window.google) initializeGoogle()
        return
      }

      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = () => {
        console.log('✅ Google SDK loaded')
        initializeGoogle()
      }
      script.onerror = () => {
        console.error('❌ Failed to load Google SDK')
        setError("Impossible de charger Google Sign-In")
      }
      document.body.appendChild(script)
    }

    const initializeGoogle = () => {
      if (!window.google) return

      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        })

        const container = document.getElementById('google-signin-button')
        if (container) {
          container.innerHTML = ''
          window.google.accounts.id.renderButton(container, {
            theme: 'outline',
            size: 'large',
            text: mode === 'login' ? 'signin_with' : 'signup_with',
            width: 384,
            logo_alignment: 'left'
          })
        }
        console.log('✅ Google Sign-In initialized')
      } catch (err) {
        console.error('❌ Google initialization error:', err)
      }
    }

    loadGoogleScript()
  }, [isOpen, mode])

  const handleGoogleResponse = async (response: any) => {
    if (!response.credential) {
      setError("Authentification Google échouée")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const res = await fetch('https://biopharma-backend.onrender.com/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Authentification échouée')

      localStorage.setItem('authToken', data.token)
      localStorage.setItem('userData', JSON.stringify(data.user))
      onAuthSuccess(data.user)
   
      handleClose()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (mode === 'register' && formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      setIsLoading(false)
      return
    }

    try {
      const endpoint = `https://biopharma-backend.onrender.com/api/auth/${mode === 'login' ? 'login' : 'register'}`
      const payload = mode === 'login' 
        ? { email: formData.email, password: formData.password }
        : formData

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Authentication failed')

      localStorage.setItem('authToken', data.token)
      localStorage.setItem('userData', JSON.stringify(data.user))
      onAuthSuccess(data.user)
      alert(`${mode === 'login' ? 'Connexion' : 'Inscription'} réussie !`)
      handleClose()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleClose = () => {
    setFormData({
      email: "", password: "", confirmPassword: "",
      name: "", phone: "", address: "", city: ""
    })
    setError("")
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md relative max-h-[90vh] overflow-y-auto shadow-2xl">
        <button onClick={handleClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
          <XIcon className="h-5 w-5" />
        </button>
        
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            {mode === "login" ? "Bienvenue" : "Créer un Compte"}
          </h2>
          <p className="text-gray-600 mt-2 text-sm">
            {mode === "login" ? "Connectez-vous pour accéder à votre espace" : "Rejoignez-nous dès aujourd'hui"}
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Google Sign-In */}
        <div className="mb-6">
          <div id="google-signin-button" className="flex justify-center"></div>
        </div>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500">Ou avec email</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">Nom Complet *</Label>
                <Input 
                  id="name" 
                  name="name"
                  type="text" 
                  placeholder="Votre nom complet" 
                  value={formData.name} 
                  onChange={handleInputChange}
                  className="border-2 border-gray-200 focus:border-green-400"
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">Téléphone</Label>
                <Input 
                  id="phone" 
                  name="phone"
                  type="tel" 
                  placeholder="Numéro de téléphone" 
                  value={formData.phone} 
                  onChange={handleInputChange}
                  className="border-2 border-gray-200 focus:border-green-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-medium">Adresse</Label>
                <Input 
                  id="address" 
                  name="address"
                  type="text" 
                  placeholder="Votre adresse" 
                  value={formData.address} 
                  onChange={handleInputChange}
                  className="border-2 border-gray-200 focus:border-green-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city" className="text-sm font-medium">Ville</Label>
                <Input 
                  id="city" 
                  name="city"
                  type="text" 
                  placeholder="Votre ville" 
                  value={formData.city} 
                  onChange={handleInputChange}
                  className="border-2 border-gray-200 focus:border-green-400"
                />
              </div>
            </>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">Email *</Label>
            <Input 
              id="email" 
              name="email"
              type="email" 
              placeholder="votre@email.com" 
              value={formData.email} 
              onChange={handleInputChange}
              className="border-2 border-gray-200 focus:border-green-400"
              required 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">Mot de Passe *</Label>
            <div className="relative">
              <Input 
                id="password" 
                name="password"
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
                value={formData.password} 
                onChange={handleInputChange}
                className="pr-10 border-2 border-gray-200 focus:border-green-400"
                required 
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>
          
          {mode === "register" && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirmer le Mot de Passe *</Label>
              <Input 
                id="confirmPassword" 
                name="confirmPassword"
                type="password" 
                placeholder="••••••••" 
                value={formData.confirmPassword} 
                onChange={handleInputChange}
                className="border-2 border-gray-200 focus:border-green-400"
                required 
              />
            </div>
          )}
          
          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 h-11 font-semibold shadow-lg hover:shadow-xl transition-all" 
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Traitement...</span>
              </div>
            ) : mode === "login" ? "Se Connecter" : "Créer le Compte"}
          </Button>
          
          <div className="text-center pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              {mode === "login" ? "Pas de compte ?" : "Déjà un compte ?"}
              <button 
                type="button" 
                className="ml-1 text-green-600 hover:text-green-700 font-medium hover:underline" 
                onClick={() => onSwitchMode(mode === "login" ? "register" : "login")}
              >
                {mode === "login" ? "S'inscrire" : "Se connecter"}
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

// ==================== PROFILE DROPDOWN ====================
export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ user, onLogout, onAdminClick }) => {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as Element).closest('.profile-dropdown')) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="profile-dropdown relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-green-50 transition-colors"
      >
        {user.picture ? (
          <img 
            src={user.picture} 
            alt={user.name} 
            className="w-8 h-8 rounded-full border-2 border-green-200"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 flex items-center justify-center text-white font-medium">
            {user.name.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="hidden sm:inline text-sm font-medium text-gray-700">{user.name}</span>
        <svg 
          className={`h-4 w-4 transition-transform text-gray-500 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50">
            <div className="flex items-center space-x-3">
              {user.picture ? (
                <img 
                  src={user.picture} 
                  alt={user.name} 
                  className="w-12 h-12 rounded-full border-2 border-green-200"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 flex items-center justify-center text-white font-bold text-lg">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900 truncate">{user.name}</p>
                <p className="text-xs text-gray-600 truncate">{user.email}</p>
              </div>
            </div>
          </div>
          
          <div className="p-2">
            {user.role === 'admin' && (
              <button
                onClick={() => { setIsOpen(false); onAdminClick() }}
                className="w-full text-left px-3 py-2.5 text-sm rounded-lg hover:bg-green-50 transition-colors flex items-center space-x-3 text-gray-700 hover:text-green-600"
              >
                <ShieldIcon className="h-4 w-4" />
                <span className="font-medium">Panneau Admin</span>
              </button>
            )}
            
            <button
              onClick={() => { setIsOpen(false); onLogout() }}
              className="w-full text-left px-3 py-2.5 text-sm rounded-lg hover:bg-red-50 transition-colors flex items-center space-x-3 text-red-600 hover:text-red-700"
            >
              <LogOutIcon className="h-4 w-4" />
              <span className="font-medium">Déconnexion</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ==================== CART SHEET ====================
export const CartSheet: React.FC<CartSheetProps> = ({ 
  isOpen, onClose, cartItems, updateQuantity, removeFromCart, clearCart 
}) => {
  const [showCheckout, setShowCheckout] = useState(false)
  const [orderForm, setOrderForm] = useState({
    fullName: '', phone: '', email: '', address: '', city: '', notes: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = cartItems.reduce((sum, item) => sum + (parseFloat(item.price.toString()) * item.quantity), 0)
  const deliveryFee = totalPrice > 150 ? 0 : 15
  const finalTotal = totalPrice + deliveryFee

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOrderForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const token = localStorage.getItem('authToken')
      const orderData = {
        user: JSON.parse(localStorage.getItem('userData') || '{}')?.id || null,
        items: cartItems.map(item => ({
          product: item._id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        customerInfo: orderForm,
        totalPrice,
        deliveryFee,
        finalTotal,
        paymentMethod: 'COD'
      }

      const response = await fetch('https://biopharma-backend.onrender.com/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(orderData),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Order failed')

      
      clearCart()
      setShowCheckout(false)
      setOrderForm({ fullName: '', phone: '', email: '', address: '', city: '', notes: '' })
      onClose()
    } catch (err) {
      alert('Erreur lors de la commande: ' + (err as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetCheckout = () => {
    setShowCheckout(false)
    setOrderForm({ fullName: '', phone: '', email: '', address: '', city: '', notes: '' })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/80">
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white border-l overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                {showCheckout ? "Commande" : "Panier"}
              </h2>
              <p className="text-sm text-gray-600">
                {!showCheckout && totalItems === 0 ? "Votre panier est vide" : 
                 !showCheckout ? `${totalItems} article${totalItems !== 1 ? 's' : ''} dans votre panier` :
                 "Complétez vos informations de commande"}
              </p>
            </div>
            <button 
              onClick={showCheckout ? resetCheckout : onClose} 
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XIcon className="h-6 w-6" />
            </button>
          </div>

          {!showCheckout ? (
            <>
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <ShoppingCartIcon className="h-16 w-16 text-gray-300 mb-4" />
                  <p className="text-gray-600 mb-4">Votre panier est vide</p>
                  <Button onClick={onClose} className="bg-gradient-to-r from-green-600 to-emerald-600">
                    Continuer les Achats
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-4 mb-6">
                    {cartItems.map(item => (
                      <Card key={item._id} className="p-4 border-2 border-gray-100 hover:border-green-200 transition-colors">
                        <div className="flex items-center space-x-4">
                          <img 
                            src={getImageUrl(item.image)} 
                            alt={item.name} 
                            className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                            onError={(e) => {
                              e.currentTarget.src = "/placeholder.jpg"
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm truncate text-gray-900">{item.name}</h4>
                            <p className="text-sm text-gray-500">{item.categoryName || 'Produit'}</p>
                            <p className="text-lg font-bold text-green-600">{item.price} TND</p>
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            <button 
                              onClick={() => removeFromCart(item._id)} 
                              className="text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                            <div className="flex items-center border-2 border-gray-200 rounded-lg">
                              <button 
                                onClick={() => updateQuantity(item._id, Math.max(1, item.quantity - 1))} 
                                className="p-2 hover:bg-gray-100 transition-colors" 
                                disabled={item.quantity <= 1}
                              >
                                <MinusIcon className="h-3 w-3" />
                              </button>
                              <span className="px-3 py-1 text-sm font-semibold min-w-[2rem] text-center">{item.quantity}</span>
                              <button 
                                onClick={() => updateQuantity(item._id, item.quantity + 1)} 
                                className="p-2 hover:bg-gray-100 transition-colors"
                              >
                                <PlusIcon className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                  
                  <div className="border-t-2 border-gray-200 pt-4 space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-gray-700">
                        <span>Sous-total :</span>
                        <span className="font-semibold">{totalPrice.toFixed(3)} TND</span>
                      </div>
                      <div className="flex justify-between items-center text-gray-700">
                        <span>Frais de livraison :</span>
                        <span className="font-semibold">
                          {deliveryFee === 0 ? <span className="text-green-600">Gratuit</span> : `${deliveryFee.toFixed(3)} TND`}
                        </span>
                      </div>
                      {totalPrice < 150 && (
                        <p className="text-sm text-green-600 bg-green-50 p-2 rounded-lg">
                          Ajoutez {(150 - totalPrice).toFixed(3)} TND de plus pour la livraison gratuite !
                        </p>
                      )}
                      <div className="flex justify-between items-center text-lg font-bold border-t-2 pt-3 border-gray-200">
                        <span>Total :</span>
                        <span className="text-green-600">{finalTotal.toFixed(3)} TND</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Button 
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all" 
                        onClick={() => setShowCheckout(true)}
                      >
                        Procéder à la Commande
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full border-2 border-gray-200 hover:bg-gray-50" 
                        onClick={clearCart} 
                        disabled={cartItems.length === 0}
                      >
                        Vider le Panier
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Résumé de Commande</h3>
                <div className="space-y-3">
                  {cartItems.map(item => (
                    <div key={item._id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <img 
                        src={getImageUrl(item.image)} 
                        alt={item.name} 
                        className="w-12 h-12 object-cover rounded border border-gray-200"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.jpg"
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-600">Qté : {item.quantity}</p>
                      </div>
                      <p className="font-semibold text-sm text-green-600">{item.price} TND</p>
                    </div>
                  ))}
                </div>
                
                <div className="space-y-2 pt-4 border-t-2 border-gray-200">
                  <div className="flex justify-between text-gray-700">
                    <span>Sous-total :</span>
                    <span className="font-medium">{totalPrice.toFixed(3)} TND</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Livraison :</span>
                    <span className="font-medium">{deliveryFee === 0 ? 'Gratuit' : `${deliveryFee.toFixed(3)} TND`}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-2 border-t-2 border-gray-200">
                    <span>Total :</span>
                    <span className="text-green-600">{finalTotal.toFixed(3)} TND</span>
                  </div>
                </div>

                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                  <h4 className="font-semibold text-blue-800 mb-2 flex items-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>Mode de Paiement</span>
                  </h4>
                  <div className="flex items-center space-x-2 mt-3">
                    <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    <span className="text-blue-700 font-medium">Paiement à la Livraison</span>
                  </div>
                  <p className="text-sm text-blue-600 mt-2">
                    Payez lors de la réception de votre commande. Aucun paiement en ligne requis.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Informations de Livraison</h3>
                <form onSubmit={handleSubmitOrder} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">
                      Nom Complet *
                    </Label>
                    <Input 
                      id="fullName" 
                      name="fullName" 
                      type="text" 
                      placeholder="Nom complet du destinataire" 
                      value={orderForm.fullName} 
                      onChange={handleInputChange} 
                      className="border-2 border-gray-200 focus:border-green-400"
                      required 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                      Numéro de Téléphone *
                    </Label>
                    <Input 
                      id="phone" 
                      name="phone" 
                      type="tel" 
                      placeholder="Numéro de téléphone" 
                      value={orderForm.phone} 
                      onChange={handleInputChange} 
                      className="border-2 border-gray-200 focus:border-green-400"
                      required 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                      Adresse Email *
                    </Label>
                    <Input 
                      id="email" 
                      name="email" 
                      type="email" 
                      placeholder="Adresse email" 
                      value={orderForm.email} 
                      onChange={handleInputChange} 
                      className="border-2 border-gray-200 focus:border-green-400"
                      required 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-sm font-medium text-gray-700">
                      Adresse de Livraison *
                    </Label>
                    <Input 
                      id="address" 
                      name="address" 
                      type="text" 
                      placeholder="Adresse complète de livraison" 
                      value={orderForm.address} 
                      onChange={handleInputChange} 
                      className="border-2 border-gray-200 focus:border-green-400"
                      required 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-sm font-medium text-gray-700">
                      Ville *
                    </Label>
                    <Input 
                      id="city" 
                      name="city" 
                      type="text" 
                      placeholder="Ville" 
                      value={orderForm.city} 
                      onChange={handleInputChange} 
                      className="border-2 border-gray-200 focus:border-green-400"
                      required 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
                      Notes de Livraison (Optionnel)
                    </Label>
                    <Input 
                      id="notes" 
                      name="notes" 
                      type="text" 
                      placeholder="Instructions spéciales pour la livraison" 
                      value={orderForm.notes} 
                      onChange={handleInputChange} 
                      className="border-2 border-gray-200 focus:border-green-400"
                    />
                  </div>
                  
                  <div className="space-y-2 pt-4">
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 h-12 font-semibold shadow-lg hover:shadow-xl transition-all" 
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Traitement...</span>
                        </div>
                      ) : `Passer Commande - ${finalTotal.toFixed(3)} TND`}
                    </Button>
                    
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full border-2 border-gray-200 hover:bg-gray-50" 
                      onClick={resetCheckout} 
                      disabled={isSubmitting}
                    >
                      Retour au Panier
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}