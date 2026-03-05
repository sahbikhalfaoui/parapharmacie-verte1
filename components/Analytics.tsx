"use client"
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

// Generate a session ID for tracking unique visitors
function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  
  let sessionId = sessionStorage.getItem('analytics_session_id')
  
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`
    sessionStorage.setItem('analytics_session_id', sessionId)
  }
  
  return sessionId
}

export default function Analytics() {
  const pathname = usePathname()

  useEffect(() => {
    // Track page view
    const trackPageView = async () => {
      try {
        const sessionId = getSessionId()
        
        await fetch('/api/analytics/track', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            page: document.title,
            path: pathname,
            referrer: document.referrer,
            sessionId
          }),
        })
      } catch (error) {
        // Silent fail - don't disrupt user experience
        console.error('Analytics tracking error:', error)
      }
    }

    trackPageView()
  }, [pathname])

  return null
}
