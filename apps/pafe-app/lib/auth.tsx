import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { Platform } from 'react-native';

// Esto es importante para que el navegador se cierre solo al terminar
WebBrowser.maybeCompleteAuthSession();

// --- CONFIGURACIÓN ---
const getDevBackendUrl = () => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000'
  }
  return 'http://localhost:3000'
}

const BACKEND_URL = __DEV__ ? getDevBackendUrl() : 'https://your-production-url.com';

// IDs de Cliente de Google (el de EXPO es para tu cliente de tipo "Aplicación Web")
const GOOGLE_CLIENT_ID_EXPO = '813421972874-j3k1u0h80tp7g19ie4ubt5g75k9b89fs.apps.googleusercontent.com';
const GOOGLE_CLIENT_ID_IOS = '813421972874-ccpthf3u8d4n8t4u3cc77m5e6t044tl3.apps.googleusercontent.com';
const GOOGLE_CLIENT_ID_ANDROID = '813421972874-2sjvp4319ttjd95759s8dif3ec056iq1.apps.googleusercontent.com';

// --- TIPOS Y KEYS ---
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

// --- CREACIÓN DEL CONTEXTO ---
const AuthContext = createContext<AuthState>({
  user: null,
  token: null,
  isLoading: true,
  signIn: async () => { },
  signOut: async () => { },
});

// --- EL PROVEEDOR DEL CONTEXTO (AQUÍ ESTÁ LA MAGIA) ---
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'com.pafe.app', // 🚨 ¡Asegúrate que coincide con el 'scheme' de tu app.json!
  });

  // Usamos el hook de expo-auth-session que se encarga de todo (PKCE, URIs, etc.)
  const [request, response, promptAsync] = Google.useAuthRequest({
    responseType: 'code', // Pedimos un 'code' para enviarlo a nuestro backend
    clientId: GOOGLE_CLIENT_ID_EXPO,
    iosClientId: GOOGLE_CLIENT_ID_IOS,
    androidClientId: GOOGLE_CLIENT_ID_ANDROID,
    scopes: ['openid', 'profile', 'email'],
    redirectUri: redirectUri
  });

  // Efecto para cargar el token almacenado al iniciar la app
  useEffect(() => {
    const loadStoredData = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
        if (storedToken) {
          // Validamos el token con nuestro backend
          const validatedUser = await validateTokenWithBackend(storedToken);
          if (validatedUser) {
            setToken(storedToken);
            setUser(validatedUser);
          } else {
            // El token es inválido, lo borramos
            await SecureStore.deleteItemAsync(TOKEN_KEY);
          }
        }
      } catch (e) {
        console.error("Failed to load stored auth data", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadStoredData();
  }, []);

  // Efecto que se dispara después de que el usuario interactúa con el login de Google
  useEffect(() => {
    const handleAuthResponse = async () => {
      if (response?.type === 'success') {
        const { code } = response.params;
        setIsLoading(true);
        try {
          // Enviamos el 'code' a nuestro propio backend para el login
          const { token: newToken, user: newUser } = await signInWithBackend(code, redirectUri);

          // Guardamos todo de forma segura y actualizamos el estado
          await SecureStore.setItemAsync(TOKEN_KEY, newToken);
          await SecureStore.setItemAsync(USER_KEY, JSON.stringify(newUser));
          setToken(newToken);
          setUser(newUser);
        } catch (error) {
          console.error("Authentication with backend failed", error);
        } finally {
          setIsLoading(false);
        }
      } else if (response?.type === 'error') {
        console.error("Google Auth Error:", response.error);
        setIsLoading(false);
      }
    };

    handleAuthResponse();
  }, [response]);

  const signIn = async () => {
    if (request) {
      await promptAsync();
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      // Opcional: podrías llamar a un endpoint de /logout en tu backend aquí
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
      setToken(null);
      setUser(null);
    } catch (e) {
      console.error("Failed to sign out", e);
    } finally {
      setIsLoading(false);
    }
  };

  const authState: AuthState = {
    user,
    token,
    isLoading,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={authState}>{children}</AuthContext.Provider>;
};

// --- HOOK PERSONALIZADO PARA USAR EL CONTEXTO ---
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};


// --- FUNCIONES DE API (Las he movido aquí dentro por claridad) ---

const signInWithBackend = async (code: string, redirectUri: string): Promise<{ token: string; user: User }> => {
  // El 'redirectUri' no es necesario si tu backend no lo valida de forma estricta.
  // La validación de PKCE ya asegura que la petición es legítima.
  const response = await fetch(`${BACKEND_URL}/api/auth/mobile/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, redirectUri }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Authentication failed: ${errorBody}`);
  }
  const data = await response.json();
  return { token: data.sessionToken, user: data.user };
};

const validateTokenWithBackend = async (token: string): Promise<User | null> => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/validate`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('Token validation error:', error);
    return null;
  }
};