import { NextRequest, NextResponse } from 'next/server'
import connectToDatabase from '@/lib/mongodb'
import { Category, SubCategory, Product } from '@/lib/models'
import { requireAdmin } from '@/lib/auth'
import { uploadImageFromBase64 } from '@/lib/cloudinary'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase()
    const { id } = await params
    const category = await Category.findById(id)
    
    if (!category || !category.isActive) {
      return NextResponse.json({ error: 'Catégorie non trouvée' }, { status: 404 })
    }
    
    return NextResponse.json(category)
  } catch (error) {
    console.error('Get category error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireAdmin(request)
  if (error) return error

  try {
    await connectToDatabase()
    const { id } = await params
    
    const formData = await request.formData()
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const imageBase64 = formData.get('imageBase64') as string | null
    const imageFile = formData.get('image') as File | null
    
    const updateData: Record<string, any> = {}
    if (name) updateData.name = name
    if (description !== undefined) updateData.description = description
    
    if (imageBase64) {
      updateData.image = await uploadImageFromBase64(imageBase64, 'vitapharm/categories')
    } else if (imageFile && imageFile.size > 0) {
      const bytes = await imageFile.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const base64 = `data:${imageFile.type};base64,${buffer.toString('base64')}`
      updateData.image = await uploadImageFromBase64(base64, 'vitapharm/categories')
    }
    
    const category = await Category.findByIdAndUpdate(id, updateData, { new: true })
    
    if (!category) {
      return NextResponse.json({ error: 'Catégorie non trouvée' }, { status: 404 })
    }
    
    return NextResponse.json({ message: 'Catégorie mise à jour', category })
  } catch (error) {
    console.error('Update category error:', error)
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
    
    await Category.findByIdAndUpdate(id, { isActive: false })
    await SubCategory.updateMany({ category: id }, { isActive: false })
    await Product.updateMany({ category: id }, { isActive: false })
    
    return NextResponse.json({ message: 'Catégorie désactivée' })
  } catch (error) {
    console.error('Delete category error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
