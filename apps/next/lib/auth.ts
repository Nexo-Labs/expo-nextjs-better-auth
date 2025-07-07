import { betterAuth } from 'better-auth'
import Database from 'better-sqlite3'

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET || 'your-secret-key-here-change-in-production',
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || 'dummy-client-id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy-client-secret',
    },
  },
})
