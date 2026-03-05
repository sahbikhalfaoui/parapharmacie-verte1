import { NextRequest, NextResponse } from 'next/server'
import connectToDatabase from '@/lib/mongodb'
import { Review, updateProductRating } from '@/lib/models'
import { requireAdmin } from '@/lib/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireAdmin(request)
  if (error) return error

  try {
    await connectToDatabase()
    const { id: reviewId } = await params
    const { status, adminResponse } = await request.json()
    
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return NextResponse.json({ error: 'Statut invalide' }, { status: 400 })
    }
    
    const review = await Review.findByIdAndUpdate(
      reviewId,
      {
        status,
        adminResponse: adminResponse || undefined,
        updatedAt: new Date()
      },
      { new: true }
    ).populate('product', 'name')
    
    if (!review) {
      return NextResponse.json({ error: 'Avis non trouvé' }, { status: 404 })
    }
    
    await updateProductRating(review.product._id)
    
    const statusMessage = status === 'approved' ? 'approuvé' : status === 'rejected' ? 'rejeté' : 'mis en attente'
    
    return NextResponse.json({
      message: `Avis ${statusMessage}`,
      review
    })
  } catch (error) {
    console.error('Update review status error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
