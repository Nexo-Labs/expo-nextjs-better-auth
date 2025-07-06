import * as SecureStore from 'expo-secure-store'

interface User {
  id: string
  email: string
  name: string
  picture?: string
}

class TokenManager {
  static async storeTokens(tokens: { sessionToken: string; user: User }) {
    await SecureStore.setItemAsync('sessionToken', tokens.sessionToken)
    await SecureStore.setItemAsync('user', JSON.stringify(tokens.user))
  }

  static async getSessionToken(): Promise<string | null> {
    return await SecureStore.getItemAsync('sessionToken')
  }

  static async getUser(): Promise<User | null> {
    const userStr = await SecureStore.getItemAsync('user')
    if (!userStr) return null

    try {
      return JSON.parse(userStr)
    } catch {
      return null
    }
  }

  static async isAuthenticated(): Promise<boolean> {
    const token = await this.getSessionToken()
    return !!token
  }

  static async clearTokens() {
    await SecureStore.deleteItemAsync('sessionToken')
    await SecureStore.deleteItemAsync('user')
  }

  static async validateToken(): Promise<boolean> {
    const token = await this.getSessionToken()
    if (!token) return false

    try {
      const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3001'
      const response = await fetch(`${BACKEND_URL}/api/auth/validate`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      return response.ok
    } catch {
      return false
    }
  }
}

export default TokenManager
