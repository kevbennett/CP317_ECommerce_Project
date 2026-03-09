import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type UserProfile = {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  profile: {
    phone: string
    shipping_address: string
    shipping_city: string
    shipping_province: string
    shipping_postal: string
    shipping_country: string
    billing_address: string
    billing_city: string
    billing_province: string
    billing_postal: string
    billing_country: string
  }
}

type SignupPayload = {
  username: string
  email: string
  password: string
  first_name?: string
  last_name?: string
}

type AuthContextValue = {
  user: UserProfile | null
  token: string | null
  loading: boolean
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  signup: (payload: SignupPayload) => Promise<void>
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
}

type AuthResponse = {
  token: string
  user: UserProfile
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'
const TOKEN_STORAGE_KEY = 'authToken'

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

async function parseError(response: Response): Promise<string> {
  try {
    const data = await response.json()
    if (typeof data?.error === 'string') return data.error
    if (typeof data?.detail === 'string') return data.detail
    if (typeof data === 'object' && data !== null) {
      const firstError = Object.values(data).flat().find((v) => typeof v === 'string')
      if (typeof firstError === 'string') return firstError
    }
  } catch {
    // no-op, fallback to status
  }
  return `Request failed with status ${response.status}`
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const persistToken = useCallback((nextToken: string | null) => {
    setToken(nextToken)
    if (nextToken) {
      localStorage.setItem(TOKEN_STORAGE_KEY, nextToken)
      return
    }
    localStorage.removeItem(TOKEN_STORAGE_KEY)
  }, [])

  const clearAuth = useCallback(() => {
    persistToken(null)
    setUser(null)
  }, [persistToken])

  const refreshProfile = useCallback(async () => {
    const activeToken = token ?? localStorage.getItem(TOKEN_STORAGE_KEY)
    if (!activeToken) {
      clearAuth()
      return
    }

    const response = await fetch(`${API_BASE_URL}/users/profile/`, {
      method: 'GET',
      headers: {
        Authorization: `Token ${activeToken}`,
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      clearAuth()
      throw new Error(await parseError(response))
    }

    const data = (await response.json()) as UserProfile
    setUser(data)
    persistToken(activeToken)
  }, [clearAuth, persistToken, token])

  const login = useCallback(
    async (username: string, password: string) => {
      const response = await fetch(`${API_BASE_URL}/users/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      if (!response.ok) {
        throw new Error(await parseError(response))
      }

      const data = (await response.json()) as AuthResponse
      persistToken(data.token)
      setUser(data.user)
    },
    [persistToken]
  )

  const signup = useCallback(
    async (payload: SignupPayload) => {
      const response = await fetch(`${API_BASE_URL}/users/register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(await parseError(response))
      }

      const data = (await response.json()) as AuthResponse
      persistToken(data.token)
      setUser(data.user)
    },
    [persistToken]
  )

  const logout = useCallback(async () => {
    const activeToken = token ?? localStorage.getItem(TOKEN_STORAGE_KEY)

    if (activeToken) {
      await fetch(`${API_BASE_URL}/users/logout/`, {
        method: 'POST',
        headers: {
          Authorization: `Token ${activeToken}`,
          Accept: 'application/json',
        },
      }).catch(() => undefined)
    }

    clearAuth()
  }, [clearAuth, token])

  useEffect(() => {
    const init = async () => {
      const stored = localStorage.getItem(TOKEN_STORAGE_KEY)
      if (!stored) {
        setLoading(false)
        return
      }

      try {
        persistToken(stored)
        await refreshProfile()
      } catch {
        clearAuth()
      } finally {
        setLoading(false)
      }
    }

    void init()
  }, [clearAuth, persistToken, refreshProfile])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(user && token),
      login,
      signup,
      logout,
      refreshProfile,
    }),
    [loading, login, logout, refreshProfile, signup, token, user]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
