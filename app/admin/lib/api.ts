"use client"

// API Configuration
export const API_BASE_URL = 'http://localhost:5000/api'

// Get auth token from localStorage
export const getAuthToken = (): string => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('adminToken') || 
           localStorage.getItem('authToken') ||
           sessionStorage.getItem('adminToken') ||
           sessionStorage.getItem('authToken') ||
           ''
  }
  return ''
}

// API helpers with better error handling
export const apiRequest = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const token = getAuthToken()
  const headers: HeadersInit = {
    ...options.headers
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include'
    })

    if (!response.ok) {
      if (response.status === 401) {
        console.error('Authentication failed - redirecting to login')
        if (typeof window !== 'undefined') {
          localStorage.removeItem('adminToken')
          localStorage.removeItem('authToken')
          sessionStorage.removeItem('adminToken')
          sessionStorage.removeItem('authToken')
          window.location.href = '/?redirect=admin'
        }
        throw new Error('Authentication required - please login again')
      }
      
      const errorText = await response.text()
      console.error(`API Error ${response.status}:`, errorText)
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json() as T
  } catch (error) {
    console.error('API Request failed:', error)
    
    if (!(error instanceof Error) || !error.message.includes('Authentication required')) {
      alert('Erreur de connexion au serveur. Veuillez réessayer.')
    }
    
    throw error
  }
}