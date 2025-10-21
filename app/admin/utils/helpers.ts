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