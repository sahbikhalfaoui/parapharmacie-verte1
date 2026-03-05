import { NextRequest, NextResponse } from 'next/server'
import connectToDatabase from '@/lib/mongodb'
import { ContactMessage } from '@/lib/models'
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
    
    if (!['new', 'read', 'replied'].includes(status)) {
      return NextResponse.json({ error: 'Statut invalide' }, { status: 400 })
    }
    
    const message = await ContactMessage.findByIdAndUpdate(id, { status }, { new: true })
    
    if (!message) {
      return NextResponse.json({ error: 'Message non trouvé' }, { status: 404 })
    }
    
    return NextResponse.json({ message: 'Statut mis à jour', contactMessage: message })
  } catch (error) {
    console.error('Update contact message status error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireAdmin(request)
  if (error) return error

  try {
    await connectToDatabase()
    const { id } = await params
    
    await ContactMessage.findByIdAndDelete(id)
    
    return NextResponse.json({ message: 'Message supprimé' })
  } catch (error) {
    console.error('Delete contact message error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
