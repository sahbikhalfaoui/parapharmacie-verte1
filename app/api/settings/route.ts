import { NextRequest, NextResponse } from 'next/server'
import connectToDatabase from '@/lib/mongodb'
import { SiteSettings } from '@/lib/models'
import { requireAdmin } from '@/lib/auth'
import { uploadImageFromBase64 } from '@/lib/cloudinary'

export const dynamic = 'force-dynamic'

const EDITABLE = [
  'deliveryFee', 'freeDeliveryThreshold', 'heroImage',
  'contactPhone', 'contactEmail', 'contactAddress', 'contactWhatsapp', 'contactHours',
  'facebookUrl', 'instagramUrl',
] as const

async function getOrCreate() {
  let settings = await SiteSettings.findOne({ key: 'site' })
  if (!settings) settings = await SiteSettings.create({ key: 'site' })
  return settings
}

// Public: GET /api/settings
export async function GET() {
  try {
    await connectToDatabase()
    const settings = await getOrCreate()
    return NextResponse.json(settings.toObject(), { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('Settings GET error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// Admin: PUT /api/settings  (JSON body; heroImageBase64 uploads a new hero image)
export async function PUT(request: NextRequest) {
  const { error } = await requireAdmin(request)
  if (error) return error
  try {
    await connectToDatabase()
    const body = await request.json()
    const update: Record<string, any> = { updatedAt: new Date() }
    for (const k of EDITABLE) {
      if (body[k] !== undefined) update[k] = body[k]
    }
    if (update.deliveryFee !== undefined) update.deliveryFee = Math.max(0, Number(update.deliveryFee) || 0)
    if (update.freeDeliveryThreshold !== undefined) update.freeDeliveryThreshold = Math.max(0, Number(update.freeDeliveryThreshold) || 0)
    if (body.heroImageBase64) {
      update.heroImage = await uploadImageFromBase64(body.heroImageBase64, 'vitapharm/hero')
    }
    await getOrCreate()
    const settings = await SiteSettings.findOneAndUpdate({ key: 'site' }, { $set: update }, { new: true })
    return NextResponse.json({ message: 'Paramètres mis à jour', settings })
  } catch (error) {
    console.error('Settings PUT error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
