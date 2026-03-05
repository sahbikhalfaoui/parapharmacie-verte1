import { NextRequest, NextResponse } from 'next/server'
import connectToDatabase from '@/lib/mongodb'
import { SubCategory, Product } from '@/lib/models'
import { requireAdmin } from '@/lib/auth'
import { uploadImageFromBase64 } from '@/lib/cloudinary'

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    
    const query: Record<string, any> = { isActive: true }
    if (category) query.category = category
    
    const subCategories = await SubCategory.find(query)
      .populate('category', 'name')
      .sort({ name: 1 })
      .lean()
    
    return NextResponse.json(subCategories)
  } catch (error) {
    console.error('Subcategories error:', error)
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
    const category = formData.get('category') as string
    const imageBase64 = formData.get('imageBase64') as string | null
    const imageFile = formData.get('image') as File | null
    
    const subCategoryData: Record<string, any> = { name, category }
    if (description) subCategoryData.description = description
    
    if (imageBase64) {
      subCategoryData.image = await uploadImageFromBase64(imageBase64, 'vitapharm/subcategories')
    } else if (imageFile && imageFile.size > 0) {
      const bytes = await imageFile.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const base64 = `data:${imageFile.type};base64,${buffer.toString('base64')}`
      subCategoryData.image = await uploadImageFromBase64(base64, 'vitapharm/subcategories')
    }
    
    const subCategory = new SubCategory(subCategoryData)
    await subCategory.save()
    
    return NextResponse.json({ message: 'Sous-catégorie créée', subCategory }, { status: 201 })
  } catch (error) {
    console.error('Create subcategory error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
