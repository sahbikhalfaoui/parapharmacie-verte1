import mongoose, { Schema, Document, Model } from 'mongoose'

// User Schema
export interface IUser extends Document {
  name: string
  email: string
  password: string
  role: 'user' | 'admin'
  phone?: string
  address?: string
  city?: string
  googleId?: string
  picture?: string
  createdAt: Date
}

const userSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  phone: String,
  address: String,
  city: String,
  googleId: String,
  picture: String,
  createdAt: { type: Date, default: Date.now }
})

// Category Schema
export interface ICategory extends Document {
  name: string
  description?: string
  image?: string
  isActive: boolean
  createdAt: Date
}

const categorySchema = new Schema<ICategory>({
  name: { type: String, required: true, unique: true },
  description: String,
  image: String,
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
})

// SubCategory Schema
export interface ISubCategory extends Document {
  name: string
  description?: string
  category: mongoose.Types.ObjectId
  image?: string
  isActive: boolean
  createdAt: Date
}

const subCategorySchema = new Schema<ISubCategory>({
  name: { type: String, required: true },
  description: String,
  category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  image: String,
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
})

// Product Schema
export interface IProduct extends Document {
  name: string
  description: string
  price: string
  originalPrice?: string
  category: mongoose.Types.ObjectId
  subCategory?: mongoose.Types.ObjectId
  image?: string
  gallery: string[]
  averageRating: number
  totalReviews: number
  ratingBreakdown: {
    5: number
    4: number
    3: number
    2: number
    1: number
  }
  badge?: string
  inStock: boolean
  stockQuantity: number
  isActive: boolean
  createdAt: Date
}

const productSchema = new Schema<IProduct>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: String, required: true },
  originalPrice: String,
  category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  subCategory: { type: Schema.Types.ObjectId, ref: 'SubCategory' },
  image: String,
  gallery: [String],
  averageRating: { type: Number, default: 0, min: 0, max: 5 },
  totalReviews: { type: Number, default: 0 },
  ratingBreakdown: {
    5: { type: Number, default: 0 },
    4: { type: Number, default: 0 },
    3: { type: Number, default: 0 },
    2: { type: Number, default: 0 },
    1: { type: Number, default: 0 }
  },
  badge: String,
  inStock: { type: Boolean, default: true },
  stockQuantity: { type: Number, default: 100 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
})

// Performance indexes
productSchema.index({ isActive: 1, createdAt: -1 })
productSchema.index({ isActive: 1, category: 1 })
productSchema.index({ isActive: 1, subCategory: 1 })
productSchema.index({ name: 'text' })
categorySchema.index({ isActive: 1, name: 1 })
subCategorySchema.index({ isActive: 1, category: 1 })

// Order Schema
export interface IOrderItem {
  product: mongoose.Types.ObjectId
  name: string
  price: string
  quantity: number
}

export interface ICustomerInfo {
  fullName: string
  phone: string
  email: string
  address: string
  city: string
  notes?: string
}

export interface IOrder extends Document {
  user?: mongoose.Types.ObjectId
  items: IOrderItem[]
  customerInfo: ICustomerInfo
  totalPrice: number
  deliveryFee: number
  finalTotal: number
  status: 'pending' | 'confirmed' | 'preparing' | 'shipped' | 'delivered' | 'cancelled'
  paymentMethod: string
  orderNumber: string
  createdAt: Date
}

const orderSchema = new Schema<IOrder>({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  items: [{
    product: { type: Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    price: String,
    quantity: { type: Number, required: true }
  }],
  customerInfo: {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    notes: String
  },
  totalPrice: { type: Number, required: true },
  deliveryFee: { type: Number, default: 15 },
  finalTotal: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled'], default: 'pending' },
  paymentMethod: { type: String, default: 'COD' },
  orderNumber: String,
  createdAt: { type: Date, default: Date.now }
})

// Auto-generate order number
orderSchema.pre('save', async function() {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments()
    this.orderNumber = `VTB-${Date.now()}-${count + 1}`
  }
})

// Review Schema
export interface IReview extends Document {
  product: mongoose.Types.ObjectId
  user: mongoose.Types.ObjectId
  rating: number
  title: string
  comment: string
  isVerifiedPurchase: boolean
  helpfulVotes: number
  unhelpfulVotes: number
  status: 'pending' | 'approved' | 'rejected'
  adminResponse?: string
  createdAt: Date
  updatedAt: Date
}

const reviewSchema = new Schema<IReview>({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String, required: true, maxlength: 100 },
  comment: { type: String, required: true, maxlength: 1000 },
  isVerifiedPurchase: { type: Boolean, default: false },
  helpfulVotes: { type: Number, default: 0 },
  unhelpfulVotes: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
  adminResponse: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

reviewSchema.index({ product: 1, user: 1 }, { unique: true })

// Analytics Schema for tracking visits
export interface IPageView extends Document {
  page: string
  path: string
  referrer?: string
  userAgent?: string
  ip?: string
  userId?: mongoose.Types.ObjectId
  sessionId: string
  createdAt: Date
}

const pageViewSchema = new Schema<IPageView>({
  page: { type: String, required: true },
  path: { type: String, required: true },
  referrer: String,
  userAgent: String,
  ip: String,
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  sessionId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
})

pageViewSchema.index({ createdAt: -1 })
pageViewSchema.index({ path: 1 })
pageViewSchema.index({ sessionId: 1 })

// Contact Message Schema
export interface IContactMessage extends Document {
  name: string
  email: string
  phone?: string
  subject: string
  message: string
  status: 'new' | 'read' | 'replied'
  createdAt: Date
}

const contactMessageSchema = new Schema<IContactMessage>({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: String,
  subject: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['new', 'read', 'replied'], default: 'new' },
  createdAt: { type: Date, default: Date.now }
})

// Export models with lazy initialization to avoid "Cannot overwrite model" errors
export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', userSchema)
export const Category: Model<ICategory> = mongoose.models.Category || mongoose.model<ICategory>('Category', categorySchema)
export const SubCategory: Model<ISubCategory> = mongoose.models.SubCategory || mongoose.model<ISubCategory>('SubCategory', subCategorySchema)
export const Product: Model<IProduct> = mongoose.models.Product || mongoose.model<IProduct>('Product', productSchema)
export const Order: Model<IOrder> = mongoose.models.Order || mongoose.model<IOrder>('Order', orderSchema)
export const Review: Model<IReview> = mongoose.models.Review || mongoose.model<IReview>('Review', reviewSchema)
export const PageView: Model<IPageView> = mongoose.models.PageView || mongoose.model<IPageView>('PageView', pageViewSchema)
export const ContactMessage: Model<IContactMessage> = mongoose.models.ContactMessage || mongoose.model<IContactMessage>('ContactMessage', contactMessageSchema)

// Helper function to update product rating statistics
export async function updateProductRating(productId: mongoose.Types.ObjectId | string) {
  const reviews = await Review.find({ product: productId, status: 'approved' })
  
  if (reviews.length === 0) {
    await Product.findByIdAndUpdate(productId, {
      averageRating: 0,
      totalReviews: 0,
      ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    })
    return
  }

  const totalReviews = reviews.length
  const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
  
  const ratingBreakdown: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  reviews.forEach(review => {
    ratingBreakdown[review.rating]++
  })

  await Product.findByIdAndUpdate(productId, {
    averageRating: Math.round(averageRating * 10) / 10,
    totalReviews,
    ratingBreakdown
  })
}
