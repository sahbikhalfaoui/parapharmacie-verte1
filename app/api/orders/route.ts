import { NextRequest, NextResponse } from 'next/server'
import connectToDatabase from '@/lib/mongodb'
import { Order, SiteSettings, User } from '@/lib/models'
import { getAuthUser } from '@/lib/auth'

const clean = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()

    const body = await request.json()
    const items = Array.isArray(body.items) ? body.items : []
    if (items.length === 0) {
      return NextResponse.json({ error: 'Le panier est vide' }, { status: 400 })
    }

    const info = body.customerInfo || {}
    const customerInfo = {
      fullName: clean(info.fullName),
      phone: clean(info.phone),
      email: clean(info.email),
      address: clean(info.address),
      city: clean(info.city),
      notes: clean(info.notes),
    }
    if (!customerInfo.fullName || !customerInfo.phone || !customerInfo.address || !customerInfo.city) {
      return NextResponse.json({ error: 'Veuillez remplir tous les champs obligatoires' }, { status: 400 })
    }

    // Totals are computed server-side (delivery fee from admin settings)
    const totalPrice = Math.round(items.reduce((sum: number, item: any) => {
      const price = parseFloat(String(item.price)) || 0
      const qty = Math.max(1, parseInt(String(item.quantity), 10) || 1)
      return sum + price * qty
    }, 0) * 1000) / 1000

    const settings = await SiteSettings.findOne({ key: 'site' }).lean<any>()
    const baseFee = typeof settings?.deliveryFee === 'number' ? settings.deliveryFee : 15
    const threshold = typeof settings?.freeDeliveryThreshold === 'number' ? settings.freeDeliveryThreshold : 150
    const deliveryFee = threshold > 0 && totalPrice >= threshold ? 0 : baseFee
    const finalTotal = Math.round((totalPrice + deliveryFee) * 1000) / 1000

    // Attach the logged-in user (if any) and remember their delivery details
    const authUser = await getAuthUser(request)

    const order = new Order({
      user: authUser?._id,
      items: items.map((item: any) => ({
        product: item.product,
        name: item.name,
        price: String(item.price),
        quantity: Math.max(1, parseInt(String(item.quantity), 10) || 1),
      })),
      customerInfo,
      totalPrice,
      deliveryFee,
      finalTotal,
      paymentMethod: 'COD',
    })
    await order.save()

    let updatedUser = null
    if (authUser) {
      try {
        const update: Record<string, string> = {
          phone: customerInfo.phone,
          address: customerInfo.address,
          city: customerInfo.city,
        }
        if (!clean(authUser.name)) update.name = customerInfo.fullName
        const saved = await User.findByIdAndUpdate(authUser._id, { $set: update }, { new: true }).select('-password')
        if (saved) {
          updatedUser = {
            id: saved._id,
            name: saved.name,
            email: saved.email,
            role: saved.role,
            phone: saved.phone,
            address: saved.address,
            city: saved.city,
          }
        }
      } catch (e) {
        console.error('Update user profile from order error:', e)
      }
    }

    return NextResponse.json({ message: 'Commande créée avec succès', order, user: updatedUser }, { status: 201 })
  } catch (error) {
    console.error('Create order error:', error)
    return NextResponse.json({ error: 'Erreur lors de la création de la commande' }, { status: 500 })
  }
}
