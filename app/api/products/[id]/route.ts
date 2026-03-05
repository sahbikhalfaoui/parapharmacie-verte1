import { NextRequest, NextResponse } from 'next/server'
import connectToDatabase from '@/lib/mongodb'
import { Product } from '@/lib/models'
import { requireAdmin } from '@/lib/auth'
import { uploadImageFromBase64 } from '@/lib/cloudinary'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase()
    const { id } = await params
    
    const product = await Product.findById(id)
      .populate('category', 'name')
      .populate('subCategory', 'name')
    
    if (!product || !product.isActive) {
      return NextResponse.json({ error: 'Produit non trouvé' }, { status: 404 })
    }
    
    return NextResponse.json(product)
  } catch (error) {
    console.error('Product by ID error:', error)
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
    const updateData: Record<string, any> = {}
    
    const fields = ['name', 'description', 'price', 'originalPrice', 'category', 'subCategory', 'badge', 'stockQuantity']
    fields.forEach(field => {
      const value = formData.get(field)
      if (value !== null && value !== '') {
        if (field === 'stockQuantity') {
          updateData[field] = parseInt(value as string)
        } else {
          updateData[field] = value
        }
      }
    })
    
    if (formData.get('inStock') !== null) {
      updateData.inStock = formData.get('inStock') === 'true'
    }
    
    // Handle main image
    const imageBase64 = formData.get('imageBase64') as string | null
    const imageFile = formData.get('image') as File | null
    
    if (imageBase64) {
      updateData.image = await uploadImageFromBase64(imageBase64, 'vitapharm/products')
    } else if (imageFile && imageFile.size > 0) {
      const bytes = await imageFile.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const base64 = `data:${imageFile.type};base64,${buffer.toString('base64')}`
      updateData.image = await uploadImageFromBase64(base64, 'vitapharm/products')
    }
    
    // Handle gallery images
    const galleryImages: string[] = []
    for (let i = 0; i < 10; i++) {
      const galleryBase64 = formData.get(`galleryBase64_${i}`) as string | null
      const galleryFile = formData.get(`gallery_${i}`) as File | null
      
      if (galleryBase64) {
        const url = await uploadImageFromBase64(galleryBase64, 'vitapharm/products/gallery')
        galleryImages.push(url)
      } else if (galleryFile && galleryFile.size > 0) {
        const bytes = await galleryFile.arrayBuffer()
        const buffer = Buffer.from(bytes)
        const base64 = `data:${galleryFile.type};base64,${buffer.toString('base64')}`
        const url = await uploadImageFromBase64(base64, 'vitapharm/products/gallery')
        galleryImages.push(url)
      }
    }
    
    if (galleryImages.length > 0) {
      updateData.gallery = galleryImages
    }
    
    const product = await Product.findByIdAndUpdate(id, updateData, { new: true })
    
    if (!product) {
      return NextResponse.json({ error: 'Produit non trouvé' }, { status: 404 })
    }
    
    return NextResponse.json({ message: 'Produit mis à jour', product })
  } catch (error) {
    console.error('Update product error:', error)
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
    
    await Product.findByIdAndUpdate(id, { isActive: false })
    
    return NextResponse.json({ message: 'Produit désactivé' })
  } catch (error) {
    console.error('Delete product error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
