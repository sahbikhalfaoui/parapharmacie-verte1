import { NextRequest, NextResponse } from 'next/server'
import connectToDatabase from '@/lib/mongodb'
import { Product } from '@/lib/models'
import { requireAdmin } from '@/lib/auth'
import { uploadImageFromBase64 } from '@/lib/cloudinary'

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const subCategory = searchParams.get('subCategory')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const inStock = searchParams.get('inStock')
    const fields = searchParams.get('fields') // optional field selection
    
    const badge = searchParams.get('badge')
    
    const query: Record<string, any> = { isActive: true }
    
    if (inStock !== undefined && inStock !== null) {
      query.inStock = inStock === 'true'
    }
    if (category) query.category = category
    if (subCategory) query.subCategory = subCategory
    if (search) query.name = { $regex: search, $options: 'i' }
    if (badge) query.badge = { $regex: `^${badge}$`, $options: 'i' }
    
    const sortOptions: Record<string, 1 | -1> = {}
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1
    
    const skip = (page - 1) * limit
    
    // Run count and find in parallel
    const [total, products] = await Promise.all([
      Product.countDocuments(query),
      Product.find(query)
        .select(fields || 'name price originalPrice image category subCategory averageRating totalReviews inStock badge brand stockQuantity')
        .populate('category', 'name')
        .populate('subCategory', 'name')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean()
    ])
    
    return NextResponse.json({
      products,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page
    })
  } catch (error) {
    console.error('Products error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { user, error } = await requireAdmin(request)
  if (error) return error

  try {
    await connectToDatabase()
    
    const formData = await request.formData()
    
    const productData: Record<string, any> = {
      name: formData.get('name'),
      description: formData.get('description'),
      price: formData.get('price'),
      category: formData.get('category'),
    }
    
    if (formData.get('originalPrice')) productData.originalPrice = formData.get('originalPrice')
    if (formData.get('subCategory')) productData.subCategory = formData.get('subCategory')
    if (formData.get('badge')) productData.badge = formData.get('badge')
    if (formData.get('inStock')) productData.inStock = formData.get('inStock') === 'true'
    if (formData.get('stockQuantity')) productData.stockQuantity = parseInt(formData.get('stockQuantity') as string)
    
    // Handle main image
    const imageBase64 = formData.get('imageBase64') as string | null
    const imageFile = formData.get('image') as File | null
    
    if (imageBase64) {
      productData.image = await uploadImageFromBase64(imageBase64, 'vitapharm/products')
    } else if (imageFile && imageFile.size > 0) {
      const bytes = await imageFile.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const base64 = `data:${imageFile.type};base64,${buffer.toString('base64')}`
      productData.image = await uploadImageFromBase64(base64, 'vitapharm/products')
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
      productData.gallery = galleryImages
    }
    
    const product = new Product(productData)
    await product.save()
    
    return NextResponse.json({ message: 'Produit créé', product }, { status: 201 })
  } catch (error) {
    console.error('Create product error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
