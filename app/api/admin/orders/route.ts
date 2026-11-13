import { NextRequest, NextResponse } from 'next/server'
import connectToDatabase from '@/lib/mongodb'
import { Order } from '@/lib/models'
import { requireAdmin } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const { user, error } = await requireAdmin(request)
  if (error) return error

  try {
    await connectToDatabase()
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = (() => { const n = parseInt(searchParams.get('limit') || '100'); return isNaN(n) || n < 0 ? 100 : n })()
    const status = searchParams.get('status')
    
    const query: Record<string, any> = {}
    if (status) query.status = status
    
    let ordersQuery = Order.find(query)
      .populate('user', 'name email phone')
      .populate('items.product', 'name image')
      .sort({ createdAt: -1 })
    // limit=0 (or all=true) -> return every order
    const noLimit = searchParams.get('all') === 'true' || limit === 0
    if (!noLimit) {
      ordersQuery = ordersQuery.limit(limit).skip((page - 1) * limit)
    }
    const orders = await ordersQuery
    
    return NextResponse.json(orders)
  } catch (error) {
    console.error('Admin orders error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
