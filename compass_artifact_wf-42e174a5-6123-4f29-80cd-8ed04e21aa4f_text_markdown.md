# Implementación OAuth 2.0 con Google: Next.js + Better-Auth + Expo

La implementación de OAuth 2.0 con Google en una arquitectura Next.js backend y Expo móvil requiere una comprensión profunda del protocolo, las herramientas específicas y los patrones de integración. **Better-auth emerge como la solución más robusta para Next.js**, proporcionando características empresariales como soporte nativo para OAuth, gestión de sesiones, y integración con bases de datos, mientras que **Expo-auth-session se posiciona como el estándar para aplicaciones móviles** con implementación automática de PKCE y manejo seguro de tokens.

## Comprensión del protocolo OAuth 2.0 con Google

### Componentes fundamentales del protocolo

OAuth 2.0 funciona como un **framework de autorización** que permite a aplicaciones de terceros obtener acceso limitado a servicios HTTP sin exponer las credenciales del usuario. Los cuatro roles principales incluyen el Resource Owner (usuario final), el Client (aplicación móvil), el Authorization Server (Google), y el Resource Server (APIs de Google).

**Google OAuth 2.0 utiliza endpoints específicos** para diferentes fases del flujo: `https://accounts.google.com/o/oauth2/v2/auth` para autorización, `https://oauth2.googleapis.com/token` para intercambio de tokens, y `https://www.googleapis.com/oauth2/v2/userinfo` para obtener información del usuario. El protocolo soporta scopes granulares como `openid`, `profile`, `email`, y scopes específicos de servicios como `https://www.googleapis.com/auth/drive.file`.

### Flujo OAuth para aplicaciones móviles

Las aplicaciones móviles requieren el **Authorization Code Flow con PKCE** (Proof Key for Code Exchange) como medida de seguridad obligatoria. PKCE protege contra ataques de interceptación de códigos mediante la generación de un code_verifier criptográficamente aleatorio y su correspondiente code_challenge usando SHA256.

El flujo completo incluye: generación del code_verifier, creación del code_challenge, solicitud de autorización incluyendo el challenge, intercambio del código de autorización junto con el verifier original, y verificación por parte del servidor de autorización. **Este mecanismo es obligatorio** para todas las aplicaciones móviles según las especificaciones actuales de seguridad.

## Arquitectura con Next.js y Better-Auth

### Configuración de Better-Auth framework

Better-auth se presenta como una solución integral para autenticación en aplicaciones TypeScript, ofreciendo soporte nativo para más de 40 proveedores OAuth, gestión de sesiones basada en cookies, y características empresariales como autenticación de dos factores y soporte multi-tenant.

```typescript
// lib/auth.ts
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      scope: ["email", "profile"],
      mapProfileToUser: (profile) => ({
        firstName: profile.given_name,
        lastName: profile.family_name,
        email: profile.email,
        image: profile.picture,
      }),
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 días
    updateAge: 60 * 60 * 24, // Actualizar cada día
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutos
    },
  },
});
```

### Configuración de endpoints en Next.js

Better-auth simplifica la configuración de endpoints mediante su handler unificado. **Para App Router**, se utiliza un archivo catch-all que maneja todas las rutas de autenticación:

```typescript
// app/api/auth/[...all]/route.ts
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth.handler);
```

### Integración con bases de datos

Better-auth soporta múltiples adaptadores de base de datos incluyendo Prisma, Drizzle, y Kysely. **La configuración con Prisma** requiere esquemas específicos para usuarios, cuentas y sesiones:

```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  accounts Account[]
  sessions Session[]
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([provider, providerAccountId])
}
```

## Implementación en Expo móvil

### Configuración de expo-auth-session

Expo-auth-session proporciona una API unificada para flujos OAuth con soporte automático de PKCE y manejo de redirecciones. **La configuración básica** requiere la instalación de dependencias específicas y configuración de esquemas de URL:

```bash
npx expo install expo-auth-session expo-crypto expo-secure-store
```

### Implementación del flujo OAuth en Expo

```javascript
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';

WebBrowser.maybeCompleteAuthSession();

const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
};

export const useGoogleAuth = () => {
  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: 'YOUR_GOOGLE_CLIENT_ID',
      scopes: ['openid', 'profile', 'email'],
      redirectUri: AuthSession.makeRedirectUri({ 
        scheme: 'yourapp' 
      }),
    },
    discovery
  );

  React.useEffect(() => {
    if (response?.type === 'success') {
      const { code } = response.params;
      exchangeCodeForToken(code);
    }
  }, [response]);

  return { request, promptAsync };
};
```

### Configuración de app.json para OAuth

```json
{
  "expo": {
    "name": "MyApp",
    "slug": "my-app",
    "scheme": "myapp",
    "version": "1.0.0",
    "platforms": ["ios", "android"],
    "ios": {
      "bundleIdentifier": "com.yourcompany.yourapp"
    },
    "android": {
      "package": "com.yourcompany.yourapp"
    }
  }
}
```

## Flujo completo de autenticación móvil

### Intercambio de código de autorización

El patrón recomendado para aplicaciones móviles implica **enviar el código de autorización al backend** para el intercambio seguro de tokens. Esto mantiene el client_secret fuera del código de la aplicación móvil:

```javascript
// Frontend: Enviar código al backend
const exchangeCodeForToken = async (code) => {
  try {
    const response = await fetch('https://your-backend.com/api/auth/mobile/signin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        code,
        redirectUri: AuthSession.makeRedirectUri({ scheme: 'yourapp' })
      }),
    });
    
    const tokens = await response.json();
    await SecureStore.setItemAsync('sessionToken', tokens.sessionToken);
  } catch (error) {
    console.error('Token exchange failed:', error);
  }
};
```

### Endpoint de intercambio en Next.js

```javascript
// pages/api/auth/mobile/signin.js
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  const { code, redirectUri } = req.body;
  
  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await tokenResponse.json();
    
    // Obtener información del usuario
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    const user = await userResponse.json();
    
    // Crear token de sesión para la aplicación móvil
    const sessionToken = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(200).json({
      success: true,
      sessionToken,
      user,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

## Gestión de tokens y sesiones

### Almacenamiento seguro en móvil

**Expo SecureStore** proporciona almacenamiento seguro multiplataforma utilizando Keychain Services en iOS y SharedPreferences encriptadas en Android:

```javascript
import * as SecureStore from 'expo-secure-store';

class TokenManager {
  static async storeTokens(tokens) {
    await SecureStore.setItemAsync('access_token', tokens.accessToken);
    await SecureStore.setItemAsync('refresh_token', tokens.refreshToken);
    await SecureStore.setItemAsync('token_expiry', tokens.expiresAt.toString());
  }

  static async getAccessToken() {
    return await SecureStore.getItemAsync('access_token');
  }

  static async isTokenValid() {
    const expiryStr = await SecureStore.getItemAsync('token_expiry');
    if (!expiryStr) return false;
    
    const expiry = parseInt(expiryStr);
    return Date.now() < expiry;
  }
}
```

### Actualización automática de tokens

```javascript
static async refreshToken() {
  const refreshToken = await SecureStore.getItemAsync('refresh_token');
  if (!refreshToken) throw new Error('No refresh token available');

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: 'your-client-id',
    }),
  });

  const tokens = await response.json();
  
  if (response.ok) {
    await this.storeTokens({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || refreshToken,
      expiresAt: Date.now() + (tokens.expires_in * 1000),
    });
    return tokens.access_token;
  }
}
```

## Página de ejemplo en Expo

### Componente de autenticación completo

```javascript
// screens/AuthScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useGoogleAuth } from '../hooks/useGoogleAuth';

export default function AuthScreen() {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const { request, promptAsync } = useGoogleAuth();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await SecureStore.getItemAsync('sessionToken');
      if (token) {
        // Verificar token con el backend
        const response = await fetch('https://your-backend.com/api/protected/user', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData.user);
          setAccessToken(token);
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (!request) return;
    
    try {
      setLoading(true);
      await promptAsync();
    } catch (error) {
      Alert.alert('Error', 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await SecureStore.deleteItemAsync('sessionToken');
      setUser(null);
      setAccessToken(null);
    } catch (error) {
      Alert.alert('Error', 'Sign out failed');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {user ? (
        <View style={styles.userInfo}>
          <Text style={styles.title}>Welcome, {user.name}!</Text>
          <Text style={styles.email}>{user.email}</Text>
          <View style={styles.tokenContainer}>
            <Text style={styles.tokenLabel}>Access Token:</Text>
            <Text style={styles.tokenText} numberOfLines={3}>
              {accessToken}
            </Text>
          </View>
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Text style={styles.buttonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.signInContainer}>
          <Text style={styles.title}>Welcome</Text>
          <TouchableOpacity
            style={styles.signInButton}
            onPress={handleSignIn}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Signing in...' : 'Login with Google'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  userInfo: {
    alignItems: 'center',
    width: '100%',
  },
  signInContainer: {
    alignItems: 'center',
  },
  signInButton: {
    backgroundColor: '#4285F4',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  signOutButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tokenContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#e9ecef',
    borderRadius: 8,
    width: '100%',
  },
  tokenLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  tokenText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#495057',
  },
});
```

## Consideraciones de seguridad críticas

### Implementación de PKCE obligatoria

**Todas las aplicaciones móviles deben implementar PKCE** para proteger contra ataques de interceptación de códigos. Expo-auth-session implementa PKCE automáticamente, pero es crucial verificar que está habilitado:

```javascript
const [request, response, promptAsync] = AuthSession.useAuthRequest(
  {
    clientId: 'YOUR_CLIENT_ID',
    scopes: ['openid', 'profile', 'email'],
    redirectUri: AuthSession.makeRedirectUri({ scheme: 'yourapp' }),
    // PKCE se implementa automáticamente
    usePKCE: true, // Valor por defecto
  },
  discovery
);
```

### Validación de redirect URIs

**La configuración de redirect URIs debe ser exacta** entre el proveedor OAuth y la aplicación. Los esquemas de URL deben coincidir precisamente:

- Desarrollo: `yourapp://auth-callback`
- Producción: `yourapp://auth-callback`
- Google Cloud Console debe incluir ambos URIs

### Almacenamiento seguro de tokens

**Nunca almacenar tokens en AsyncStorage** o almacenamiento no seguro. Usar exclusivamente SecureStore para datos sensibles y implementar validación de tokens en el backend para todas las solicitudes autenticadas.

## Conclusión

La implementación de OAuth 2.0 con Google en una arquitectura Next.js y Expo requiere una comprensión profunda de los componentes de seguridad, la configuración adecuada de herramientas como better-auth y expo-auth-session, y la implementación de mejores prácticas de seguridad. **Better-auth simplifica significativamente** la configuración del backend OAuth, mientras que **expo-auth-session proporciona una API robusta** para el flujo móvil con implementación automática de PKCE. La combinación de estas herramientas, junto con el manejo adecuado de tokens y la validación de seguridad, resulta en una implementación OAuth empresarial completa y segura.