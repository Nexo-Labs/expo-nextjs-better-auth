import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import TokenManager from '../utils/TokenManager'
import * as AuthSession from 'expo-auth-session'
import * as WebBrowser from 'expo-web-browser'
import { Alert } from 'react-native'

WebBrowser.maybeCompleteAuthSession()

const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
}

const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || ''
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3001'

interface User {
  id: string
  email: string
  name: string
  picture?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  refreshAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: GOOGLE_CLIENT_ID,
      scopes: ['openid', 'profile', 'email'],
      redirectUri: AuthSession.makeRedirectUri({
        scheme: 'yourprojectsname',
      }),
    },
    discovery
  )

  useEffect(() => {
    checkAuthStatus()
  }, [])

  useEffect(() => {
    if (response?.type === 'success') {
      const { code } = response.params
      handleCodeExchange(code)
    }
  }, [response])

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true)
      const isValid = await TokenManager.validateToken()

      if (isValid) {
        const userData = await TokenManager.getUser()
        setUser(userData)
      } else {
        await TokenManager.clearTokens()
        setUser(null)
      }
    } catch (error) {
      console.error('Auth check error:', error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCodeExchange = async (code: string) => {
    try {
      setIsLoading(true)
      const response = await fetch(`${BACKEND_URL}/api/auth/mobile/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          redirectUri: AuthSession.makeRedirectUri({ scheme: 'yourprojectsname' }),
        }),
      })

      if (!response.ok) {
        throw new Error('Token exchange failed')
      }

      const tokens = await response.json()
      await TokenManager.storeTokens({
        sessionToken: tokens.sessionToken,
        user: tokens.user,
      })

      setUser(tokens.user)
    } catch (error) {
      console.error('Token exchange failed:', error)
      Alert.alert('Error', 'No se pudo iniciar sesión con Google')
    } finally {
      setIsLoading(false)
    }
  }

  const signInWithGoogle = async () => {
    try {
      if (!request) {
        Alert.alert('Error', 'La autenticación no está configurada correctamente')
        return
      }

      setIsLoading(true)
      await promptAsync()
    } catch (error) {
      console.error('Sign in error:', error)
      Alert.alert('Error', 'Error al iniciar sesión')
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setIsLoading(true)
      await TokenManager.clearTokens()
      setUser(null)
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const refreshAuth = async () => {
    await checkAuthStatus()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signInWithGoogle,
        signOut,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
