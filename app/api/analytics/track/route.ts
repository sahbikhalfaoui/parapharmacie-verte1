import { NextRequest, NextResponse } from 'next/server'
import connectToDatabase from '@/lib/mongodb'
import { PageView } from '@/lib/models'
import { getAuthUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { page, path, referrer, sessionId } = await request.json()
    
    if (!page || !path || !sessionId) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }
    
    await connectToDatabase()
    
    // Try to get user if authenticated
    const user = await getAuthUser(request)
    
    const pageView = new PageView({
      page,
      path,
      referrer,
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      userId: user?._id,
      sessionId
    })
    
    await pageView.save()
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Track pageview error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
