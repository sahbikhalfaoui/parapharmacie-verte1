import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { NextRequest } from 'next/server'
import connectToDatabase from './mongodb'
import { User, IUser } from './models'

const JWT_SECRET = process.env.JWT_SECRET || 'vitapharm-super-secret-jwt-key-2024-change-this-to-random-string'

export interface JWTPayload {
  id: string
  iat: number
  exp: number
}

export function generateToken(userId: string): string {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '30d' })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch (error) {
    return null
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export async function getAuthUser(request: NextRequest): Promise<IUser | null> {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.replace('Bearer ', '')
    const decoded = verifyToken(token)
    
    if (!decoded) {
      return null
    }

    await connectToDatabase()
    const user = await User.findById(decoded.id).select('-password')
    
    return user
  } catch (error) {
    console.error('Auth error:', error)
    return null
  }
}

export async function requireAuth(request: NextRequest): Promise<{ user: IUser | null; error: Response | null }> {
  const user = await getAuthUser(request)
  
  if (!user) {
    return {
      user: null,
      error: new Response(JSON.stringify({ error: 'Token requis' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }
  
  return { user, error: null }
}

export async function requireAdmin(request: NextRequest): Promise<{ user: IUser | null; error: Response | null }> {
  const { user, error } = await requireAuth(request)
  
  if (error) return { user: null, error }
  
  if (user?.role !== 'admin') {
    return {
      user: null,
      error: new Response(JSON.stringify({ error: 'Accès administrateur requis' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }
  
  return { user, error: null }
}

export async function createDefaultAdmin() {
  try {
    await connectToDatabase()
    const adminExists = await User.findOne({ role: 'admin' })
    
    if (!adminExists) {
      const hashedPassword = await hashPassword('admin123')
      const admin = new User({
        name: 'Administrateur',
        email: 'admin@vitapharm.tn',
        password: hashedPassword,
        role: 'admin'
      })
      await admin.save()
      console.log('🔑 Admin par défaut créé')
    }
  } catch (error) {
    console.error('❌ Erreur création admin:', error)
  }
}
