import { NextRequest, NextResponse } from 'next/server'
import connectToDatabase from '@/lib/mongodb'
import { Order } from '@/lib/models'
import { requireAdmin } from '@/lib/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireAdmin(request)
  if (error) return error

  try {
    await connectToDatabase()
    const { id } = await params
    const { status } = await request.json()
    
    const order = await Order.findByIdAndUpdate(id, { status }, { new: true })
    
    if (!order) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 })
    }
    
    return NextResponse.json({ message: 'Statut mis à jour', order })
  } catch (error) {
    console.error('Update order status error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
