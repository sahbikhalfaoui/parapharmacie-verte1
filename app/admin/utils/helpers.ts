export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('fr-FR')
}

export const getStatusBadge = (status: string) => {
  const statusMap = {
    pending: { label: 'En Attente', variant: 'secondary' as const },
    confirmed: { label: 'Confirmée', variant: 'default' as const },
    preparing: { label: 'Préparation', variant: 'default' as const },
    shipped: { label: 'Expédiée', variant: 'default' as const },
    delivered: { label: 'Livrée', variant: 'default' as const },
    cancelled: { label: 'Annulée', variant: 'destructive' as const }
  }
  const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, variant: 'secondary' as const }
  return { label: statusInfo.label, variant: statusInfo.variant }
}

export const ORDER_STATUS_OPTIONS = [
  { value: 'pending', label: 'En Attente' },
  { value: 'confirmed', label: 'Confirmée' },
  { value: 'preparing', label: 'Préparation' },
  { value: 'shipped', label: 'Expédiée' },
  { value: 'delivered', label: 'Livrée' },
  { value: 'cancelled', label: 'Annulée' }
] as const

// Extract the product id from an order item (populated object or raw id)
export const getOrderItemProductId = (product: unknown): string | null => {
  if (!product) return null
  if (typeof product === 'string') return product
  if (typeof product === 'object' && product !== null && '_id' in product) {
    const id = (product as { _id?: unknown })._id
    return id ? String(id) : null
  }
  return null
}

// Human readable French label for a visited page path
export const getPageLabel = (path: string): string => {
  if (!path) return 'Page inconnue'
  const clean = path.split('?')[0].split('#')[0].replace(/\/+$/, '') || '/'
  const labels: Record<string, string> = {
    '/': 'Accueil',
    '/contact': 'Contact',
    '/products': 'Produits',
    '/produits': 'Produits',
    '/categories': 'Catégories',
    '/cart': 'Panier',
    '/panier': 'Panier',
    '/checkout': 'Commande',
    '/login': 'Connexion',
    '/register': 'Inscription',
    '/profile': 'Mon profil',
    '/account': 'Mon compte',
    '/orders': 'Mes commandes',
    '/about': 'À propos',
    '/a-propos': 'À propos',
    '/search': 'Recherche',
    '/promotions': 'Promotions',
    '/favorites': 'Favoris',
    '/wishlist': 'Favoris'
  }
  if (labels[clean]) return labels[clean]
  if (clean.startsWith('/product/')) return 'Produit'
  if (clean.startsWith('/category/') || clean.startsWith('/categories/')) return 'Catégorie : ' + decodeURIComponent(clean.split('/').pop() || '')
  const segment = decodeURIComponent(clean.split('/').filter(Boolean).pop() || clean)
  return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/[-_]/g, ' ')
}
