"use client"

// API Configuration
export const API_BASE_URL = 'https://biopharma-backend.onrender.com/api'

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

// Set auth token
export const setAuthToken = (token: string, remember: boolean = true): void => {
  if (typeof window !== 'undefined') {
    if (remember) {
      localStorage.setItem('authToken', token);
      localStorage.setItem('adminToken', token);
    } else {
      sessionStorage.setItem('authToken', token);
      sessionStorage.setItem('adminToken', token);
    }
  }
}

// Clear all auth tokens
export const clearAuthToken = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('authToken');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('userData');
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('adminToken');
  }
}

// API helpers with better error handling
export const apiRequest = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const token = getAuthToken()
  
  console.log('API Request:', endpoint)
  console.log('Token available:', token ? 'Yes' : 'No')
  
  const headers: HeadersInit = {
    ...options.headers
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  } else {
    console.warn('No authentication token found!')
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
      // Don't automatically logout on 401 - might be temporary
      if (response.status === 401) {
        console.error('Authentication failed - token might be expired or invalid')
        console.log('Current token:', token?.substring(0, 20) + '...')
        throw new Error('Authentication issue - please login again')
      }
      
      const errorText = await response.text()
      console.error(`API Error ${response.status}:`, errorText)
      
      let errorMessage = `HTTP error! status: ${response.status}`
      try {
        const errorData = JSON.parse(errorText)
        errorMessage = errorData.error || errorData.message || errorMessage
      } catch {
        // If not JSON, use the text as is
      }
      
      throw new Error(errorMessage)
    }

    const data = await response.json()
    return data as T
  } catch (error) {
    console.error('API Request failed:', error)
    
    // Only show alert for network errors, not auth errors
    if (error instanceof Error && error.message.includes('Network') || error.message.includes('Failed to fetch')) {
      alert('Erreur de connexion au serveur. Veuillez réessayer.')
    }
    
    throw error
  }
}