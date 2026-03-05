import { NextRequest, NextResponse } from 'next/server'
import connectToDatabase from '@/lib/mongodb'
import { Order } from '@/lib/models'
import { requireAuth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    
    const orderData = await request.json()
    const order = new Order(orderData)
    await order.save()
    
    return NextResponse.json({ message: 'Commande créée avec succès', order }, { status: 201 })
  } catch (error) {
    console.error('Create order error:', error)
    return NextResponse.json({ error: 'Erreur lors de la création de la commande' }, { status: 500 })
  }
}
