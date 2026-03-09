"use client"
import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart
} from 'recharts'
import { 
  DashboardIcon, 
  PackageIcon, 
  FolderIcon, 
  ShoppingCartIcon, 
  UsersIcon, 
  PlusIcon, 
  EditIcon, 
  TrashIcon, 
  EyeIcon, 
  LogOutIcon,
  ImageIcon
} from "./components/icons"
import { AuthCheck } from "./components/auth-check"
import { ConfirmModal } from "./components/confirm-modal"
import { ProductModal } from "./components/product-modal"
import { CategoryModal } from "./components/category-modal"
import { apiRequest, getAuthToken } from "./lib/api"
import { 
  User, 
  Product, 
  Category, 
  SubCategory, 
  Order, 
  Stats, 
  ModalState, 
  ConfirmModalState 
} from "./types"
import { formatDate, getStatusBadge } from "./utils/helpers"

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [subCategories, setSubCategories] = useState<SubCategory[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalCategories: 0
  })
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  const [productModal, setProductModal] = useState<ModalState>({ isOpen: false, product: null })
  const [categoryModal, setCategoryModal] = useState<ModalState>({ isOpen: false, category: null, type: 'category' })
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({ 
    isOpen: false, 
    title: '', 
    message: '', 
    onConfirm: null 
  })

  useEffect(() => {
    checkAuthentication()
  }, [])

  const checkAuthentication = () => {
    const token = getAuthToken()
    const userData = localStorage.getItem('userData')
    
    if (token && userData) {
      try {
        const user = JSON.parse(userData)
        if (user.role === 'admin') {
          setIsAuthenticated(true)
          setCurrentUser(user)
          loadDashboardData()
          return
        }
      } catch (error) {
        console.error('Error parsing user data:', error)
      }
    }
    
    // Clear all tokens and set loading to false
    localStorage.removeItem('adminToken')
    localStorage.removeItem('authToken')
    localStorage.removeItem('userData')
    sessionStorage.removeItem('adminToken')
    sessionStorage.removeItem('authToken')
    setIsAuthenticated(false)
    setIsLoading(false)
  }

  const handleAuthenticated = (user: User) => {
    setIsAuthenticated(true)
    setCurrentUser(user)
    setIsLoading(true)
    loadDashboardData()
  }

  const loadDashboardData = async () => {
    setIsLoading(true)
    try {
      // Load data in parallel with proper error handling
      const results = await Promise.allSettled([
        loadStats(),
        loadCategories(),
        loadSubCategories(),
        loadProducts(),
        loadOrders(),
        loadUsers()
      ])
      
      // Log any failed requests
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const names = ['stats', 'categories', 'subCategories', 'products', 'orders', 'users']
          console.error(`Failed to load ${names[index]}:`, result.reason)
        }
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await apiRequest<Stats>('/admin/stats')
      setStats(response || {
        totalUsers: 0,
        totalOrders: 0,
        totalProducts: 0,
        totalCategories: 0
      })
    } catch (error) {
      console.error('Error loading stats:', error)
      // Set fallback stats based on current data
      setStats({
        totalUsers: users.length,
        totalOrders: orders.length,
        totalProducts: products.length,
        totalCategories: categories.length
      })
    }
  }

  const loadCategories = async () => {
    try {
      const response = await apiRequest<Category[]>('/categories')
      console.log('Categories loaded:', response)
      setCategories(Array.isArray(response) ? response : [])
    } catch (error) {
      console.error('Error loading categories:', error)
      setCategories([])
    }
  }

  const loadSubCategories = async () => {
    try {
      const response = await apiRequest<SubCategory[]>('/subcategories')
      console.log('SubCategories loaded:', response)
      setSubCategories(Array.isArray(response) ? response : [])
    } catch (error) {
      console.error('Error loading subcategories:', error)
      setSubCategories([])
    }
  }

  const loadProducts = async () => {
    try {
      const response = await apiRequest<{ products: Product[] } | Product[]>('/products?limit=100')
      console.log('Products loaded:', response)
      
      // Handle both response formats
      const productsList = Array.isArray(response) ? response : response?.products || []
      setProducts(productsList)
    } catch (error) {
      console.error('Error loading products:', error)
      setProducts([])
    }
  }

  const loadOrders = async () => {
    try {
      const response = await apiRequest<{ orders: Order[] } | Order[]>('/admin/orders?limit=100')
      console.log('Orders loaded:', response)
      
      // Handle both response formats
      const ordersList = Array.isArray(response) ? response : response?.orders || []
      setOrders(ordersList)
    } catch (error) {
      console.error('Error loading orders:', error)
      setOrders([])
    }
  }

  const loadUsers = async () => {
    try {
      const response = await apiRequest<{ users: User[] } | User[]>('/admin/users?limit=100')
      console.log('Users loaded:', response)
      
      // Handle both response formats
      const usersList = Array.isArray(response) ? response : response?.users || []
      setUsers(usersList)
    } catch (error) {
      console.error('Error loading users:', error)
      setUsers([])
    }
  }

  const handleSaveProduct = async () => {
    await loadProducts()
    await loadStats() // Update stats after adding/editing product
    setProductModal({ isOpen: false, product: null })
  }

  const handleSaveCategory = async () => {
    await loadCategories()
    await loadSubCategories()
    await loadStats() // Update stats after adding/editing category
    setCategoryModal({ isOpen: false, category: null, type: 'category' })
  }

  const handleDeleteProduct = async (id: string) => {
    try {
      await apiRequest(`/products/${id}`, { method: 'DELETE' })
      await loadProducts()
      await loadStats()
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Erreur lors de la suppression du produit: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  const handleDeleteCategory = async (id: string, type: 'category' | 'subcategory' = 'category') => {
    try {
      const endpoint = type === 'category' ? `/categories/${id}` : `/subcategories/${id}`
      await apiRequest(endpoint, { method: 'DELETE' })
      await loadCategories()
      await loadSubCategories()
      await loadStats()
    } catch (error) {
      console.error('Error deleting category:', error)
      alert('Erreur lors de la suppression: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    try {
      await apiRequest(`/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      })
      await loadOrders()
    } catch (error) {
      console.error('Error updating order status:', error)
      alert('Erreur lors de la mise à jour du statut: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('authToken')
    localStorage.removeItem('userData')
    sessionStorage.removeItem('adminToken')
    sessionStorage.removeItem('authToken')
    setIsAuthenticated(false)
    setCurrentUser(null)
    setIsLoading(false)
  }

  const getCategoryName = (categoryId: string | Category | undefined): string => {
    if (!categoryId) return 'Non définie'
    if (typeof categoryId === 'object') return categoryId.name || 'Non définie'
    const category = categories.find(c => c._id === categoryId)
    return category ? category.name : 'Non définie'
  }

  const getSubCategoryName = (subCategoryId: string | SubCategory | undefined): string => {
    if (!subCategoryId) return ''
    if (typeof subCategoryId === 'object') return subCategoryId.name || ''
    const subCategory = subCategories.find(s => s._id === subCategoryId)
    return subCategory ? subCategory.name : ''
  }

  // Show loading screen initially
  if (isLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Chargement...</span>
      </div>
    )
  }

  // Show authentication form if not authenticated
  if (!isAuthenticated) {
    return <AuthCheck onAuthenticated={handleAuthenticated} />
  }

  const renderDashboard = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Tableau de Bord</h2>
      
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Utilisateurs</p>
                <p className="text-2xl font-bold">{stats.totalUsers || users.length || 0}</p>
              </div>
              <UsersIcon className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Commandes</p>
                <p className="text-2xl font-bold">{stats.totalOrders || orders.length || 0}</p>
              </div>
              <ShoppingCartIcon className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Produits</p>
                <p className="text-2xl font-bold">{stats.totalProducts || products.length || 0}</p>
              </div>
              <PackageIcon className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Catégories</p>
                <p className="text-2xl font-bold">{stats.totalCategories || categories.length || 0}</p>
              </div>
              <FolderIcon className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Section */}
      {stats.analytics && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-blue-200 bg-blue-50/50">
              <CardContent className="p-6">
                <p className="text-sm font-medium text-blue-600">Pages Vues Aujourd'hui</p>
                <p className="text-3xl font-bold text-blue-700">{stats.analytics.pageViews.today}</p>
                <p className="text-xs text-muted-foreground mt-1">Semaine: {stats.analytics.pageViews.week} · Mois: {stats.analytics.pageViews.month}</p>
              </CardContent>
            </Card>
            <Card className="border-green-200 bg-green-50/50">
              <CardContent className="p-6">
                <p className="text-sm font-medium text-green-600">Visiteurs Uniques Aujourd'hui</p>
                <p className="text-3xl font-bold text-green-700">{stats.analytics.uniqueVisitors.today}</p>
                <p className="text-xs text-muted-foreground mt-1">Semaine: {stats.analytics.uniqueVisitors.week} · Mois: {stats.analytics.uniqueVisitors.month}</p>
              </CardContent>
            </Card>
            <Card className="border-purple-200 bg-purple-50/50">
              <CardContent className="p-6">
                <p className="text-sm font-medium text-purple-600">Revenus Total</p>
                <p className="text-3xl font-bold text-purple-700">{(stats.analytics.revenue?.total || 0).toFixed(3)} <span className="text-sm">TND</span></p>
                <p className="text-xs text-muted-foreground mt-1">Ce mois: {(stats.analytics.revenue?.month || 0).toFixed(3)} TND</p>
              </CardContent>
            </Card>
            <Card className="border-orange-200 bg-orange-50/50">
              <CardContent className="p-6">
                <p className="text-sm font-medium text-orange-600">Taux Conversion</p>
                <p className="text-3xl font-bold text-orange-700">
                  {stats.analytics.uniqueVisitors.month > 0 
                    ? ((stats.totalOrders / stats.analytics.uniqueVisitors.month) * 100).toFixed(1)
                    : '0.0'}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">Commandes / Visiteurs uniques</p>
              </CardContent>
            </Card>
          </div>

          {/* Daily Views Chart */}
          {stats.analytics.dailyViews && stats.analytics.dailyViews.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Trafic des 7 Derniers Jours</CardTitle>
                <CardDescription>Pages vues et visiteurs uniques par jour</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={stats.analytics.dailyViews}>
                    <defs>
                      <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(val) => {
                      const d = new Date(val)
                      return `${d.getDate()}/${d.getMonth() + 1}`
                    }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      labelFormatter={(val) => {
                        const d = new Date(val as string)
                        return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
                      }}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="views" name="Pages vues" stroke="#3b82f6" fillOpacity={1} fill="url(#colorViews)" strokeWidth={2} />
                    <Area type="monotone" dataKey="uniqueVisitors" name="Visiteurs uniques" stroke="#22c55e" fillOpacity={1} fill="url(#colorVisitors)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Orders by Status Chart */}
            {stats.analytics.ordersByStatus && stats.analytics.ordersByStatus.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Commandes par Statut</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={stats.analytics.ordersByStatus.map(s => ({
                          name: s._id === 'pending' ? 'En attente' : s._id === 'confirmed' ? 'Confirmée' : s._id === 'preparing' ? 'Préparation' : s._id === 'shipped' ? 'Expédiée' : s._id === 'delivered' ? 'Livrée' : s._id === 'cancelled' ? 'Annulée' : s._id,
                          value: s.count
                        }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {stats.analytics.ordersByStatus.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={['#f59e0b', '#3b82f6', '#8b5cf6', '#06b6d4', '#22c55e', '#ef4444'][index % 6]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Revenue Card */}
            <Card>
              <CardHeader>
                <CardTitle>Revenus</CardTitle>
                <CardDescription>Analyse des ventes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
                    <div>
                      <p className="text-sm text-green-600 font-medium">Revenus Total</p>
                      <p className="text-2xl font-bold text-green-700">{(stats.analytics.revenue?.total || 0).toFixed(3)} TND</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-green-600 text-lg">💰</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Revenus Ce Mois</p>
                      <p className="text-2xl font-bold text-blue-700">{(stats.analytics.revenue?.month || 0).toFixed(3)} TND</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 text-lg">📈</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200">
                    <div>
                      <p className="text-sm text-purple-600 font-medium">Panier Moyen</p>
                      <p className="text-2xl font-bold text-purple-700">
                        {stats.totalOrders > 0
                          ? ((stats.analytics.revenue?.total || 0) / stats.totalOrders).toFixed(3)
                          : '0.000'} TND
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                      <span className="text-purple-600 text-lg">🛒</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Top Pages */}
      {stats.analytics?.topPages && stats.analytics.topPages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pages les Plus Visitées (Ce Mois)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={Math.max(250, stats.analytics.topPages.slice(0, 10).length * 40)}>
              <BarChart data={stats.analytics.topPages.slice(0, 10)} layout="vertical" margin={{ left: 100 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="_id" tick={{ fontSize: 11 }} width={100} />
                <Tooltip />
                <Bar dataKey="count" name="Visites" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Commandes Récentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {orders.slice(0, 5).map((order) => (
                <div key={order._id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-semibold">{order.orderNumber || `CMD-${order._id.slice(-6)}`}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.customerInfo?.fullName || 'Client anonyme'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{(order.finalTotal || order.total || 0).toFixed(3)} TND</p>
                    <Badge variant={getStatusBadge(order.status).variant}>
                      {getStatusBadge(order.status).label}
                    </Badge>
                  </div>
                </div>
              ))}
              {orders.length === 0 && (
                <p className="text-center text-muted-foreground py-4">Aucune commande récente</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Produits Populaires</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {products.slice(0, 5).map((product) => (
                <div key={product._id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {product.image && (
                      <img 
                        src={product.image}
                        alt={product.name}
                        className="h-10 w-10 object-cover rounded"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                    )}
                    <div>
                      <p className="font-semibold">{product.name}</p>
                      <p className="text-sm text-muted-foreground">{getCategoryName(product.category)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{product.price}</p>
                    <p className="text-xs text-muted-foreground">{product.reviews || 0} avis</p>
                  </div>
                </div>
              ))}
              {products.length === 0 && (
                <p className="text-center text-muted-foreground py-4">Aucun produit disponible</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderProducts = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestion des Produits ({products.length})</h2>
        <Button onClick={() => setProductModal({ isOpen: true, product: null })}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Nouveau Produit
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4">Image</th>
                  <th className="text-left p-4">Produit</th>
                  <th className="text-left p-4">Catégorie</th>
                  <th className="text-left p-4">Prix</th>
                  <th className="text-left p-4">Stock</th>
                  <th className="text-left p-4">Statut</th>
                  <th className="text-left p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product._id} className="border-b">
                    <td className="p-4">
                      {product.image ? (
                        <img 
                          src={product.image}
                          alt={product.name}
                          className="h-12 w-12 object-cover rounded"
                          onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-image.png' }}
                        />
                      ) : (
                        <div className="h-12 w-12 bg-gray-200 rounded flex items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-semibold">{product.name}</p>
                        <p className="text-sm text-muted-foreground truncate max-w-xs">
                          {product.description}
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{getCategoryName(product.category)}</p>
                        {product.subCategory && (
                          <p className="text-sm text-muted-foreground">
                            {getSubCategoryName(product.subCategory)}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-semibold text-primary">{product.price}</p>
                        {product.originalPrice && (
                          <p className="text-sm text-muted-foreground line-through">
                            {product.originalPrice}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{product.stockQuantity || 0}</p>
                        <p className={`text-sm ${product.inStock ? 'text-green-600' : 'text-red-600'}`}>
                          {product.inStock ? 'En Stock' : 'Rupture'}
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      {product.badge && (
                        <Badge variant="secondary">{product.badge}</Badge>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setProductModal({ isOpen: true, product })}
                        >
                          <EditIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setConfirmModal({
                            isOpen: true,
                            title: 'Supprimer le produit',
                            message: `Êtes-vous sûr de vouloir supprimer "${product.name}" ?`,
                            onConfirm: () => {
                              handleDeleteProduct(product._id)
                              setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null })
                            }
                          })}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      Aucun produit trouvé
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderCategories = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestion des Catégories</h2>
        <div className="space-x-2">
          <Button onClick={() => setCategoryModal({ isOpen: true, category: null, type: 'category' })}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Nouvelle Catégorie
          </Button>
          <Button 
            variant="outline"
            onClick={() => setCategoryModal({ isOpen: true, category: null, type: 'subcategory' })}
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Nouvelle Sous-catégorie
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Catégories ({categories.length})</CardTitle>
            <CardDescription>Catégories principales</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {categories.map((category) => (
                <div key={category._id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {category.image ? (
                      <img 
                        src={category.image}
                        alt={category.name}
                        className="h-10 w-10 object-cover rounded"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                    ) : (
                      <div className="h-10 w-10 bg-gray-200 rounded flex items-center justify-center">
                        <FolderIcon className="h-5 w-5 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold">{category.name}</p>
                      <p className="text-sm text-muted-foreground">{category.description}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setCategoryModal({ isOpen: true, category, type: 'category' })}
                    >
                      <EditIcon className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setConfirmModal({
                        isOpen: true,
                        title: 'Supprimer la catégorie',
                        message: `Êtes-vous sûr de vouloir supprimer "${category.name}" ?`,
                        onConfirm: () => {
                          handleDeleteCategory(category._id, 'category')
                          setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null })
                        }
                      })}
                    >
                      <TrashIcon className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
              {categories.length === 0 && (
                <p className="text-center text-muted-foreground py-4">Aucune catégorie trouvée</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sous-catégories ({subCategories.length})</CardTitle>
            <CardDescription>Sous-catégories par catégorie</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {subCategories.map((subCategory) => (
                <div key={subCategory._id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {subCategory.image ? (
                      <img 
                        src={subCategory.image}
                        alt={subCategory.name}
                        className="h-10 w-10 object-cover rounded"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                    ) : (
                      <div className="h-10 w-10 bg-gray-200 rounded flex items-center justify-center">
                        <FolderIcon className="h-5 w-5 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold">{subCategory.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {getCategoryName(subCategory.category)} • {subCategory.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setCategoryModal({ isOpen: true, category: subCategory, type: 'subcategory' })}
                    >
                      <EditIcon className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setConfirmModal({
                        isOpen: true,
                        title: 'Supprimer la sous-catégorie',
                        message: `Êtes-vous sûr de vouloir supprimer "${subCategory.name}" ?`,
                        onConfirm: () => {
                          handleDeleteCategory(subCategory._id, 'subcategory')
                          setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null })
                        }
                      })}
                    >
                      <TrashIcon className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
              {subCategories.length === 0 && (
                <p className="text-center text-muted-foreground py-4">Aucune sous-catégorie trouvée</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderOrders = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Gestion des Commandes ({orders.length})</h2>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4">Numéro</th>
                  <th className="text-left p-4">Client</th>
                  <th className="text-left p-4">Articles</th>
                  <th className="text-left p-4">Total</th>
                  <th className="text-left p-4">Statut</th>
                  <th className="text-left p-4">Date</th>
                  <th className="text-left p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id} className="border-b">
                    <td className="p-4">
                      <p className="font-mono text-sm">{order.orderNumber || `CMD-${order._id.slice(-6)}`}</p>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-semibold">{order.customerInfo?.fullName || 'Client anonyme'}</p>
                        <p className="text-sm text-muted-foreground">{order.customerInfo?.email}</p>
                        <p className="text-sm text-muted-foreground">{order.customerInfo?.phone}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant="secondary">{order.items?.length || 0} articles</Badge>
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-primary">{(order.finalTotal || 0).toFixed(3)} TND</p>
                    </td>
                    <td className="p-4">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order._id, e.target.value as Order['status'])}
                        className="text-sm border rounded px-2 py-1"
                      >
                        <option value="pending">En Attente</option>
                        <option value="confirmed">Confirmée</option>
                        <option value="preparing">Préparation</option>
                        <option value="shipped">Expédiée</option>
                        <option value="delivered">Livrée</option>
                        <option value="cancelled">Annulée</option>
                      </select>
                    </td>
                    <td className="p-4">
                      <p className="text-sm">{formatDate(order.createdAt)}</p>
                    </td>
                    <td className="p-4">
                      <Button size="sm" variant="ghost">
                        <EyeIcon className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      Aucune commande trouvée
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderUsers = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Gestion des Utilisateurs ({users.length})</h2>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4">Nom</th>
                  <th className="text-left p-4">Email</th>
                  <th className="text-left p-4">Téléphone</th>
                  <th className="text-left p-4">Ville</th>
                  <th className="text-left p-4">Rôle</th>
                  <th className="text-left p-4">Date d'inscription</th>
                  <th className="text-left p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id} className="border-b">
                    <td className="p-4">
                      <p className="font-semibold">{user.name}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm">{user.email}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm">{user.phone || 'N/A'}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm">{user.city || 'N/A'}</p>
                    </td>
                    <td className="p-4">
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                        {user.role === 'admin' ? 'Admin' : 'Utilisateur'}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <p className="text-sm">{formatDate(user.createdAt)}</p>
                    </td>
                    <td className="p-4">
                      <Button size="sm" variant="ghost">
                        <EyeIcon className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      Aucun utilisateur trouvé
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const menuItems = [
    { id: 'dashboard', label: 'Tableau de Bord', icon: DashboardIcon },
    { id: 'products', label: 'Produits', icon: PackageIcon },
    { id: 'categories', label: 'Catégories', icon: FolderIcon },
    { id: 'orders', label: 'Commandes', icon: ShoppingCartIcon },
    { id: 'users', label: 'Utilisateurs', icon: UsersIcon }
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 min-h-screen bg-muted/30 border-r relative">
          <div className="p-6">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              VitaPharm Admin
            </h1>
            {currentUser && (
              <p className="text-sm text-muted-foreground mt-1">
                Connecté en tant que {currentUser.name}
              </p>
            )}
          </div>

          <nav className="px-4">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
                  activeTab === item.id 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="absolute bottom-4 left-4">
            <Button variant="ghost" className="text-muted-foreground" onClick={handleLogout}>
              <LogOutIcon className="h-4 w-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2">Chargement...</span>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && renderDashboard()}
              {activeTab === 'products' && renderProducts()}
              {activeTab === 'categories' && renderCategories()}
              {activeTab === 'orders' && renderOrders()}
              {activeTab === 'users' && renderUsers()}
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      <ProductModal
        isOpen={productModal.isOpen}
        onClose={() => setProductModal({ isOpen: false, product: null })}
        product={productModal.product}
        onSave={handleSaveProduct}
        categories={categories}
        subCategories={subCategories}
      />

      <CategoryModal
        isOpen={categoryModal.isOpen}
        onClose={() => setCategoryModal({ isOpen: false, category: null, type: 'category' })}
        category={categoryModal.category}
        onSave={handleSaveCategory}
        type={categoryModal.type || 'category'}
        categories={categories}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null })}
        onConfirm={confirmModal.onConfirm || (() => {})}
        title={confirmModal.title}
        message={confirmModal.message}
      />
    </div>
  )
}