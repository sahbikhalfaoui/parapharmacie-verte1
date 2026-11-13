import { NextRequest, NextResponse } from 'next/server'
import connectToDatabase from '@/lib/mongodb'
import { Order } from '@/lib/models'
import { requireAdmin } from '@/lib/auth'

// DELETE /api/admin/orders/:id
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin(request)
  if (error) return error
  try {
    await connectToDatabase()
    const { id } = await params
    const order = await Order.findByIdAndDelete(id)
    if (!order) return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 })
    return NextResponse.json({ message: 'Commande supprimée' })
  } catch (error) {
    console.error('Delete order error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
