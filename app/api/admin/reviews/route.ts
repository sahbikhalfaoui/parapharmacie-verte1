import { NextRequest, NextResponse } from 'next/server'
import connectToDatabase from '@/lib/mongodb'
import { Review, updateProductRating } from '@/lib/models'
import { requireAdmin } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const { user, error } = await requireAdmin(request)
  if (error) return error

  try {
    await connectToDatabase()
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const productId = searchParams.get('productId')
    
    const query: Record<string, any> = {}
    if (status) query.status = status
    if (productId) query.product = productId
    
    const reviews = await Review.find(query)
      .populate('user', 'name email')
      .populate('product', 'name')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
    
    const total = await Review.countDocuments(query)
    
    return NextResponse.json({
      reviews,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page
      }
    })
  } catch (error) {
    console.error('Admin get reviews error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
