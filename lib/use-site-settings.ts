"use client"

import { useEffect, useState } from 'react'

export interface SiteSettingsData {
  deliveryFee: number
  freeDeliveryThreshold: number
  heroImage?: string
  contactPhone?: string
  contactEmail?: string
  contactAddress?: string
  contactWhatsapp?: string
  contactHours?: string
  facebookUrl?: string
  instagramUrl?: string
}

export const DEFAULT_SITE_SETTINGS: SiteSettingsData = {
  deliveryFee: 15,
  freeDeliveryThreshold: 150,
  heroImage: '',
  contactPhone: '+216 26 744 525',
  contactEmail: 'biopharma.tunisie@gmail.com',
  contactAddress: '',
  contactWhatsapp: '',
  contactHours: '',
  facebookUrl: '',
  instagramUrl: '',
}

let cache: SiteSettingsData | null = null
let inflight: Promise<SiteSettingsData> | null = null

export function fetchSiteSettings(force = false): Promise<SiteSettingsData> {
  if (cache && !force) return Promise.resolve(cache)
  if (inflight && !force) return inflight
  inflight = fetch('/api/settings', { cache: 'no-store' })
    .then(r => (r.ok ? r.json() : {}))
    .then((data) => {
      const merged = { ...DEFAULT_SITE_SETTINGS }
      for (const [k, v] of Object.entries(data || {})) {
        if (k in merged && v !== null && v !== undefined && v !== '') (merged as any)[k] = v
      }
      cache = merged
      return merged
    })
    .catch(() => DEFAULT_SITE_SETTINGS)
    .finally(() => { inflight = null })
  return inflight
}

/** Public site settings (delivery fee, hero image, contact infos). Falls back to defaults until loaded. */
export function useSiteSettings(): SiteSettingsData {
  const [settings, setSettings] = useState<SiteSettingsData>(cache || DEFAULT_SITE_SETTINGS)
  useEffect(() => {
    let alive = true
    fetchSiteSettings().then(s => { if (alive) setSettings(s) })
    return () => { alive = false }
  }, [])
  return settings
}
