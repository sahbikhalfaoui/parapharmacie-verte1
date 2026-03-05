import { NextRequest, NextResponse } from 'next/server'
import connectToDatabase from '@/lib/mongodb'
import { Order } from '@/lib/models'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const { user, error } = await requireAuth(request)
  if (error) return error

  try {
    await connectToDatabase()
    
    const orders = await Order.find({ user: user!._id })
      .populate('items.product', 'name image')
      .sort({ createdAt: -1 })
    
    return NextResponse.json(orders)
  } catch (error) {
    console.error('User orders error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
