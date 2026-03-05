import { NextRequest, NextResponse } from 'next/server'
import connectToDatabase from '@/lib/mongodb'
import { Category } from '@/lib/models'
import { requireAdmin } from '@/lib/auth'
import { uploadImageFromBase64 } from '@/lib/cloudinary'

export async function GET() {
  try {
    await connectToDatabase()
    const categories = await Category.find({ isActive: true }).sort({ name: 1 }).lean()
    return NextResponse.json(categories)
  } catch (error) {
    console.error('Categories error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { user, error } = await requireAdmin(request)
  if (error) return error

  try {
    await connectToDatabase()
    
    const formData = await request.formData()
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const imageFile = formData.get('image') as File | null
    const imageBase64 = formData.get('imageBase64') as string | null
    
    const categoryData: { name: string; description?: string; image?: string } = { name }
    if (description) categoryData.description = description
    
    // Handle image upload
    if (imageBase64) {
      categoryData.image = await uploadImageFromBase64(imageBase64, 'vitapharm/categories')
    } else if (imageFile && imageFile.size > 0) {
      const bytes = await imageFile.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const base64 = `data:${imageFile.type};base64,${buffer.toString('base64')}`
      categoryData.image = await uploadImageFromBase64(base64, 'vitapharm/categories')
    }
    
    const category = new Category(categoryData)
    await category.save()
    
    return NextResponse.json({ message: 'Catégorie créée', category }, { status: 201 })
  } catch (error: any) {
    console.error('Create category error:', error)
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Cette catégorie existe déjà' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
