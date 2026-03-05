import { NextRequest, NextResponse } from 'next/server'
import { OAuth2Client } from 'google-auth-library'
import connectToDatabase from '@/lib/mongodb'
import { User } from '@/lib/models'
import { generateToken, hashPassword } from '@/lib/auth'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '775881234717-36l5t936hnf5pj8f7uhjg8hf17dm46h3.apps.googleusercontent.com'
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID)

export async function POST(request: NextRequest) {
  try {
    const { credential } = await request.json()

    if (!credential) {
      return NextResponse.json({ error: 'Credential manquant' }, { status: 400 })
    }

    let ticket
    try {
      ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: GOOGLE_CLIENT_ID,
      })
    } catch (verifyError) {
      console.error('Token verification failed:', verifyError)
      return NextResponse.json({ error: 'Token Google invalide. Veuillez réessayer.' }, { status: 401 })
    }

    const payload = ticket.getPayload()
    
    if (!payload || !payload.email) {
      return NextResponse.json({ error: 'Données Google invalides' }, { status: 400 })
    }

    const { email, name, picture, sub: googleId } = payload

    await connectToDatabase()

    let user = await User.findOne({ email })

    if (user) {
      if (!user.googleId) {
        user.googleId = googleId
      }
      if (!user.picture && picture) {
        user.picture = picture
      }
      await user.save()
    } else {
      const randomPassword = Math.random().toString(36) + Date.now()
      user = new User({
        name: name || email.split('@')[0],
        email,
        googleId,
        picture,
        password: await hashPassword(randomPassword),
        role: 'user'
      })
      await user.save()
    }

    const token = generateToken(user._id.toString())

    return NextResponse.json({
      message: 'Connexion Google réussie',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        picture: user.picture
      }
    })
  } catch (error) {
    console.error('Google auth error:', error)
    return NextResponse.json({ error: 'Erreur lors de l\'authentification Google' }, { status: 500 })
  }
}
