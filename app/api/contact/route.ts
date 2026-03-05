import { NextRequest, NextResponse } from 'next/server'
import connectToDatabase from '@/lib/mongodb'
import { ContactMessage } from '@/lib/models'
import { requireAdmin } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const { user, error } = await requireAdmin(request)
  if (error) return error

  try {
    await connectToDatabase()
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    
    const query: Record<string, any> = {}
    if (status) query.status = status
    
    const messages = await ContactMessage.find(query).sort({ createdAt: -1 })
    
    return NextResponse.json(messages)
  } catch (error) {
    console.error('Get contact messages error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, subject, message } = await request.json()
    
    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: 'Tous les champs requis doivent être remplis' }, { status: 400 })
    }
    
    await connectToDatabase()
    
    const contactMessage = new ContactMessage({
      name,
      email,
      phone,
      subject,
      message
    })
    
    await contactMessage.save()
    
    return NextResponse.json({ 
      message: 'Message envoyé avec succès',
      contactMessage 
    }, { status: 201 })
  } catch (error) {
    console.error('Create contact message error:', error)
    return NextResponse.json({ error: 'Erreur lors de l\'envoi du message' }, { status: 500 })
  }
}
