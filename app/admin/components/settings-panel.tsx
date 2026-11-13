"use client"
import React, { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ImageIcon, ShoppingCartIcon, UsersIcon } from "./icons"
import { apiRequest } from "../lib/api"

interface Settings {
  deliveryFee: number
  freeDeliveryThreshold: number
  heroImage: string
  contactPhone: string
  contactEmail: string
  contactAddress: string
  contactWhatsapp: string
  contactHours: string
  facebookUrl: string
  instagramUrl: string
}

type Feedback = { type: "success" | "error"; message: string } | null

const MAX_IMAGE_SIZE = 5 * 1024 * 1024

const CONTACT_FIELDS: { key: keyof Settings; label: string; placeholder: string; type?: string; wide?: boolean }[] = [
  { key: "contactPhone", label: "Téléphone", placeholder: "+216 00 000 000", type: "tel" },
  { key: "contactEmail", label: "Email", placeholder: "contact@exemple.com", type: "email" },
  { key: "contactWhatsapp", label: "WhatsApp", placeholder: "+216 00 000 000", type: "tel" },
  { key: "contactHours", label: "Horaires", placeholder: "Lun - Sam : 8h - 20h" },
  { key: "contactAddress", label: "Adresse", placeholder: "Rue, ville, Tunisie", wide: true },
  { key: "facebookUrl", label: "Facebook (URL)", placeholder: "https://facebook.com/...", type: "url" },
  { key: "instagramUrl", label: "Instagram (URL)", placeholder: "https://instagram.com/...", type: "url" },
]

const errMsg = (e: unknown) => (e instanceof Error ? e.message : "Une erreur est survenue")

function FeedbackLine({ feedback }: { feedback: Feedback }) {
  if (!feedback) return null
  return (
    <p className={`text-sm ${feedback.type === "success" ? "text-green-600" : "text-red-600"}`}>
      {feedback.message}
    </p>
  )
}

export default function SettingsPanel() {
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")

  // Livraison
  const [deliveryFee, setDeliveryFee] = useState("")
  const [freeThreshold, setFreeThreshold] = useState("")
  const [savingDelivery, setSavingDelivery] = useState(false)
  const [deliveryFeedback, setDeliveryFeedback] = useState<Feedback>(null)

  // Hero
  const [heroImage, setHeroImage] = useState("")
  const [heroPreview, setHeroPreview] = useState("")
  const [savingHero, setSavingHero] = useState(false)
  const [heroFeedback, setHeroFeedback] = useState<Feedback>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Contact
  const [contact, setContact] = useState<Record<string, string>>({})
  const [savingContact, setSavingContact] = useState(false)
  const [contactFeedback, setContactFeedback] = useState<Feedback>(null)

  const applySettings = (s: Partial<Settings>) => {
    setDeliveryFee(String(s.deliveryFee ?? 0))
    setFreeThreshold(String(s.freeDeliveryThreshold ?? 0))
    setHeroImage(s.heroImage || "")
    const c: Record<string, string> = {}
    CONTACT_FIELDS.forEach(f => { c[f.key] = String(s[f.key] ?? "") })
    setContact(c)
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch("/api/settings", { cache: "no-store" })
        if (!res.ok) throw new Error(`Erreur ${res.status}`)
        const data: Partial<Settings> = await res.json()
        if (!cancelled) applySettings(data)
      } catch (e) {
        if (!cancelled) setLoadError(`Impossible de charger les paramètres : ${errMsg(e)}`)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const save = async (body: Record<string, unknown>) => {
    const res = await apiRequest<{ settings: Partial<Settings> }>("/settings", {
      method: "PUT",
      body: JSON.stringify(body),
    })
    return res.settings
  }

  const saveDelivery = async (e: React.FormEvent) => {
    e.preventDefault()
    setDeliveryFeedback(null)
    const fee = Number(deliveryFee)
    const threshold = Number(freeThreshold)
    if (!Number.isFinite(fee) || fee < 0 || !Number.isFinite(threshold) || threshold < 0) {
      setDeliveryFeedback({ type: "error", message: "Veuillez saisir des montants valides (≥ 0)." })
      return
    }
    setSavingDelivery(true)
    try {
      const s = await save({ deliveryFee: Math.round(fee * 1000) / 1000, freeDeliveryThreshold: Math.round(threshold * 1000) / 1000 })
      if (s) {
        setDeliveryFee(String(s.deliveryFee ?? fee))
        setFreeThreshold(String(s.freeDeliveryThreshold ?? threshold))
      }
      setDeliveryFeedback({ type: "success", message: "Paramètres de livraison enregistrés." })
    } catch (err) {
      setDeliveryFeedback({ type: "error", message: errMsg(err) })
    } finally {
      setSavingDelivery(false)
    }
  }

  const onHeroFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHeroFeedback(null)
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      setHeroFeedback({ type: "error", message: "Veuillez choisir un fichier image." })
      e.target.value = ""
      return
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setHeroFeedback({ type: "error", message: "L'image ne doit pas dépasser 5 Mo." })
      e.target.value = ""
      return
    }
    const reader = new FileReader()
    reader.onload = () => setHeroPreview(typeof reader.result === "string" ? reader.result : "")
    reader.onerror = () => setHeroFeedback({ type: "error", message: "Lecture du fichier impossible." })
    reader.readAsDataURL(file)
  }

  const cancelHeroPreview = () => {
    setHeroPreview("")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const saveHero = async () => {
    if (!heroPreview) return
    setHeroFeedback(null)
    setSavingHero(true)
    try {
      const s = await save({ heroImageBase64: heroPreview })
      setHeroImage(s?.heroImage || "")
      cancelHeroPreview()
      setHeroFeedback({ type: "success", message: "Image du hero mise à jour." })
    } catch (err) {
      setHeroFeedback({ type: "error", message: errMsg(err) })
    } finally {
      setSavingHero(false)
    }
  }

  const resetHero = async () => {
    if (!confirm("Rétablir l'image par défaut du hero ?")) return
    setHeroFeedback(null)
    setSavingHero(true)
    try {
      await save({ heroImage: "" })
      setHeroImage("")
      cancelHeroPreview()
      setHeroFeedback({ type: "success", message: "Image par défaut rétablie." })
    } catch (err) {
      setHeroFeedback({ type: "error", message: errMsg(err) })
    } finally {
      setSavingHero(false)
    }
  }

  const saveContact = async (e: React.FormEvent) => {
    e.preventDefault()
    setContactFeedback(null)
    setSavingContact(true)
    try {
      const body: Record<string, string> = {}
      CONTACT_FIELDS.forEach(f => { body[f.key] = (contact[f.key] || "").trim() })
      const s = await save(body)
      if (s) applyContact(s)
      setContactFeedback({ type: "success", message: "Informations de contact enregistrées." })
    } catch (err) {
      setContactFeedback({ type: "error", message: errMsg(err) })
    } finally {
      setSavingContact(false)
    }
  }

  const applyContact = (s: Partial<Settings>) => {
    const c: Record<string, string> = {}
    CONTACT_FIELDS.forEach(f => { c[f.key] = String(s[f.key] ?? "") })
    setContact(c)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-green-600" />
      </div>
    )
  }

  const shownHero = heroPreview || heroImage
  const freeNum = Number(freeThreshold)

  return (
    <div className="space-y-6">
      {loadError && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{loadError}</div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Livraison */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShoppingCartIcon className="h-5 w-5 text-green-600" />
              Livraison
            </CardTitle>
            <CardDescription>Frais de livraison et seuil de livraison gratuite.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveDelivery} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="deliveryFee">Frais de livraison (TND)</Label>
                  <Input
                    id="deliveryFee"
                    type="number"
                    min="0"
                    step="0.001"
                    value={deliveryFee}
                    onChange={e => setDeliveryFee(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="freeThreshold">Livraison gratuite dès (TND)</Label>
                  <Input
                    id="freeThreshold"
                    type="number"
                    min="0"
                    step="0.001"
                    value={freeThreshold}
                    onChange={e => setFreeThreshold(e.target.value)}
                    required
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500">
                {freeNum > 0
                  ? `Livraison gratuite pour les commandes à partir de ${freeNum.toFixed(3)} TND.`
                  : "Seuil à 0 : la livraison n'est jamais gratuite."}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" disabled={savingDelivery} className="bg-green-600 hover:bg-green-700 text-white">
                  {savingDelivery ? "Enregistrement..." : "Enregistrer"}
                </Button>
                <FeedbackLine feedback={deliveryFeedback} />
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Hero */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ImageIcon className="h-5 w-5 text-green-600" />
              Image du Hero
            </CardTitle>
            <CardDescription>Image principale de la page d'accueil (max 5 Mo).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
              {shownHero ? (
                <img src={shownHero} alt="Aperçu du hero" className="h-40 w-full object-cover sm:h-48" />
              ) : (
                <div className="flex h-40 flex-col items-center justify-center gap-2 text-gray-500 sm:h-48">
                  <ImageIcon className="h-8 w-8" />
                  <p className="text-sm">L'image par défaut est utilisée.</p>
                </div>
              )}
              {heroPreview && (
                <span className="absolute left-2 top-2 rounded bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                  Aperçu (non enregistré)
                </span>
              )}
            </div>
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={onHeroFileChange}
              disabled={savingHero}
              className="cursor-pointer"
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                onClick={saveHero}
                disabled={!heroPreview || savingHero}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {savingHero ? "Enregistrement..." : "Enregistrer l'image"}
              </Button>
              {heroPreview && (
                <Button type="button" variant="outline" onClick={cancelHeroPreview} disabled={savingHero}>
                  Annuler
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={resetHero}
                disabled={savingHero || (!heroImage && !heroPreview)}
              >
                Rétablir l'image par défaut
              </Button>
            </div>
            <FeedbackLine feedback={heroFeedback} />
          </CardContent>
        </Card>
      </div>

      {/* Contact */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <UsersIcon className="h-5 w-5 text-green-600" />
            Informations de contact
          </CardTitle>
          <CardDescription>Coordonnées affichées sur le site (pied de page, page contact).</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveContact} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {CONTACT_FIELDS.map(f => (
                <div key={f.key} className={`space-y-1.5 ${f.wide ? "sm:col-span-2" : ""}`}>
                  <Label htmlFor={f.key}>{f.label}</Label>
                  <Input
                    id={f.key}
                    type={f.type || "text"}
                    placeholder={f.placeholder}
                    value={contact[f.key] || ""}
                    onChange={e => setContact(prev => ({ ...prev, [f.key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={savingContact} className="bg-green-600 hover:bg-green-700 text-white">
                {savingContact ? "Enregistrement..." : "Enregistrer"}
              </Button>
              <FeedbackLine feedback={contactFeedback} />
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
