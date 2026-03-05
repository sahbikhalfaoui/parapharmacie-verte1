import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import connectToDatabase from '@/lib/mongodb'
import { Review, Product, Order, updateProductRating } from '@/lib/models'
import { requireAuth } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase()
    const { id: productId } = await params
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const rating = searchParams.get('rating')
    
    const query: Record<string, any> = {
      product: productId,
      status: 'approved'
    }
    
    if (rating) {
      query.rating = parseInt(rating)
    }
    
    const sortOptions: Record<string, 1 | -1> = {}
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1
    
    const reviews = await Review.find(query)
      .populate('user', 'name')
      .sort(sortOptions)
      .limit(limit)
      .skip((page - 1) * limit)
    
    const total = await Review.countDocuments(query)
    
    const ratingStats = await Review.aggregate([
      { $match: { product: new mongoose.Types.ObjectId(productId), status: 'approved' } },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      }
    ])
    
    const ratingBreakdown: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    ratingStats.forEach(stat => {
      ratingBreakdown[stat._id] = stat.count
    })
    
    const averageRating = reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0
    
    return NextResponse.json({
      reviews,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        hasNext: page * limit < total,
        hasPrev: page > 1
      },
      stats: {
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews: total,
        ratingBreakdown
      }
    })
  } catch (error) {
    console.error('Get reviews error:', error)
    return NextResponse.json({ error: 'Erreur lors de la récupération des avis' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error: authError } = await requireAuth(request)
  if (authError) return authError

  try {
    await connectToDatabase()
    const { id: productId } = await params
    const { rating, title, comment } = await request.json()
    
    if (!rating || !title || !comment) {
      return NextResponse.json({ error: 'Tous les champs sont requis' }, { status: 400 })
    }
    
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'La note doit être entre 1 et 5' }, { status: 400 })
    }
    
    const product = await Product.findById(productId)
    if (!product || !product.isActive) {
      return NextResponse.json({ error: 'Produit non trouvé' }, { status: 404 })
    }
    
    const existingReview = await Review.findOne({ product: productId, user: user!._id })
    if (existingReview) {
      return NextResponse.json({ error: 'Vous avez déjà donné votre avis sur ce produit' }, { status: 400 })
    }
    
    const hasPurchased = await Order.findOne({
      user: user!._id,
      'items.product': productId,
      status: { $in: ['delivered', 'completed'] }
    })
    
    const review = new Review({
      product: productId,
      user: user!._id,
      rating: parseInt(rating),
      title: title.trim(),
      comment: comment.trim(),
      isVerifiedPurchase: !!hasPurchased
    })
    
    await review.save()
    await updateProductRating(productId)
    await review.populate('user', 'name')
    
    return NextResponse.json({
      message: 'Avis créé avec succès',
      review
    }, { status: 201 })
  } catch (error: any) {
    console.error('Create review error:', error)
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Vous avez déjà donné votre avis sur ce produit' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erreur lors de la création de l\'avis' }, { status: 500 })
  }
}
